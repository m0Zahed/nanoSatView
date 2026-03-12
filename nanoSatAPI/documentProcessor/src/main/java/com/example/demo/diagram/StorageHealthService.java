package com.example.demo.diagram;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Service
public class StorageHealthService {

    private final String storageRoot;
    private final boolean s3Enabled;
    private final String s3Bucket;
    private final ObjectProvider<S3Client> s3ClientProvider;

    public StorageHealthService(
        @Value("${app.diagram.storage-root:./data/diagrams}") String storageRoot,
        @Value("${app.s3.enabled:false}") boolean s3Enabled,
        @Value("${app.s3.bucket:}") String s3Bucket,
        ObjectProvider<S3Client> s3ClientProvider
    ) {
        this.storageRoot = storageRoot;
        this.s3Enabled = s3Enabled;
        this.s3Bucket = s3Bucket;
        this.s3ClientProvider = s3ClientProvider;
    }

    public StorageHealthResponse check() {
        Path root = Paths.get(storageRoot).toAbsolutePath().normalize();
        boolean localReady = false;
        String message = "Local storage unavailable.";

        try {
            Files.createDirectories(root);
            localReady = Files.isDirectory(root) && Files.isWritable(root);
            message = localReady ? "Local storage is writable." : "Local storage is not writable.";
        } catch (Exception ex) {
            message = "Local storage check failed: " + ex.getMessage();
        }

        if (!s3Enabled) {
            return new StorageHealthResponse(localReady, root.toString(), false, false, null, message + " S3 is disabled.");
        }

        if (s3Bucket == null || s3Bucket.isBlank()) {
            return new StorageHealthResponse(
                localReady,
                root.toString(),
                true,
                false,
                null,
                message + " S3 is enabled but app.s3.bucket is missing."
            );
        }

        S3Client s3Client = s3ClientProvider.getIfAvailable();
        if (s3Client == null) {
            return new StorageHealthResponse(
                localReady,
                root.toString(),
                true,
                false,
                s3Bucket,
                message + " S3 client is not configured."
            );
        }

        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(s3Bucket).build());
            return new StorageHealthResponse(
                localReady,
                root.toString(),
                true,
                true,
                s3Bucket,
                message + " S3 bucket is reachable."
            );
        } catch (S3Exception ex) {
            return new StorageHealthResponse(
                localReady,
                root.toString(),
                true,
                false,
                s3Bucket,
                message + " S3 check failed: " + ex.awsErrorDetails().errorMessage()
            );
        } catch (RuntimeException ex) {
            return new StorageHealthResponse(
                localReady,
                root.toString(),
                true,
                false,
                s3Bucket,
                message + " S3 check failed: " + ex.getMessage()
            );
        }
    }
}
