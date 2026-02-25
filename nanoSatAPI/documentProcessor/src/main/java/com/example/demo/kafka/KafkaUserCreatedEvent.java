package com.example.demo.kafka;

import java.time.Instant;

public record KafkaUserCreatedEvent(String username, Instant createdAt) {
}
