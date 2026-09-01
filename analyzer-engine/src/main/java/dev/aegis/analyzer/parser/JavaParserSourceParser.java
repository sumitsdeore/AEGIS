package dev.aegis.analyzer.parser;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ParseProblemException;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.Modifier;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.EnumDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.body.Parameter;
import com.github.javaparser.ast.body.RecordDeclaration;
import com.github.javaparser.ast.body.TypeDeclaration;
import com.github.javaparser.ast.expr.AnnotationExpr;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.MarkerAnnotationExpr;
import com.github.javaparser.ast.expr.NormalAnnotationExpr;
import com.github.javaparser.ast.expr.SingleMemberAnnotationExpr;
import com.github.javaparser.ast.expr.StringLiteralExpr;
import com.github.javaparser.ast.nodeTypes.NodeWithAnnotations;
import com.github.javaparser.ast.nodeTypes.NodeWithModifiers;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import dev.aegis.analyzer.core.DiagnosticSeverity;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

public final class JavaParserSourceParser implements JavaSourceParser {
    private final JavaParser javaParser;

    public JavaParserSourceParser() {
        this(new JavaParser(new ParserConfiguration().setLanguageLevel(ParserConfiguration.LanguageLevel.JAVA_21)));
    }

    JavaParserSourceParser(JavaParser javaParser) {
        this.javaParser = Objects.requireNonNull(javaParser, "javaParser must not be null");
    }

    @Override
    public ParsedProject parse(Path projectPath, List<String> sourceRoots) {
        Objects.requireNonNull(projectPath, "projectPath must not be null");
        Objects.requireNonNull(sourceRoots, "sourceRoots must not be null");

        Path normalizedProjectPath = projectPath.toAbsolutePath().normalize();
        List<ParsedJavaFile> files = new ArrayList<>();
        List<ParseDiagnostic> diagnostics = new ArrayList<>();

        if (sourceRoots.isEmpty()) {
            diagnostics.add(ParseDiagnostic.warning("", "No source roots were available for Java parsing.", 0, 0));
            return ParsedProject.fromFiles(normalizedProjectPath.toString(), files, diagnostics);
        }

        for (String sourceRoot : sourceRoots) {
            Path sourceRootPath = normalizedProjectPath.resolve(sourceRoot).normalize();
            if (!Files.isDirectory(sourceRootPath)) {
                diagnostics.add(ParseDiagnostic.warning(sourceRoot, "Source root does not exist or is not a directory.", 0, 0));
                continue;
            }

            for (Path javaFile : findJavaFiles(sourceRootPath, sourceRoot, diagnostics)) {
                files.add(parseJavaFile(normalizedProjectPath, sourceRootPath, sourceRoot, javaFile));
            }
        }

        diagnostics.addAll(files.stream().flatMap(file -> file.diagnostics().stream()).toList());

        return ParsedProject.fromFiles(normalizedProjectPath.toString(), files, diagnostics);
    }

    private List<Path> findJavaFiles(Path sourceRootPath, String sourceRoot, List<ParseDiagnostic> diagnostics) {
        try (Stream<Path> stream = Files.walk(sourceRootPath)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".java"))
                    .sorted(Comparator.comparing(Path::toString))
                    .toList();
        } catch (IOException exception) {
            diagnostics.add(ParseDiagnostic.error(sourceRoot, "Failed to scan source root: %s".formatted(exception.getMessage()), 0, 0));
            return List.of();
        }
    }

    private ParsedJavaFile parseJavaFile(Path projectPath, Path sourceRootPath, String sourceRoot, Path javaFile) {
        String relativePath = projectPath.relativize(javaFile).toString();
        List<ParseDiagnostic> diagnostics = new ArrayList<>();

        try {
            ParseResult<CompilationUnit> parseResult = javaParser.parse(javaFile);
            diagnostics.addAll(parseResult.getProblems().stream()
                    .map(problem -> ParseDiagnostic.error(
                            relativePath,
                            problem.getMessage(),
                            0,
                            0
                    ))
                    .toList());

            return parseResult.getResult()
                    .map(unit -> fromCompilationUnit(sourceRootPath, sourceRoot, javaFile, relativePath, unit, diagnostics))
                    .orElseGet(() -> ParsedJavaFile.empty(sourceRoot, sourceRootPath.relativize(javaFile).toString(), "", diagnostics));
        } catch (IOException | ParseProblemException exception) {
            diagnostics.add(ParseDiagnostic.error(relativePath, "Failed to parse Java source: %s".formatted(exception.getMessage()), 0, 0));
            return ParsedJavaFile.empty(sourceRoot, sourceRootPath.relativize(javaFile).toString(), "", diagnostics);
        }
    }

    private ParsedJavaFile fromCompilationUnit(
            Path sourceRootPath,
            String sourceRoot,
            Path javaFile,
            String projectRelativePath,
            CompilationUnit unit,
            List<ParseDiagnostic> diagnostics
    ) {
        String packageName = unit.getPackageDeclaration()
                .map(packageDeclaration -> packageDeclaration.getName().asString())
                .orElse("");
        List<String> imports = unit.getImports().stream()
                .map(this::formatImport)
                .sorted()
                .toList();
        List<ParsedType> types = unit.findAll(TypeDeclaration.class).stream()
                .map(type -> toParsedType(type, packageName, projectRelativePath))
                .sorted(Comparator.comparing(ParsedType::qualifiedName))
                .toList();

        return new ParsedJavaFile(
                sourceRoot,
                sourceRootPath.relativize(javaFile).toString(),
                packageName,
                imports,
                types,
                diagnostics
        );
    }

    private ParsedType toParsedType(TypeDeclaration<?> type, String packageName, String sourcePath) {
        List<ParsedField> fields = type.getFields().stream()
                .flatMap(field -> field.getVariables().stream()
                        .map(variable -> new ParsedField(
                                variable.getNameAsString(),
                                variable.getTypeAsString(),
                                modifiers(field),
                                annotations(field),
                                annotationDetails(field),
                                sourceRange(field)
                        )))
                .sorted(Comparator.comparing(ParsedField::name))
                .toList();
        List<ParsedMethod> methods = type.getMethods().stream()
                .map(method -> new ParsedMethod(
                        method.getNameAsString(),
                        method.getTypeAsString(),
                        method.getParameters().stream().map(this::toParsedParameter).toList(),
                        modifiers(method),
                        annotations(method),
                        annotationDetails(method),
                        sourceRange(method)
                ))
                .sorted(Comparator.comparing(ParsedMethod::name).thenComparing(method -> method.parameters().size()))
                .toList();

        return new ParsedType(
                type.getFullyQualifiedName().orElse(composeQualifiedName(packageName, type.getNameAsString())),
                type.getNameAsString(),
                packageName,
                typeKind(type),
                sourcePath,
                modifiers(type),
                annotations(type),
                annotationDetails(type),
                extractSuperclass(type),
                extractInterfaces(type),
                fields,
                methods,
                sourceRange(type)
        );
    }

    private ParsedParameter toParsedParameter(Parameter parameter) {
        return new ParsedParameter(parameter.getNameAsString(), parameter.getTypeAsString());
    }

    private String formatImport(ImportDeclaration importDeclaration) {
        StringBuilder builder = new StringBuilder();
        if (importDeclaration.isStatic()) {
            builder.append("static ");
        }

        builder.append(importDeclaration.getNameAsString());
        if (importDeclaration.isAsterisk()) {
            builder.append(".*");
        }

        return builder.toString();
    }

    private TypeKind typeKind(TypeDeclaration<?> type) {
        if (type instanceof ClassOrInterfaceDeclaration classOrInterfaceDeclaration) {
            return classOrInterfaceDeclaration.isInterface() ? TypeKind.INTERFACE : TypeKind.CLASS;
        }

        if (type instanceof EnumDeclaration) {
            return TypeKind.ENUM;
        }

        if (type instanceof RecordDeclaration) {
            return TypeKind.RECORD;
        }

        return TypeKind.ANNOTATION;
    }

    private String extractSuperclass(TypeDeclaration<?> type) {
        if (type instanceof ClassOrInterfaceDeclaration classDecl && !classDecl.isInterface()) {
            return classDecl.getExtendedTypes().stream()
                    .map(ClassOrInterfaceType::asString)
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    private List<String> extractInterfaces(TypeDeclaration<?> type) {
        if (type instanceof ClassOrInterfaceDeclaration classDecl) {
            if (classDecl.isInterface()) {
                return classDecl.getExtendedTypes().stream()
                        .map(ClassOrInterfaceType::asString)
                        .sorted()
                        .toList();
            }
            return classDecl.getImplementedTypes().stream()
                    .map(ClassOrInterfaceType::asString)
                    .sorted()
                    .toList();
        }
        if (type instanceof RecordDeclaration recordDecl) {
            return recordDecl.getImplementedTypes().stream()
                    .map(ClassOrInterfaceType::asString)
                    .sorted()
                    .toList();
        }
        if (type instanceof EnumDeclaration enumDecl) {
            return enumDecl.getImplementedTypes().stream()
                    .map(ClassOrInterfaceType::asString)
                    .sorted()
                    .toList();
        }
        return List.of();
    }

    private List<String> modifiers(Node node) {
        if (!(node instanceof NodeWithModifiers<?> nodeWithModifiers)) {
            return List.of();
        }

        return nodeWithModifiers.getModifiers().stream()
                .map(Modifier::getKeyword)
                .map(Modifier.Keyword::asString)
                .sorted()
                .toList();
    }

    private List<String> annotations(Node node) {
        if (!(node instanceof NodeWithAnnotations<?> nodeWithAnnotations)) {
            return List.of();
        }

        return nodeWithAnnotations.getAnnotations().stream()
                .map(AnnotationExpr::getNameAsString)
                .sorted()
                .toList();
    }

    private List<ParsedAnnotation> annotationDetails(Node node) {
        if (!(node instanceof NodeWithAnnotations<?> nodeWithAnnotations)) {
            return List.of();
        }

        return nodeWithAnnotations.getAnnotations().stream()
                .map(this::toParsedAnnotation)
                .sorted(Comparator.comparing(ParsedAnnotation::name))
                .toList();
    }

    private ParsedAnnotation toParsedAnnotation(AnnotationExpr annotationExpr) {
        String name = annotationExpr.getNameAsString();
        if (annotationExpr instanceof MarkerAnnotationExpr) {
            return ParsedAnnotation.marker(name);
        }
        if (annotationExpr instanceof SingleMemberAnnotationExpr singleMember) {
            String val = formatExpression(singleMember.getMemberValue());
            return new ParsedAnnotation(name, Map.of("value", val));
        }
        if (annotationExpr instanceof NormalAnnotationExpr normal) {
            Map<String, String> args = new LinkedHashMap<>();
            normal.getPairs().forEach(pair -> {
                args.put(pair.getNameAsString(), formatExpression(pair.getValue()));
            });
            return new ParsedAnnotation(name, args);
        }
        return ParsedAnnotation.marker(name);
    }

    private String formatExpression(Expression expression) {
        if (expression instanceof StringLiteralExpr stringLiteral) {
            return stringLiteral.getValue();
        }
        return expression.toString();
    }

    private SourceRange sourceRange(Node node) {
        return node.getRange()
                .map(range -> new SourceRange(
                        range.begin.line,
                        range.begin.column,
                        range.end.line,
                        range.end.column
                ))
                .orElse(SourceRange.unknown());
    }

    private String composeQualifiedName(String packageName, String simpleName) {
        if (packageName.isBlank()) {
            return simpleName;
        }

        return "%s.%s".formatted(packageName, simpleName);
    }
}
