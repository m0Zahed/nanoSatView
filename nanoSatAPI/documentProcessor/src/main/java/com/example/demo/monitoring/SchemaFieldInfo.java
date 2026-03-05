package com.example.demo.monitoring;

import java.util.List;

public record SchemaFieldInfo(
    String name,
    String type,
    List<String> annotations
) {
}
