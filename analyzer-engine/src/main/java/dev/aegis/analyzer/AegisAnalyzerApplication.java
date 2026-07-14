package dev.aegis.analyzer;

import dev.aegis.analyzer.cli.CliParser;
import dev.aegis.analyzer.core.AnalysisStatus;
import dev.aegis.analyzer.core.AnalyzerApplicationService;
import dev.aegis.analyzer.core.AnalyzerResponse;
import dev.aegis.analyzer.exporter.JsonResponseWriter;
import dev.aegis.analyzer.graph.ParsedModelDependencyGraphBuilder;
import dev.aegis.analyzer.parser.JavaParserSourceParser;
import dev.aegis.analyzer.scanner.DefaultProjectScanner;

public final class AegisAnalyzerApplication {
    private AegisAnalyzerApplication() {
    }

    public static void main(String[] args) {
        AnalyzerApplicationService applicationService = new AnalyzerApplicationService(
                new CliParser(),
                new DefaultProjectScanner(),
                new JavaParserSourceParser(),
                new ParsedModelDependencyGraphBuilder()
        );
        JsonResponseWriter responseWriter = JsonResponseWriter.createDefault();
        AnalyzerResponse response = applicationService.execute(args);

        System.out.println(responseWriter.write(response));
        System.exit(response.status() == AnalysisStatus.SUCCESS ? 0 : 1);
    }
}
