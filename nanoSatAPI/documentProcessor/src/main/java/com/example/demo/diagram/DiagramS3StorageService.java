package com.example.demo.diagram;

import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@ConditionalOnProperty(prefix = "app.s3", name = "enabled", havingValue = "true")
public class DiagramS3StorageService {

    private final S3Client s3Client;
    private final String bucket;
    private final String keyPrefix;

    public DiagramS3StorageService(
        S3Client s3Client,
        @Value("${app.s3.bucket:}") String bucket,
        @Value("${app.s3.key-prefix:diagrams}") String keyPrefix
    ) {
        this.s3Client = s3Client;
        this.bucket = bucket;
        this.keyPrefix = keyPrefix;
    }

    public String uploadDiagramFile(Path localFile, String projectId, String diagramId) {
        if (bucket == null || bucket.isBlank()) {
            throw new IllegalStateException("app.s3.bucket is required when app.s3.enabled=true");
        }

        String key = buildObjectKey(projectId, diagramId);

        PutObjectRequest request = PutObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .contentType("application/xml")
            .build();

        s3Client.putObject(request, RequestBody.fromFile(localFile));
        return "s3://" + bucket + "/" + key;
    }

    private String buildObjectKey(String projectId, String diagramId) {
        String normalizedPrefix = keyPrefix == null ? "" : keyPrefix.trim();
        if (normalizedPrefix.startsWith("/")) {
            normalizedPrefix = normalizedPrefix.substring(1);
        }
        if (normalizedPrefix.endsWith("/")) {
            normalizedPrefix = normalizedPrefix.substring(0, normalizedPrefix.length() - 1);
        }

        String projectSegment = sanitizeSegment(projectId);
        String filename = diagramId + ".xml";

        if (normalizedPrefix.isEmpty()) {
            return projectSegment + "/" + filename;
        }
        return normalizedPrefix + "/" + projectSegment + "/" + filename;
    }

    private String sanitizeSegment(String raw) {
        return raw.replaceAll("[^A-Za-z0-9._-]", "_");
    }
}
