package com.example.demo.kafka;

import java.time.Instant;

public record ComponentEditedKafkaEvent(
    String projectId,
    String componentId,
    String componentName,
    String action,
    String editorId,
    String editorName,
    Instant eventTime
) {
}
