package com.example.demo.monitoring;

import java.util.List;

public record SchemaInfo(
    String name,
    List<SchemaFieldInfo> fields
) {
}
