package com.example.demo.monitoring;

import java.time.Instant;

public record RequestTrace(
    Instant timestamp,
    String method,
    String path,
    String query,
    int status,
    long durationMs,
    String origin,
    String referer,
    String remoteAddr,
    String userAgent,
    String source,
    String bodyPreview
) {
}
