package com.example.demo.diagram;

import java.time.Instant;

public record DiagramSaveResponse(
    boolean success,
    String message,
    String diagramId,
    Instant time,
    String filePath
) {
}
