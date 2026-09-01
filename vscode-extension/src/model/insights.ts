import type { ParsedProject, ParsedType, SourceRange } from "../types/analyzer";
import { collectTypes } from "../types/analyzer";

/**
 * Spring Boot insight derivation.
 *
 * IMPORTANT LIMITATION: the analyzer captures annotation *names* only
 * (`AnnotationExpr::getNameAsString`), not their arguments. Request paths such
 * as `@GetMapping("/api/owners")` are therefore not available, so endpoints are
 * identified by HTTP verb + handler method rather than by URL. Capturing
 * annotation members in the Java parser would unlock exact route tables.
 */

export type SpringStereotypeId =
  | "application"
  | "restController"
  | "controller"
  | "service"
  | "repository"
  | "configuration"
  | "component"
  | "entity"
  | "advice"
  | "aspect"
  | "configurationProperties";

/** Architectural layer, used for ordering and for layering-violation checks. */
export type ArchitectureLayer = "bootstrap" | "web" | "service" | "persistence" | "config" | "cross-cutting";

interface StereotypeDefinition {
  readonly id: SpringStereotypeId;
  readonly label: string;
  readonly layer: ArchitectureLayer;
  /** Annotation simple names that identify this stereotype. */
  readonly annotations: readonly string[];
}

/**
 * Ordered most-specific first: `@RestController` must win over `@Controller`,
 * and `@SpringBootApplication` over `@Configuration`, since a single class can
 * carry annotations matching several definitions.
 */
const STEREOTYPE_DEFINITIONS: readonly StereotypeDefinition[] = [
  {
    id: "application",
    label: "Application",
    layer: "bootstrap",
    annotations: ["SpringBootApplication"]
  },
  {
    id: "restController",
    label: "REST Controller",
    layer: "web",
    annotations: ["RestController"]
  },
  { id: "controller", label: "Controller", layer: "web", annotations: ["Controller"] },
  {
    id: "advice",
    label: "Controller Advice",
    layer: "cross-cutting",
    annotations: ["ControllerAdvice", "RestControllerAdvice"]
  },
  { id: "aspect", label: "Aspect", layer: "cross-cutting", annotations: ["Aspect"] },
  { id: "service", label: "Service", layer: "service", annotations: ["Service"] },
  { id: "repository", label: "Repository", layer: "persistence", annotations: ["Repository"] },
  {
    id: "entity",
    label: "Entity",
    layer: "persistence",
    annotations: ["Entity", "Embeddable", "MappedSuperclass", "Document", "Table"]
  },
  {
    id: "configurationProperties",
    label: "Configuration Properties",
    layer: "config",
    annotations: ["ConfigurationProperties", "EnableConfigurationProperties"]
  },
  {
    id: "configuration",
    label: "Configuration",
    layer: "config",
    annotations: ["Configuration", "TestConfiguration", "AutoConfiguration"]
  },
  {
    id: "component",
    label: "Component",
    layer: "cross-cutting",
    annotations: ["Component"]
  }
];

export type HttpVerb = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ANY";

const MAPPING_ANNOTATIONS: Readonly<Record<string, HttpVerb>> = {
  GetMapping: "GET",
  PostMapping: "POST",
  PutMapping: "PUT",
  DeleteMapping: "DELETE",
  PatchMapping: "PATCH",
  RequestMapping: "ANY"
};

export interface SpringComponent {
  readonly qualifiedName: string;
  readonly simpleName: string;
  readonly packageName: string;
  readonly sourcePath: string;
  readonly stereotype: SpringStereotypeId;
  readonly stereotypeLabel: string;
  readonly layer: ArchitectureLayer;
  /**
   * `annotation` is authoritative. `naming` is a heuristic fallback for Spring
   * Data interfaces, which carry no annotation at all, and is labelled as such
   * in the UI so it is never mistaken for a confirmed detection.
   */
  readonly detectedVia: "annotation" | "naming";
  readonly annotations: readonly string[];
  readonly methodCount: number;
  readonly fieldCount: number;
  readonly sourceRange: SourceRange;
}

export interface SpringEndpoint {
  readonly httpMethod: HttpVerb;
  readonly controllerSimpleName: string;
  readonly controllerQualifiedName: string;
  readonly methodName: string;
  readonly returnType: string;
  readonly parameters: readonly string[];
  readonly sourcePath: string;
  readonly sourceRange: SourceRange;
}

export interface AnnotationUsage {
  readonly annotation: string;
  readonly count: number;
}

export interface SpringInsights {
  readonly isSpringProject: boolean;
  readonly components: readonly SpringComponent[];
  readonly endpoints: readonly SpringEndpoint[];
  readonly countsByStereotype: Readonly<Record<string, number>>;
  readonly transactionalMethodCount: number;
  readonly scheduledMethodCount: number;
  readonly beanFactoryMethodCount: number;
  readonly topAnnotations: readonly AnnotationUsage[];
  /** True when endpoints exist but their URL paths could not be recovered. */
  readonly endpointPathsUnavailable: boolean;
}

/** Classifies a single parsed type, or returns undefined if it is not a Spring bean. */
export function classifyStereotype(type: ParsedType): StereotypeDefinition | undefined {
  const annotations = new Set(type.annotations);

  for (const definition of STEREOTYPE_DEFINITIONS) {
    if (definition.annotations.some((candidate) => annotations.has(candidate))) {
      return definition;
    }
  }

  return undefined;
}

/**
 * Spring Data repositories are plain interfaces with no annotation, so they are
 * invisible to annotation scanning. An interface whose name ends in `Repository`
 * or `Dao` is treated as a probable repository and flagged as heuristic.
 */
function classifyByNaming(type: ParsedType): StereotypeDefinition | undefined {
  if (type.kind !== "INTERFACE") {
    return undefined;
  }

  const name = type.simpleName;
  if (name.endsWith("Repository") || name.endsWith("Dao") || name.endsWith("DAO")) {
    return STEREOTYPE_DEFINITIONS.find((definition) => definition.id === "repository");
  }

  return undefined;
}

export function deriveSpringInsights(parsedProject: ParsedProject): SpringInsights {
  const types = collectTypes(parsedProject);
  const components: SpringComponent[] = [];
  const endpoints: SpringEndpoint[] = [];
  const countsByStereotype: Record<string, number> = {};
  const annotationTally = new Map<string, number>();

  let transactionalMethodCount = 0;
  let scheduledMethodCount = 0;
  let beanFactoryMethodCount = 0;

  for (const type of types) {
    for (const annotation of type.annotations) {
      annotationTally.set(annotation, (annotationTally.get(annotation) ?? 0) + 1);
    }

    const annotationMatch = classifyStereotype(type);
    const definition = annotationMatch ?? classifyByNaming(type);

    if (definition) {
      components.push({
        qualifiedName: type.qualifiedName,
        simpleName: type.simpleName,
        packageName: type.packageName,
        sourcePath: type.sourcePath,
        stereotype: definition.id,
        stereotypeLabel: definition.label,
        layer: definition.layer,
        detectedVia: annotationMatch ? "annotation" : "naming",
        annotations: type.annotations,
        methodCount: type.methods.length,
        fieldCount: type.fields.length,
        sourceRange: type.sourceRange
      });

      countsByStereotype[definition.id] = (countsByStereotype[definition.id] ?? 0) + 1;
    }

    const isWebLayer = definition?.layer === "web";

    for (const method of type.methods) {
      for (const annotation of method.annotations) {
        annotationTally.set(annotation, (annotationTally.get(annotation) ?? 0) + 1);

        if (annotation === "Transactional") {
          transactionalMethodCount += 1;
        }
        if (annotation === "Scheduled") {
          scheduledMethodCount += 1;
        }
        if (annotation === "Bean") {
          beanFactoryMethodCount += 1;
        }
      }

      // Only treat mappings on web-layer classes as endpoints, so an unrelated
      // class that happens to use @RequestMapping does not inflate the count.
      if (!isWebLayer) {
        continue;
      }

      const verb = findHttpVerb(method.annotations);
      if (verb) {
        endpoints.push({
          httpMethod: verb,
          controllerSimpleName: type.simpleName,
          controllerQualifiedName: type.qualifiedName,
          methodName: method.name,
          returnType: method.returnType,
          parameters: method.parameters.map((parameter) => `${parameter.type} ${parameter.name}`),
          sourcePath: type.sourcePath,
          sourceRange: method.sourceRange
        });
      }
    }

    for (const field of type.fields) {
      for (const annotation of field.annotations) {
        annotationTally.set(annotation, (annotationTally.get(annotation) ?? 0) + 1);
      }
    }
  }

  const topAnnotations = [...annotationTally.entries()]
    .map(([annotation, count]) => ({ annotation, count }))
    .sort((left, right) => right.count - left.count || left.annotation.localeCompare(right.annotation))
    .slice(0, 12);

  components.sort(
    (left, right) =>
      layerRank(left.layer) - layerRank(right.layer) ||
      left.simpleName.localeCompare(right.simpleName)
  );

  endpoints.sort(
    (left, right) =>
      left.controllerSimpleName.localeCompare(right.controllerSimpleName) ||
      left.methodName.localeCompare(right.methodName)
  );

  return {
    isSpringProject: components.length > 0,
    components,
    endpoints,
    countsByStereotype,
    transactionalMethodCount,
    scheduledMethodCount,
    beanFactoryMethodCount,
    topAnnotations,
    endpointPathsUnavailable: endpoints.length > 0
  };
}

function findHttpVerb(annotations: readonly string[]): HttpVerb | undefined {
  for (const annotation of annotations) {
    const verb = MAPPING_ANNOTATIONS[annotation];
    if (verb) {
      return verb;
    }
  }
  return undefined;
}

export function layerRank(layer: ArchitectureLayer): number {
  switch (layer) {
    case "bootstrap":
      return 0;
    case "web":
      return 1;
    case "service":
      return 2;
    case "persistence":
      return 3;
    case "config":
      return 4;
    case "cross-cutting":
      return 5;
    default:
      return 6;
  }
}

/** Maps a stereotype to its layer, for consumers that only have the id. */
export function layerForStereotype(stereotype: SpringStereotypeId): ArchitectureLayer {
  return (
    STEREOTYPE_DEFINITIONS.find((definition) => definition.id === stereotype)?.layer ??
    "cross-cutting"
  );
}
