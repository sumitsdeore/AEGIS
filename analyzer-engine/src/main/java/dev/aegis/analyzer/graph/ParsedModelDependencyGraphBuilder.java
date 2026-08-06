package dev.aegis.analyzer.graph;

import dev.aegis.analyzer.parser.ParsedField;
import dev.aegis.analyzer.parser.ParsedJavaFile;
import dev.aegis.analyzer.parser.ParsedMethod;
import dev.aegis.analyzer.parser.ParsedParameter;
import dev.aegis.analyzer.parser.ParsedProject;
import dev.aegis.analyzer.parser.ParsedType;

import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public final class ParsedModelDependencyGraphBuilder implements DependencyGraphBuilder {
    private static final Pattern TYPE_TOKEN_PATTERN = Pattern.compile("[A-Za-z_$][A-Za-z0-9_$.]*");
    private static final Set<String> IGNORED_TYPE_TOKENS = Set.of(
            "boolean",
            "byte",
            "char",
            "double",
            "float",
            "int",
            "long",
            "short",
            "void",
            "var",
            "extends",
            "super"
    );

    @Override
    public DependencyGraph build(ParsedProject parsedProject) {
        Objects.requireNonNull(parsedProject, "parsedProject must not be null");

        Map<String, GraphNode> nodes = new TreeMap<>();
        Map<String, GraphEdge> edges = new TreeMap<>();
        Map<String, ParsedType> typesByQualifiedName = parsedProject.files().stream()
                .flatMap(file -> file.types().stream())
                .collect(Collectors.toMap(
                        ParsedType::qualifiedName,
                        type -> type,
                        (left, right) -> left,
                        TreeMap::new
                ));
        Map<String, String> qualifiedNamesBySimpleName = typesByQualifiedName.values().stream()
                .collect(Collectors.toMap(
                        ParsedType::simpleName,
                        ParsedType::qualifiedName,
                        (left, right) -> left,
                        TreeMap::new
                ));

        for (ParsedJavaFile file : parsedProject.files()) {
            addPackageNode(file, nodes);

            for (ParsedType type : file.types()) {
                addType(type, file, nodes, edges);
            }
        }

        for (ParsedJavaFile file : parsedProject.files()) {
            addImportNodesAndEdges(file, qualifiedNamesBySimpleName, nodes, edges);

            for (ParsedType type : file.types()) {
                addAnnotationEdges(typeNodeId(type), type.annotations(), qualifiedNamesBySimpleName, nodes, edges);

                for (ParsedField field : type.fields()) {
                    addField(type, field, nodes, edges);
                    addFieldTypeEdges(type, field, qualifiedNamesBySimpleName, nodes, edges);
                    addAnnotationEdges(fieldNodeId(type, field), field.annotations(), qualifiedNamesBySimpleName, nodes, edges);
                }

                for (ParsedMethod method : type.methods()) {
                    addMethod(type, method, nodes, edges);
                    addReturnTypeEdges(type, method, qualifiedNamesBySimpleName, nodes, edges);
                    addParameterTypeEdges(type, method, qualifiedNamesBySimpleName, nodes, edges);
                    addAnnotationEdges(methodNodeId(type, method), method.annotations(), qualifiedNamesBySimpleName, nodes, edges);
                }
            }
        }

        return DependencyGraph.of(
                parsedProject.projectPath(),
                nodes.values().stream().sorted(Comparator.comparing(GraphNode::id)).toList(),
                edges.values().stream().sorted(Comparator.comparing(GraphEdge::id)).toList()
        );
    }

    private void addPackageNode(ParsedJavaFile file, Map<String, GraphNode> nodes) {
        GraphNode packageNode = GraphNode.packageNode(file.packageName());
        nodes.putIfAbsent(packageNode.id(), packageNode);
    }

    private void addImportNodesAndEdges(
            ParsedJavaFile file,
            Map<String, String> qualifiedNamesBySimpleName,
            Map<String, GraphNode> nodes,
            Map<String, GraphEdge> edges
    ) {
        Set<String> annotationNames = annotationNames(file);

        for (ParsedType type : file.types()) {
            for (String importedType : file.imports()) {
                if (importedType.endsWith(".*")) {
                    continue;
                }

                String normalizedImport = importedType.startsWith("static ")
                        ? importedType.substring("static ".length())
                        : importedType;
                String simpleImportName = normalizeTypeName(normalizedImport);
                String targetId = annotationNames.contains(simpleImportName)
                        ? annotationTargetId(simpleImportName, qualifiedNamesBySimpleName, nodes)
                        : addTypeReferenceNode(normalizedImport, qualifiedNamesBySimpleName, nodes);
                addEdge(edges, GraphEdge.of(
                        typeNodeId(type),
                        targetId,
                        EdgeKind.IMPORTS,
                        importedType,
                        Map.of("import", importedType)
                ));
            }
        }
    }

    private Set<String> annotationNames(ParsedJavaFile file) {
        Set<String> annotationNames = new LinkedHashSet<>();
        for (ParsedType type : file.types()) {
            annotationNames.addAll(type.annotations());
            for (ParsedField field : type.fields()) {
                annotationNames.addAll(field.annotations());
            }
            for (ParsedMethod method : type.methods()) {
                annotationNames.addAll(method.annotations());
            }
        }
        return annotationNames;
    }

    private void addType(
            ParsedType type,
            ParsedJavaFile file,
            Map<String, GraphNode> nodes,
            Map<String, GraphEdge> edges
    ) {
        nodes.putIfAbsent(typeNodeId(type), GraphNode.typeNode(
                type.qualifiedName(),
                type.simpleName(),
                NodeKind.TYPE,
                type.packageName(),
                type.sourcePath(),
                Map.of(
                        "typeKind", type.kind().name(),
                        "sourceRoot", file.sourceRoot(),
                        "modifiers", String.join(",", type.modifiers()),
                        "annotations", String.join(",", type.annotations())
                )
        ));
        addEdge(edges, GraphEdge.of(packageNodeId(file.packageName()), typeNodeId(type), EdgeKind.DECLARES, type.simpleName()));
    }

    private void addField(
            ParsedType type,
            ParsedField field,
            Map<String, GraphNode> nodes,
            Map<String, GraphEdge> edges
    ) {
        String fieldId = fieldNodeId(type, field);
        nodes.putIfAbsent(fieldId, new GraphNode(
                fieldId,
                field.name(),
                "%s.%s".formatted(type.qualifiedName(), field.name()),
                NodeKind.FIELD,
                type.packageName(),
                type.sourcePath(),
                Map.of("fieldType", field.type())
        ));
        addEdge(edges, GraphEdge.of(typeNodeId(type), fieldId, EdgeKind.HAS_FIELD, field.name()));
    }

    private void addMethod(
            ParsedType type,
            ParsedMethod method,
            Map<String, GraphNode> nodes,
            Map<String, GraphEdge> edges
    ) {
        String methodId = methodNodeId(type, method);
        nodes.putIfAbsent(methodId, new GraphNode(
                methodId,
                method.name(),
                "%s.%s".formatted(type.qualifiedName(), method.name()),
                NodeKind.METHOD,
                type.packageName(),
                type.sourcePath(),
                Map.of(
                        "returnType", method.returnType(),
                        "parameterCount", String.valueOf(method.parameters().size()),
                        "modifiers", String.join(",", method.modifiers()),
                        "annotations", String.join(",", method.annotations())
                )
        ));
        addEdge(edges, GraphEdge.of(typeNodeId(type), methodId, EdgeKind.HAS_METHOD, method.name()));
    }

    private void addFieldTypeEdges(
            ParsedType ownerType,
            ParsedField field,
            Map<String, String> qualifiedNamesBySimpleName,
            Map<String, GraphNode> nodes,
            Map<String, GraphEdge> edges
    ) {
        for (String referencedType : referencedTypeNames(field.type())) {
            String targetId = addTypeReferenceNode(referencedType, qualifiedNamesBySimpleName, nodes);
            addEdge(edges, GraphEdge.of(
                    fieldNodeId(ownerType, field),
                    targetId,
                    EdgeKind.FIELD_TYPE,
                    referencedType,
                    Map.of("declaredType", field.type())
            ));
        }
    }

    private void addReturnTypeEdges(
            ParsedType ownerType,
            ParsedMethod method,
            Map<String, String> qualifiedNamesBySimpleName,
            Map<String, GraphNode> nodes,
            Map<String, GraphEdge> edges
    ) {
        for (String referencedType : referencedTypeNames(method.returnType())) {
            String targetId = addTypeReferenceNode(referencedType, qualifiedNamesBySimpleName, nodes);
            addEdge(edges, GraphEdge.of(
                    methodNodeId(ownerType, method),
                    targetId,
                    EdgeKind.RETURNS,
                    referencedType,
                    Map.of("declaredType", method.returnType())
            ));
        }
    }

    private void addParameterTypeEdges(
            ParsedType ownerType,
            ParsedMethod method,
            Map<String, String> qualifiedNamesBySimpleName,
            Map<String, GraphNode> nodes,
            Map<String, GraphEdge> edges
    ) {
        for (ParsedParameter parameter : method.parameters()) {
            for (String referencedType : referencedTypeNames(parameter.type())) {
                String targetId = addTypeReferenceNode(referencedType, qualifiedNamesBySimpleName, nodes);
                addEdge(edges, GraphEdge.of(
                        methodNodeId(ownerType, method),
                        targetId,
                        EdgeKind.PARAMETER_TYPE,
                        referencedType,
                        Map.of(
                                "parameterName", parameter.name(),
                                "declaredType", parameter.type()
                        )
                ));
            }
        }
    }

    private void addAnnotationEdges(
            String sourceId,
            List<String> annotations,
            Map<String, String> qualifiedNamesBySimpleName,
            Map<String, GraphNode> nodes,
            Map<String, GraphEdge> edges
    ) {
        for (String annotation : annotations) {
            String targetId = annotationTargetId(annotation, qualifiedNamesBySimpleName, nodes);
            addEdge(edges, GraphEdge.of(sourceId, targetId, EdgeKind.ANNOTATED_WITH, annotation));
        }
    }

    private String addTypeReferenceNode(
            String typeName,
            Map<String, String> qualifiedNamesBySimpleName,
            Map<String, GraphNode> nodes
    ) {
        String normalizedTypeName = normalizeTypeName(typeName);
        String resolvedQualifiedName = qualifiedNamesBySimpleName.getOrDefault(normalizedTypeName, normalizedTypeName);
        String parsedTypeNodeId = "type:%s".formatted(resolvedQualifiedName);

        if (nodes.containsKey(parsedTypeNodeId)) {
            return parsedTypeNodeId;
        }

        GraphNode externalNode = GraphNode.externalTypeNode(resolvedQualifiedName);
        nodes.putIfAbsent(externalNode.id(), externalNode);
        return externalNode.id();
    }

    private String annotationTargetId(
            String annotation,
            Map<String, String> qualifiedNamesBySimpleName,
            Map<String, GraphNode> nodes
    ) {
        String normalizedAnnotationName = normalizeTypeName(annotation);
        String resolvedQualifiedName = qualifiedNamesBySimpleName.get(normalizedAnnotationName);

        if (resolvedQualifiedName != null) {
            String parsedTypeNodeId = "type:%s".formatted(resolvedQualifiedName);
            if (nodes.containsKey(parsedTypeNodeId)) {
                return parsedTypeNodeId;
            }
        }

        GraphNode annotationNode = GraphNode.annotationNode(normalizedAnnotationName);
        nodes.putIfAbsent(annotationNode.id(), annotationNode);
        return annotationNode.id();
    }

    private List<String> referencedTypeNames(String typeExpression) {
        if (typeExpression == null || typeExpression.isBlank()) {
            return List.of();
        }

        Set<String> referencedTypes = new LinkedHashSet<>();
        Matcher matcher = TYPE_TOKEN_PATTERN.matcher(typeExpression);
        while (matcher.find()) {
            String token = normalizeTypeName(matcher.group());
            if (!token.isBlank() && !IGNORED_TYPE_TOKENS.contains(token)) {
                referencedTypes.add(token);
            }
        }

        return referencedTypes.stream().sorted().toList();
    }

    private String normalizeTypeName(String typeName) {
        String normalized = typeName == null ? "" : typeName.trim();
        if (normalized.endsWith("...")) {
            normalized = normalized.substring(0, normalized.length() - 3);
        }
        while (normalized.endsWith("[]")) {
            normalized = normalized.substring(0, normalized.length() - 2);
        }

        if (normalized.contains(".")) {
            return Arrays.stream(normalized.split("\\."))
                    .filter(part -> !part.isBlank())
                    .reduce((left, right) -> right)
                    .orElse(normalized);
        }

        return normalized;
    }

    private void addEdge(Map<String, GraphEdge> edges, GraphEdge edge) {
        edges.putIfAbsent(edge.id(), edge);
    }

    private String packageNodeId(String packageName) {
        String normalizedPackage = packageName == null || packageName.isBlank() ? "(default)" : packageName;
        return "package:%s".formatted(normalizedPackage);
    }

    private String typeNodeId(ParsedType type) {
        return "type:%s".formatted(type.qualifiedName());
    }

    private String fieldNodeId(ParsedType type, ParsedField field) {
        return "field:%s#%s".formatted(type.qualifiedName(), field.name());
    }

    private String methodNodeId(ParsedType type, ParsedMethod method) {
        String parameterSignature = method.parameters().stream()
                .map(ParsedParameter::type)
                .collect(Collectors.joining(","));
        return "method:%s#%s(%s)".formatted(type.qualifiedName(), method.name(), parameterSignature);
    }
}
