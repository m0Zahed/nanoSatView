package com.example.demo.event;

import java.time.Instant;

public record UserCreatedEvent(String username, Instant createdAt) {
}