package com.example.demo.kafka;

import java.time.Instant;

public record DiagramSavedKafkaEvent(
    String diagramId,
    Instant eventTime,
    String memberId,
    String projectId,
    String diagramName,
    String diagramDescription,
    String filepathLocal
) {
}
