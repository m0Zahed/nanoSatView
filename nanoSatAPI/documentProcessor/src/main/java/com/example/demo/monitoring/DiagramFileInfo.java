package com.example.demo.monitoring;

import java.time.Instant;

public record DiagramFileInfo(
    String relativePath,
    long sizeBytes,
    Instant lastModifiedAt
) {
}
