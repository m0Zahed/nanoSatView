package com.example.demo.diagram;

public record StorageHealthResponse(
    boolean localStorageReady,
    String localStorageRoot,
    boolean s3Enabled,
    boolean s3Reachable,
    String s3Bucket,
    String message
) {
}
