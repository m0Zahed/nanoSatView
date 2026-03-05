package com.example.demo.monitoring;

import java.util.List;

public record EndpointInfo(
    String path,
    List<String> methods,
    String handler
) {
}
