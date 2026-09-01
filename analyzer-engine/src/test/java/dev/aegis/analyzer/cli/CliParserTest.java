package dev.aegis.analyzer.cli;

import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CliParserTest {
    private final CliParser parser = new CliParser();

    @Test
    void parsesAnalyzeCommandWithProjectPath() {
        CliRequest request = parser.parse(new String[]{"analyze", "--project", "."});

        assertEquals(AnalyzerCommand.ANALYZE, request.command());
        assertTrue(request.projectPath().isPresent());
        assertEquals(Path.of(".").toAbsolutePath().normalize(), request.projectPath().orElseThrow());
        assertEquals(OutputFormat.JSON, request.outputFormat());
    }

    @Test
    void parsesAnalyzeCommandWithShortProjectFlag() {
        CliRequest request = parser.parse(new String[]{"analyze", "-p", "."});

        assertEquals(AnalyzerCommand.ANALYZE, request.command());
        assertTrue(request.projectPath().isPresent());
    }

    @Test
    void parsesHelpCommand() {
        CliRequest request = parser.parse(new String[]{"help"});

        assertEquals(AnalyzerCommand.HELP, request.command());
        assertTrue(request.projectPath().isEmpty());
    }

    @Test
    void rejectsUnknownCommand() {
        CliParseException exception = assertThrows(
                CliParseException.class,
                () -> parser.parse(new String[]{"scan", "--project", "."})
        );

        assertEquals("Unknown command 'scan'.", exception.getMessage());
    }

    @Test
    void rejectsAnalyzeCommandWithoutProjectPath() {
        CliParseException exception = assertThrows(
                CliParseException.class,
                () -> parser.parse(new String[]{"analyze"})
        );

        assertEquals("Missing required option '--project <path>'.", exception.getMessage());
    }

    @Test
    void rejectsUnsupportedOutputFormat() {
        CliParseException exception = assertThrows(
                CliParseException.class,
                () -> parser.parse(new String[]{"analyze", "--project", ".", "--format", "xml"})
        );

        assertEquals("Unsupported output format 'xml'. Only 'json' is supported.", exception.getMessage());
    }
}
