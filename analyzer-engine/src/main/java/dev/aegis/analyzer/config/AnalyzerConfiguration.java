package dev.aegis.analyzer.config;

public record AnalyzerConfiguration(String analyzerVersion) {
    public static AnalyzerConfiguration defaultConfiguration() {
        return new AnalyzerConfiguration("0.1.0-SNAPSHOT");
    }
}
