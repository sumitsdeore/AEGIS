#!/usr/bin/env node
/**
 * Regenerates `resources/sample-analysis.json`.
 *
 * The fixture backs the dashboard whenever the analyzer cannot run (no JDK 21+,
 * no jar), and it is the only way to exercise the dashboard in CI without a JVM.
 * It is generated rather than hand-written so the ~30 types stay internally
 * consistent: counts match the members, imports match the real cross-references,
 * and every `sourcePath` follows the analyzer's project-relative convention.
 *
 * Usage: node scripts/generateSampleAnalysis.js
 *
 * The output conforms to `AnalyzerResponse` in src/types/analyzer.ts, which in
 * turn mirrors the Java records in analyzer-engine.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const BASE = "com.example.storefront";
const SOURCE_ROOT = "src/main/java";
const PROJECT_PATH = "/Users/example/projects/storefront-service";

/** Convenience: a plausible source range for a type of roughly `lines` length. */
let cursor = 12;
function range(lines) {
  const begin = cursor;
  cursor += lines + 4;
  return { beginLine: begin, beginColumn: 1, endLine: begin + lines, endColumn: 1 };
}

function field(name, type, annotations = [], modifiers = ["private", "final"]) {
  return { name, type, modifiers, annotations, sourceRange: range(1) };
}

function method(name, returnType, parameters = [], annotations = [], modifiers = ["public"]) {
  return {
    name,
    returnType,
    parameters: parameters.map(([parameterName, parameterType]) => ({
      name: parameterName,
      type: parameterType
    })),
    modifiers,
    annotations,
    sourceRange: range(6)
  };
}

/**
 * Declares one type. `refs` lists qualified names this type mentions; they become
 * the file's import list, which is what the extension's graph builder reads.
 */
function type(spec) {
  const packageName = `${BASE}.${spec.pkg}`;
  const qualifiedName = `${packageName}.${spec.name}`;

  return {
    qualifiedName,
    simpleName: spec.name,
    packageName,
    kind: spec.kind ?? "CLASS",
    sourcePath: `${SOURCE_ROOT}/${packageName.split(".").join("/")}/${spec.name}.java`,
    modifiers: spec.modifiers ?? ["public"],
    annotations: spec.annotations ?? [],
    fields: spec.fields ?? [],
    methods: spec.methods ?? [],
    sourceRange: range(spec.lines ?? 40),
    __refs: spec.refs ?? []
  };
}

const q = {
  // domain
  Customer: `${BASE}.domain.Customer`,
  Order: `${BASE}.domain.Order`,
  OrderLine: `${BASE}.domain.OrderLine`,
  Product: `${BASE}.domain.Product`,
  Money: `${BASE}.domain.Money`,
  Address: `${BASE}.domain.Address`,
  OrderStatus: `${BASE}.domain.OrderStatus`,
  // dto
  CustomerDto: `${BASE}.dto.CustomerDto`,
  OrderSummary: `${BASE}.dto.OrderSummary`,
  CheckoutRequest: `${BASE}.dto.CheckoutRequest`,
  // repository
  CustomerRepository: `${BASE}.repository.CustomerRepository`,
  OrderRepository: `${BASE}.repository.OrderRepository`,
  ProductRepository: `${BASE}.repository.ProductRepository`,
  InventoryRepository: `${BASE}.repository.InventoryRepository`,
  // service
  CustomerService: `${BASE}.service.CustomerService`,
  OrderService: `${BASE}.service.OrderService`,
  ProductService: `${BASE}.service.ProductService`,
  PricingService: `${BASE}.service.PricingService`,
  InventoryService: `${BASE}.service.InventoryService`,
  NotificationService: `${BASE}.service.NotificationService`,
  PaymentGateway: `${BASE}.service.PaymentGateway`,
  StripePaymentGateway: `${BASE}.service.StripePaymentGateway`,
  ReportingService: `${BASE}.service.ReportingService`,
  // web
  CustomerController: `${BASE}.web.CustomerController`,
  OrderController: `${BASE}.web.OrderController`,
  ProductController: `${BASE}.web.ProductController`,
  CheckoutController: `${BASE}.web.CheckoutController`,
  AdminDashboardController: `${BASE}.web.AdminDashboardController`,
  // config
  SecurityConfig: `${BASE}.config.SecurityConfig`,
  CacheConfig: `${BASE}.config.CacheConfig`,
  // support
  GlobalExceptionHandler: `${BASE}.support.GlobalExceptionHandler`,
  RequestLoggingFilter: `${BASE}.support.RequestLoggingFilter`,
  MetricsAspect: `${BASE}.support.MetricsAspect`,
  OrderNotFoundException: `${BASE}.support.OrderNotFoundException`,
  InsufficientStockException: `${BASE}.support.InsufficientStockException`
};

const types = [
  // ------------------------------------------------------------- bootstrap ---
  type({
    pkg: "",
    name: "StorefrontApplication",
    annotations: ["SpringBootApplication", "EnableScheduling"],
    methods: [method("main", "void", [["args", "String[]"]], [], ["public", "static"])],
    refs: [],
    lines: 18
  }),

  // ---------------------------------------------------------------- domain ---
  type({
    pkg: "domain",
    name: "Customer",
    annotations: ["Entity", "Table"],
    fields: [
      field("id", "Long", ["Id", "GeneratedValue"]),
      field("email", "String", ["Column"]),
      field("displayName", "String", ["Column"]),
      field("billingAddress", "Address", ["Embedded"]),
      field("orders", "List<Order>", ["OneToMany"])
    ],
    methods: [
      method("getId", "Long"),
      method("getEmail", "String"),
      method("getDisplayName", "String"),
      method("getBillingAddress", "Address"),
      method("getOrders", "List<Order>"),
      method("addOrder", "void", [["order", "Order"]])
    ],
    refs: [q.Address, q.Order],
    lines: 72
  }),
  type({
    pkg: "domain",
    name: "Order",
    annotations: ["Entity", "Table"],
    fields: [
      field("id", "Long", ["Id", "GeneratedValue"]),
      field("customer", "Customer", ["ManyToOne"]),
      field("lines", "List<OrderLine>", ["OneToMany"]),
      field("status", "OrderStatus", ["Enumerated"]),
      field("total", "Money", ["Embedded"]),
      field("placedAt", "Instant", ["Column"])
    ],
    methods: [
      method("getId", "Long"),
      method("getCustomer", "Customer"),
      method("getLines", "List<OrderLine>"),
      method("getStatus", "OrderStatus"),
      method("getTotal", "Money"),
      method("transitionTo", "void", [["status", "OrderStatus"]]),
      method("recalculateTotal", "Money", [["pricing", "PricingService"]])
    ],
    refs: [q.Customer, q.OrderLine, q.OrderStatus, q.Money, q.PricingService],
    lines: 96
  }),
  type({
    pkg: "domain",
    name: "OrderLine",
    annotations: ["Entity"],
    fields: [
      field("id", "Long", ["Id", "GeneratedValue"]),
      field("product", "Product", ["ManyToOne"]),
      field("quantity", "int", ["Column"]),
      field("unitPrice", "Money", ["Embedded"])
    ],
    methods: [
      method("getProduct", "Product"),
      method("getQuantity", "int"),
      method("lineTotal", "Money")
    ],
    refs: [q.Product, q.Money],
    lines: 54
  }),
  type({
    pkg: "domain",
    name: "Product",
    annotations: ["Entity", "Table"],
    fields: [
      field("id", "Long", ["Id", "GeneratedValue"]),
      field("sku", "String", ["Column"]),
      field("name", "String", ["Column"]),
      field("listPrice", "Money", ["Embedded"]),
      field("active", "boolean", ["Column"])
    ],
    methods: [
      method("getId", "Long"),
      method("getSku", "String"),
      method("getName", "String"),
      method("getListPrice", "Money"),
      method("isActive", "boolean")
    ],
    refs: [q.Money],
    lines: 66
  }),
  type({
    pkg: "domain",
    name: "Money",
    kind: "RECORD",
    annotations: ["Embeddable"],
    fields: [field("amount", "BigDecimal", [], ["private", "final"]), field("currency", "String", [], ["private", "final"])],
    methods: [
      method("plus", "Money", [["other", "Money"]]),
      method("times", "Money", [["factor", "int"]]),
      method("zero", "Money", [["currency", "String"]], [], ["public", "static"])
    ],
    refs: [],
    lines: 34
  }),
  type({
    pkg: "domain",
    name: "Address",
    kind: "RECORD",
    annotations: ["Embeddable"],
    fields: [
      field("line1", "String"),
      field("city", "String"),
      field("postalCode", "String"),
      field("countryCode", "String")
    ],
    methods: [method("singleLine", "String")],
    refs: [],
    lines: 26
  }),
  type({
    pkg: "domain",
    name: "OrderStatus",
    kind: "ENUM",
    methods: [method("isTerminal", "boolean"), method("canTransitionTo", "boolean", [["next", "OrderStatus"]])],
    refs: [],
    lines: 30
  }),

  // ------------------------------------------------------------------- dto ---
  type({
    pkg: "dto",
    name: "CustomerDto",
    kind: "RECORD",
    fields: [field("id", "Long"), field("email", "String"), field("displayName", "String")],
    methods: [method("from", "CustomerDto", [["customer", "Customer"]], [], ["public", "static"])],
    refs: [q.Customer],
    lines: 22
  }),
  type({
    pkg: "dto",
    name: "OrderSummary",
    kind: "RECORD",
    fields: [
      field("orderId", "Long"),
      field("status", "OrderStatus"),
      field("total", "Money"),
      field("lineCount", "int")
    ],
    methods: [method("from", "OrderSummary", [["order", "Order"]], [], ["public", "static"])],
    refs: [q.Order, q.OrderStatus, q.Money],
    lines: 26
  }),
  type({
    pkg: "dto",
    name: "CheckoutRequest",
    kind: "RECORD",
    fields: [
      field("customerId", "Long", ["NotNull"]),
      field("shippingAddress", "Address", ["Valid"]),
      field("paymentToken", "String", ["NotBlank"])
    ],
    methods: [],
    refs: [q.Address],
    lines: 20
  }),

  // ------------------------------------------------------------ repository ---
  // Spring Data interfaces carry no annotation, so the extension classifies these
  // by naming convention and labels them as such in the dashboard.
  type({
    pkg: "repository",
    name: "CustomerRepository",
    kind: "INTERFACE",
    methods: [
      method("findByEmail", "Optional<Customer>", [["email", "String"]]),
      method("findAllActive", "List<Customer>", [], ["Query"]),
      method("existsByEmail", "boolean", [["email", "String"]])
    ],
    refs: [q.Customer],
    lines: 24
  }),
  type({
    pkg: "repository",
    name: "OrderRepository",
    kind: "INTERFACE",
    methods: [
      method("findByCustomerId", "List<Order>", [["customerId", "Long"]]),
      method("findByStatus", "List<Order>", [["status", "OrderStatus"]]),
      method("countByStatus", "long", [["status", "OrderStatus"]]),
      method("findRecent", "List<Order>", [["limit", "int"]], ["Query"])
    ],
    refs: [q.Order, q.OrderStatus],
    lines: 30
  }),
  type({
    pkg: "repository",
    name: "ProductRepository",
    kind: "INTERFACE",
    methods: [
      method("findBySku", "Optional<Product>", [["sku", "String"]]),
      method("findAllActive", "List<Product>", [], ["Query"])
    ],
    refs: [q.Product],
    lines: 20
  }),
  type({
    pkg: "repository",
    name: "InventoryRepository",
    kind: "INTERFACE",
    methods: [
      method("availableQuantity", "int", [["sku", "String"]]),
      method("reserve", "void", [["sku", "String"], ["quantity", "int"]], ["Modifying", "Query"])
    ],
    refs: [],
    lines: 20
  }),

  // --------------------------------------------------------------- service ---
  type({
    pkg: "service",
    name: "CustomerService",
    annotations: ["Service"],
    fields: [field("customerRepository", "CustomerRepository"), field("notifications", "NotificationService")],
    methods: [
      method("findById", "Customer", [["id", "Long"]], ["Transactional"]),
      method("register", "Customer", [["email", "String"], ["displayName", "String"]], ["Transactional"]),
      method("toDto", "CustomerDto", [["customer", "Customer"]]),
      method("updateAddress", "void", [["id", "Long"], ["address", "Address"]], ["Transactional"])
    ],
    refs: [q.CustomerRepository, q.NotificationService, q.Customer, q.CustomerDto, q.Address],
    lines: 78
  }),
  type({
    pkg: "service",
    name: "OrderService",
    annotations: ["Service"],
    fields: [
      field("orderRepository", "OrderRepository"),
      field("customerService", "CustomerService"),
      field("inventory", "InventoryService"),
      field("pricing", "PricingService"),
      field("payments", "PaymentGateway"),
      field("notifications", "NotificationService")
    ],
    methods: [
      method("placeOrder", "Order", [["request", "CheckoutRequest"]], ["Transactional"]),
      method("cancel", "void", [["orderId", "Long"]], ["Transactional"]),
      method("summaryFor", "OrderSummary", [["orderId", "Long"]]),
      method("findByStatus", "List<Order>", [["status", "OrderStatus"]]),
      method("expireStaleCarts", "void", [], ["Scheduled", "Transactional"]),
      method("requireOrder", "Order", [["orderId", "Long"]], [], ["private"])
    ],
    refs: [
      q.OrderRepository,
      q.CustomerService,
      q.InventoryService,
      q.PricingService,
      q.PaymentGateway,
      q.NotificationService,
      q.Order,
      q.OrderStatus,
      q.OrderSummary,
      q.CheckoutRequest,
      q.OrderNotFoundException
    ],
    lines: 148
  }),
  type({
    pkg: "service",
    name: "ProductService",
    annotations: ["Service"],
    fields: [field("productRepository", "ProductRepository"), field("pricing", "PricingService")],
    methods: [
      method("findBySku", "Product", [["sku", "String"]]),
      method("listActive", "List<Product>", [], ["Cacheable"]),
      method("priceFor", "Money", [["product", "Product"], ["quantity", "int"]])
    ],
    refs: [q.ProductRepository, q.PricingService, q.Product, q.Money],
    lines: 62
  }),
  type({
    pkg: "service",
    name: "PricingService",
    annotations: ["Service"],
    fields: [field("productRepository", "ProductRepository")],
    methods: [
      method("priceOf", "Money", [["product", "Product"], ["quantity", "int"]]),
      method("totalFor", "Money", [["lines", "List<OrderLine>"]]),
      method("applyDiscount", "Money", [["subtotal", "Money"], ["customer", "Customer"]])
    ],
    refs: [q.ProductRepository, q.Product, q.OrderLine, q.Money, q.Customer],
    lines: 70
  }),
  type({
    pkg: "service",
    name: "InventoryService",
    annotations: ["Service"],
    fields: [field("inventoryRepository", "InventoryRepository")],
    methods: [
      method("assertAvailable", "void", [["lines", "List<OrderLine>"]]),
      method("reserve", "void", [["lines", "List<OrderLine>"]], ["Transactional"]),
      method("release", "void", [["lines", "List<OrderLine>"]], ["Transactional"])
    ],
    refs: [q.InventoryRepository, q.OrderLine, q.InsufficientStockException],
    lines: 58
  }),
  type({
    pkg: "service",
    name: "NotificationService",
    annotations: ["Service"],
    methods: [
      method("orderPlaced", "void", [["order", "Order"]], ["Async"]),
      method("orderCancelled", "void", [["order", "Order"]], ["Async"]),
      method("welcome", "void", [["customer", "Customer"]], ["Async"])
    ],
    refs: [q.Order, q.Customer],
    lines: 46
  }),
  type({
    pkg: "service",
    name: "PaymentGateway",
    kind: "INTERFACE",
    methods: [
      method("authorize", "String", [["amount", "Money"], ["token", "String"]]),
      method("capture", "void", [["authorizationId", "String"]]),
      method("refund", "void", [["authorizationId", "String"], ["amount", "Money"]])
    ],
    refs: [q.Money],
    lines: 20
  }),
  type({
    pkg: "service",
    name: "StripePaymentGateway",
    annotations: ["Component"],
    fields: [field("apiKey", "String", ["Value"])],
    methods: [
      method("authorize", "String", [["amount", "Money"], ["token", "String"]], ["Override"]),
      method("capture", "void", [["authorizationId", "String"]], ["Override"]),
      method("refund", "void", [["authorizationId", "String"], ["amount", "Money"]], ["Override"])
    ],
    refs: [q.PaymentGateway, q.Money],
    lines: 64
  }),
  type({
    pkg: "service",
    name: "ReportingService",
    annotations: ["Service"],
    fields: [field("orderRepository", "OrderRepository"), field("customerRepository", "CustomerRepository")],
    methods: [
      method("dailyRevenue", "Money", [["day", "LocalDate"]]),
      method("nightlyRollup", "void", [], ["Scheduled"]),
      method("topCustomers", "List<CustomerDto>", [["limit", "int"]])
    ],
    refs: [q.OrderRepository, q.CustomerRepository, q.Money, q.CustomerDto],
    lines: 68
  }),

  // ------------------------------------------------------------------- web ---
  type({
    pkg: "web",
    name: "CustomerController",
    annotations: ["RestController", "RequestMapping"],
    fields: [field("customerService", "CustomerService")],
    methods: [
      method("list", "List<CustomerDto>", [], ["GetMapping"]),
      method("get", "CustomerDto", [["id", "Long"]], ["GetMapping"]),
      method("create", "CustomerDto", [["body", "CustomerDto"]], ["PostMapping"]),
      method("updateAddress", "void", [["id", "Long"], ["address", "Address"]], ["PutMapping"]),
      method("delete", "void", [["id", "Long"]], ["DeleteMapping"])
    ],
    refs: [q.CustomerService, q.CustomerDto, q.Address],
    lines: 76
  }),
  type({
    pkg: "web",
    name: "OrderController",
    annotations: ["RestController", "RequestMapping"],
    fields: [field("orderService", "OrderService")],
    methods: [
      method("summary", "OrderSummary", [["id", "Long"]], ["GetMapping"]),
      method("byStatus", "List<OrderSummary>", [["status", "OrderStatus"]], ["GetMapping"]),
      method("cancel", "void", [["id", "Long"]], ["PostMapping"])
    ],
    refs: [q.OrderService, q.OrderSummary, q.OrderStatus],
    lines: 58
  }),
  type({
    pkg: "web",
    name: "ProductController",
    annotations: ["RestController", "RequestMapping"],
    fields: [field("productService", "ProductService")],
    methods: [
      method("listActive", "List<Product>", [], ["GetMapping"]),
      method("bySku", "Product", [["sku", "String"]], ["GetMapping"]),
      method("patch", "Product", [["sku", "String"], ["body", "Product"]], ["PatchMapping"])
    ],
    refs: [q.ProductService, q.Product],
    lines: 52
  }),
  type({
    pkg: "web",
    name: "CheckoutController",
    annotations: ["RestController", "RequestMapping"],
    fields: [field("orderService", "OrderService"), field("inventory", "InventoryService")],
    methods: [
      method("checkout", "OrderSummary", [["request", "CheckoutRequest"]], ["PostMapping"]),
      method("validate", "void", [["request", "CheckoutRequest"]], ["PostMapping"])
    ],
    refs: [q.OrderService, q.InventoryService, q.CheckoutRequest, q.OrderSummary],
    lines: 54
  }),
  type({
    pkg: "web",
    name: "AdminDashboardController",
    annotations: ["Controller", "RequestMapping"],
    // Reaches straight into a repository, which the extension flags as a
    // layering violation - deliberately present so the dashboard has one to show.
    fields: [field("reporting", "ReportingService"), field("orderRepository", "OrderRepository")],
    methods: [
      method("overview", "String", [["model", "Model"]], ["GetMapping"]),
      method("revenue", "String", [["day", "LocalDate"], ["model", "Model"]], ["GetMapping"]),
      method("purge", "String", [], ["PostMapping"])
    ],
    refs: [q.ReportingService, q.OrderRepository, q.Money],
    lines: 62
  }),

  // ---------------------------------------------------------------- config ---
  type({
    pkg: "config",
    name: "SecurityConfig",
    annotations: ["Configuration", "EnableWebSecurity"],
    methods: [
      method("filterChain", "SecurityFilterChain", [["http", "HttpSecurity"]], ["Bean"]),
      method("passwordEncoder", "PasswordEncoder", [], ["Bean"]),
      method("loggingFilter", "RequestLoggingFilter", [], ["Bean"])
    ],
    refs: [q.RequestLoggingFilter],
    lines: 54
  }),
  type({
    pkg: "config",
    name: "CacheConfig",
    annotations: ["Configuration", "EnableCaching"],
    methods: [method("cacheManager", "CacheManager", [], ["Bean"])],
    refs: [],
    lines: 28
  }),

  // --------------------------------------------------------------- support ---
  type({
    pkg: "support",
    name: "GlobalExceptionHandler",
    annotations: ["ControllerAdvice"],
    methods: [
      method("orderNotFound", "ResponseEntity<String>", [["exception", "OrderNotFoundException"]], ["ExceptionHandler"]),
      method("insufficientStock", "ResponseEntity<String>", [["exception", "InsufficientStockException"]], ["ExceptionHandler"]),
      method("fallback", "ResponseEntity<String>", [["exception", "Exception"]], ["ExceptionHandler"])
    ],
    refs: [q.OrderNotFoundException, q.InsufficientStockException],
    lines: 48
  }),
  type({
    pkg: "support",
    name: "RequestLoggingFilter",
    annotations: ["Component"],
    methods: [
      method(
        "doFilterInternal",
        "void",
        [["request", "HttpServletRequest"], ["response", "HttpServletResponse"], ["chain", "FilterChain"]],
        ["Override"],
        ["protected"]
      )
    ],
    refs: [],
    lines: 40
  }),
  type({
    pkg: "support",
    name: "MetricsAspect",
    annotations: ["Aspect", "Component"],
    methods: [
      method("timeServiceCalls", "Object", [["joinPoint", "ProceedingJoinPoint"]], ["Around"]),
      method("countFailures", "void", [["exception", "Throwable"]], ["AfterThrowing"])
    ],
    refs: [],
    lines: 44
  }),
  type({
    pkg: "support",
    name: "OrderNotFoundException",
    modifiers: ["public"],
    methods: [method("OrderNotFoundException", "void", [["orderId", "Long"]])],
    refs: [],
    lines: 14
  }),
  type({
    pkg: "support",
    name: "InsufficientStockException",
    modifiers: ["public"],
    methods: [method("InsufficientStockException", "void", [["sku", "String"], ["requested", "int"]])],
    refs: [],
    lines: 14
  })
];

/** Third-party imports so the graph builder's "ignore unresolvable" path is exercised. */
const AMBIENT_IMPORTS = {
  domain: ["jakarta.persistence.Entity", "jakarta.persistence.Id", "java.util.List"],
  dto: ["jakarta.validation.constraints.NotNull"],
  repository: ["org.springframework.data.jpa.repository.JpaRepository", "java.util.Optional", "java.util.List"],
  service: ["org.springframework.stereotype.Service", "org.springframework.transaction.annotation.Transactional"],
  web: ["org.springframework.web.bind.annotation.RestController", "org.springframework.http.ResponseEntity"],
  config: ["org.springframework.context.annotation.Bean"],
  support: ["org.springframework.web.bind.annotation.ControllerAdvice"],
  "": ["org.springframework.boot.SpringApplication"]
};

const files = types.map((parsedType) => {
  const { __refs: refs, ...cleanType } = parsedType;
  const packageSuffix = cleanType.packageName.slice(BASE.length).replace(/^\./, "");
  const ambient = AMBIENT_IMPORTS[packageSuffix] ?? [];

  return {
    sourceRoot: SOURCE_ROOT,
    // Source-root-relative, matching ParsedJavaFile.relativePath in the analyzer.
    relativePath: cleanType.sourcePath.slice(`${SOURCE_ROOT}/`.length),
    packageName: cleanType.packageName,
    imports: [...new Set([...refs, ...ambient])].sort(),
    types: [cleanType],
    diagnostics: []
  };
});

// One file with a parse error, so the health panel and the parse-success ring are
// exercised by something other than a perfect 100%.
files.push({
  sourceRoot: SOURCE_ROOT,
  relativePath: `${BASE.split(".").join("/")}/legacy/LegacyPricingRules.java`,
  packageName: `${BASE}.legacy`,
  imports: [],
  types: [],
  diagnostics: [
    {
      severity: "ERROR",
      sourcePath: `${SOURCE_ROOT}/${BASE.split(".").join("/")}/legacy/LegacyPricingRules.java`,
      message: "Parse error at 'sealed': this source uses a preview feature that is not enabled.",
      line: 0,
      column: 0
    }
  ]
});

const typeCount = files.reduce((total, file) => total + file.types.length, 0);
const methodCount = files.reduce(
  (total, file) => total + file.types.reduce((sum, entry) => sum + entry.methods.length, 0),
  0
);
const fieldCount = files.reduce(
  (total, file) => total + file.types.reduce((sum, entry) => sum + entry.fields.length, 0),
  0
);

const response = {
  status: "SUCCESS",
  command: "analyze",
  message: `Parsed ${files.length} Java file(s) and ${typeCount} type(s).`,
  generatedAt: "2026-08-30T09:41:12.482Z",
  project: {
    projectPath: PROJECT_PATH,
    buildTool: "MAVEN",
    sourceRoots: ["src/main/java", "src/test/java"],
    diagnostics: [
      { severity: "INFO", message: "Detected build tool: MAVEN." },
      { severity: "INFO", message: "Detected 2 conventional source root(s)." }
    ]
  },
  parsedProject: {
    projectPath: PROJECT_PATH,
    fileCount: files.length,
    typeCount,
    methodCount,
    fieldCount,
    files,
    diagnostics: files.flatMap((file) => file.diagnostics)
  },
  diagnostics: [
    { severity: "INFO", message: "Detected build tool: MAVEN." },
    { severity: "INFO", message: "Detected 2 conventional source root(s)." },
    {
      severity: "INFO",
      message: `Parsed ${files.length} file(s) containing ${typeCount} type(s), ${methodCount} method(s) and ${fieldCount} field(s).`
    },
    { severity: "WARNING", message: "1 file(s) could not be parsed and were skipped." }
  ]
};

const target = path.join(__dirname, "..", "resources", "sample-analysis.json");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(response, null, 2)}\n`, "utf8");

process.stdout.write(
  `Wrote ${path.relative(path.join(__dirname, ".."), target)}: ` +
    `${files.length} files, ${typeCount} types, ${methodCount} methods, ${fieldCount} fields.\n`
);
