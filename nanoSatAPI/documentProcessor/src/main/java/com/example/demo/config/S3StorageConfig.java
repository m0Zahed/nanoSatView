package com.example.demo.config;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

@Configuration
public class S3StorageConfig {

    @Bean
    @ConditionalOnProperty(prefix = "app.s3", name = "enabled", havingValue = "true")
    public S3Client s3Client(
        @Value("${app.s3.region:us-east-1}") String region,
        @Value("${app.s3.endpoint:}") String endpoint,
        @Value("${app.s3.path-style-access:false}") boolean pathStyleAccess
    ) {
        var builder = S3Client.builder()
            .region(Region.of(region))
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(pathStyleAccess).build());

        if (endpoint != null && !endpoint.isBlank()) {
            builder = builder.endpointOverride(URI.create(endpoint));
        }

        return builder.build();
    }
}
