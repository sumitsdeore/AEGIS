import { classifyStereotype, deriveSpringInsights, layerForStereotype, layerRank } from "../model/insights";
import { assert, assertEqual, suite, test } from "./harness";
import { loadSampleResponse, makeField, makeMethod, makeProject, makeType } from "./fixtures";
import { hasParsedProject } from "../types/analyzer";

suite("Spring stereotype classification", () => {
  test("prefers the most specific annotation", () => {
    // @SpringBootApplication is also a @Configuration; reporting it as config
    // would hide the application entry point.
    assertEqual(
      classifyStereotype(makeType({ qualifiedName: "app.App", annotations: ["SpringBootApplication", "Configuration"] }))?.id,
      "application"
    );

    // @RestController is a @Controller; the REST distinction is the useful one.
    assertEqual(
      classifyStereotype(makeType({ qualifiedName: "app.web.C", annotations: ["Controller", "RestController"] }))?.id,
      "restController"
    );
  });

  test("recognises each core stereotype", () => {
    const cases: [string, string][] = [
      ["Service", "service"],
      ["Repository", "repository"],
      ["Component", "component"],
      ["Configuration", "configuration"],
      ["Entity", "entity"],
      ["Aspect", "aspect"],
      ["ConfigurationProperties", "configurationProperties"],
      // @ControllerAdvice also matches @Component's definition; the more
      // specific advice stereotype must win.
      ["ControllerAdvice", "advice"],
      ["RestControllerAdvice", "advice"]
    ];

    for (const [annotation, expected] of cases) {
      assertEqual(
        classifyStereotype(makeType({ qualifiedName: "app.X", annotations: [annotation] }))?.id,
        expected,
        `@${annotation} should classify as ${expected}`
      );
    }
  });

  test("returns undefined for a plain type", () => {
    assertEqual(classifyStereotype(makeType({ qualifiedName: "app.domain.Order" })), undefined);
  });
});

suite("Spring insights", () => {
  test("detects a Spring project and tallies stereotypes", () => {
    const project = makeProject([
      { qualifiedName: "app.App", annotations: ["SpringBootApplication"] },
      { qualifiedName: "app.web.OrderController", annotations: ["RestController"], methods: [makeMethod("list", "List<Order>", [], ["GetMapping"])] },
      { qualifiedName: "app.service.OrderService", annotations: ["Service"], methods: [makeMethod("save", "void", ["Order"], ["Transactional"])] }
    ]);

    const insights = deriveSpringInsights(project);

    assertEqual(insights.isSpringProject, true);
    assertEqual(insights.components.length, 3);
    assertEqual(insights.transactionalMethodCount, 1);
  });

  test("reports a plain Java project as non-Spring", () => {
    const insights = deriveSpringInsights(
      makeProject([{ qualifiedName: "lib.Util", methods: [makeMethod("helper")] }])
    );

    assertEqual(insights.isSpringProject, false);
    assertEqual(insights.components.length, 0);
    assertEqual(insights.endpoints.length, 0);
  });

  test("labels naming-based repository detection as a heuristic", () => {
    // Spring Data interfaces carry no annotation at all. Detecting them is
    // valuable, but the dashboard must not present a guess as a fact.
    const insights = deriveSpringInsights(
      makeProject([{ qualifiedName: "app.repository.OrderRepository", kind: "INTERFACE" }])
    );

    assertEqual(insights.components.length, 1);
    assertEqual(insights.components[0].detectedVia, "naming");
    assertEqual(insights.components[0].layer, "persistence");
  });

  test("trusts an annotation over a name", () => {
    const insights = deriveSpringInsights(
      makeProject([{ qualifiedName: "app.repository.OrderRepository", kind: "INTERFACE", annotations: ["Repository"] }])
    );

    assertEqual(insights.components[0].detectedVia, "annotation");
  });

  test("maps mapping annotations to HTTP verbs", () => {
    const project = makeProject([
      {
        qualifiedName: "app.web.OrderController",
        annotations: ["RestController"],
        methods: [
          makeMethod("list", "List<Order>", [], ["GetMapping"]),
          makeMethod("create", "Order", ["Order"], ["PostMapping"]),
          makeMethod("replace", "Order", ["Order"], ["PutMapping"]),
          makeMethod("patch", "Order", ["Order"], ["PatchMapping"]),
          makeMethod("remove", "void", ["long"], ["DeleteMapping"]),
          makeMethod("any", "Order", [], ["RequestMapping"]),
          makeMethod("notAnEndpoint", "void")
        ]
      }
    ]);

    const verbs = deriveSpringInsights(project).endpoints.map((endpoint) => endpoint.httpMethod);

    assertEqual(verbs.length, 6, "only mapped methods are endpoints");
    for (const expected of ["GET", "POST", "PUT", "PATCH", "DELETE", "ANY"]) {
      assert(verbs.includes(expected as never), `expected a ${expected} endpoint`);
    }
  });

  test("does not treat a mapping annotation on a non-web class as an endpoint", () => {
    const insights = deriveSpringInsights(
      makeProject([
        { qualifiedName: "app.service.OrderService", annotations: ["Service"], methods: [makeMethod("get", "Order", [], ["GetMapping"])] }
      ])
    );

    assertEqual(insights.endpoints.length, 0);
  });

  test("declares endpoint URL paths unavailable when no argument details are present", () => {
    const insights = deriveSpringInsights(
      makeProject([
        { qualifiedName: "app.web.C", annotations: ["RestController"], methods: [makeMethod("list", "List<Order>", [], ["GetMapping"])] }
      ])
    );

    assertEqual(insights.endpointPathsUnavailable, true);
  });

  test("extracts endpoint URL paths when annotation details are present", () => {
    const insights = deriveSpringInsights(
      makeProject([
        {
          qualifiedName: "app.web.OrderController",
          annotations: ["RestController", "RequestMapping"],
          annotationDetails: [{ name: "RequestMapping", arguments: { value: "/api/orders" } }],
          methods: [
            {
              ...makeMethod("get", "Order", ["Long"], ["GetMapping"]),
              annotationDetails: [{ name: "GetMapping", arguments: { value: "/{id}" } }]
            }
          ]
        }
      ])
    );

    assertEqual(insights.endpointPathsUnavailable, false);
    assertEqual(insights.endpoints.length, 1);
    assertEqual(insights.endpoints[0].path, "/api/orders/{id}");
  });

  test("counts scheduled and bean factory methods", () => {
    const insights = deriveSpringInsights(
      makeProject([
        { qualifiedName: "app.job.Nightly", annotations: ["Component"], methods: [makeMethod("run", "void", [], ["Scheduled"])] },
        { qualifiedName: "app.config.Beans", annotations: ["Configuration"], methods: [makeMethod("clock", "Clock", [], ["Bean"]), makeMethod("mapper", "Mapper", [], ["Bean"])] }
      ])
    );

    assertEqual(insights.scheduledMethodCount, 1);
    assertEqual(insights.beanFactoryMethodCount, 2);
  });

  test("ranks the most used annotations first", () => {
    const insights = deriveSpringInsights(
      makeProject([
        { qualifiedName: "app.A", annotations: ["Component"], fields: [makeField("x", "String", ["Autowired"])] },
        { qualifiedName: "app.B", annotations: ["Component"], fields: [makeField("y", "String", ["Autowired"])] },
        { qualifiedName: "app.C", annotations: ["Service"] }
      ])
    );

    assert(insights.topAnnotations.length > 0, "expected annotation usage to be tallied");
    for (let index = 1; index < insights.topAnnotations.length; index += 1) {
      assert(
        insights.topAnnotations[index - 1].count >= insights.topAnnotations[index].count,
        "topAnnotations must be sorted by descending count"
      );
    }
  });

  test("derives coherent insights from the bundled sample", () => {
    const sample = loadSampleResponse();
    assert(hasParsedProject(sample), "sample must carry a parsed project");
    if (!hasParsedProject(sample)) {
      return;
    }

    const insights = deriveSpringInsights(sample.parsedProject);

    assertEqual(insights.isSpringProject, true);
    assert(insights.components.length >= 15, `expected a rich component set, got ${insights.components.length}`);
    assert(insights.endpoints.length >= 10, `expected a rich endpoint set, got ${insights.endpoints.length}`);
    assert(insights.transactionalMethodCount > 0, "sample should exercise @Transactional");
    assert(insights.scheduledMethodCount > 0, "sample should exercise @Scheduled");
    assert(insights.beanFactoryMethodCount > 0, "sample should exercise @Bean");
    assert(
      insights.components.some((component) => component.detectedVia === "naming"),
      "sample should exercise the naming heuristic path"
    );
  });
});

suite("architecture layers", () => {
  test("orders layers from entry point down to storage", () => {
    assert(layerRank("web") < layerRank("service"), "web sits above service");
    assert(layerRank("service") < layerRank("persistence"), "service sits above persistence");
  });

  test("maps every stereotype to a layer", () => {
    assertEqual(layerForStereotype("restController"), "web");
    assertEqual(layerForStereotype("controller"), "web");
    assertEqual(layerForStereotype("service"), "service");
    assertEqual(layerForStereotype("repository"), "persistence");
    assertEqual(layerForStereotype("entity"), "persistence");
    assertEqual(layerForStereotype("configuration"), "config");
    assertEqual(layerForStereotype("configurationProperties"), "config");
    assertEqual(layerForStereotype("application"), "bootstrap");
    assertEqual(layerForStereotype("advice"), "cross-cutting");
    assertEqual(layerForStereotype("aspect"), "cross-cutting");
    assertEqual(layerForStereotype("component"), "cross-cutting");
  });
});
