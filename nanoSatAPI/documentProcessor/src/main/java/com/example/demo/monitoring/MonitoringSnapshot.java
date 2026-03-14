package com.example.demo.monitoring;

import java.time.Instant;
import java.util.List;
import com.example.demo.kafka.ComponentEditedKafkaEvent;

public record MonitoringSnapshot(
    Instant generatedAt,
    long uptimeSeconds,
    boolean kafkaEnabled,
    List<KafkaFlowInfo> kafkaFlows,
    List<EndpointInfo> endpoints,
    List<SchemaInfo> schemas,
    DiagramStorageInfo diagramStorage,
    List<RequestTrace> recentRequests,
    List<ComponentEditedKafkaEvent> recentComponentEvents
) {
}
