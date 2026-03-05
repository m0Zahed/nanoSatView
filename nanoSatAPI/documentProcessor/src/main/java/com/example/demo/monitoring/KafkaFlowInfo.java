package com.example.demo.monitoring;

import java.time.Instant;

public record KafkaFlowInfo(
    String topic,
    long produced,
    long consumed,
    Instant lastEventAt
) {
}
