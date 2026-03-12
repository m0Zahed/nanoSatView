package com.example.demo.diagram;

import com.example.demo.kafka.DiagramKafkaEventPublisher;
import com.example.demo.kafka.DiagramSavedKafkaEvent;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class DiagramSaveService {

    private static final Logger log = LoggerFactory.getLogger(DiagramSaveService.class);

    private final ProjectManagementDiagramRepository repository;
    private final ObjectProvider<DiagramKafkaEventPublisher> kafkaPublisher;
    private final ObjectProvider<DiagramS3StorageService> s3StorageService;
    private final String storageRoot;

    public DiagramSaveService(
        ProjectManagementDiagramRepository repository,
        ObjectProvider<DiagramKafkaEventPublisher> kafkaPublisher,
        ObjectProvider<DiagramS3StorageService> s3StorageService,
        @Value("${app.diagram.storage-root:./data/diagrams}") String storageRoot
    ) {
        this.repository = repository;
        this.kafkaPublisher = kafkaPublisher;
        this.s3StorageService = s3StorageService;
        this.storageRoot = storageRoot;
    }

    public DiagramSaveResponse save(DiagramSaveRequest request) throws IOException {
        String diagramId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        Path projectDir = Paths.get(storageRoot, sanitizeSegment(request.projectId()));
        Files.createDirectories(projectDir);

        Path xmlPath = projectDir.resolve(diagramId + ".xml");
        Files.writeString(xmlPath, request.xmlContent(), StandardCharsets.UTF_8);

        ProjectManagementDiagramEntity entity = new ProjectManagementDiagramEntity();
        entity.setDiagramId(diagramId);
        entity.setEventTime(now);
        entity.setIdOfLastMemberWhoEdited(request.memberId().trim());
        entity.setProjectId(request.projectId().trim());
        entity.setDiagramName(request.diagramName().trim());
        entity.setDiagramDescription((request.diagramDescription() == null ? "" : request.diagramDescription()).trim());
        entity.setFilepathLocal(xmlPath.toAbsolutePath().toString());
        entity.setFilepathS3(uploadToS3IfConfigured(xmlPath, request.projectId().trim(), diagramId));

        repository.save(entity);

        kafkaPublisher.ifAvailable(publisher -> publisher.publish(
            new DiagramSavedKafkaEvent(
                entity.getDiagramId(),
                entity.getEventTime(),
                entity.getIdOfLastMemberWhoEdited(),
                entity.getProjectId(),
                entity.getDiagramName(),
                entity.getDiagramDescription(),
                entity.getFilepathLocal()
            )
        ));

        return new DiagramSaveResponse(
            true,
            "Diagram saved successfully.",
            entity.getDiagramId(),
            entity.getEventTime(),
            entity.getFilepathLocal()
        );
    }

    public List<DiagramSummaryResponse> findByProjectId(String projectId) {
        return repository.findByProjectIdOrderByEventTimeDesc(projectId).stream()
            .map(DiagramSummaryResponse::from)
            .toList();
    }

    public DiagramSummaryResponse findById(String diagramId) {
        return repository.findById(diagramId)
            .map(DiagramSummaryResponse::from)
            .orElse(null);
    }

    private String sanitizeSegment(String raw) {
        return raw.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    private String uploadToS3IfConfigured(Path localFile, String projectId, String diagramId) {
        DiagramS3StorageService uploader = s3StorageService.getIfAvailable();
        if (uploader == null) {
            return null;
        }

        try {
            String s3Path = uploader.uploadDiagramFile(localFile, projectId, diagramId);
            log.info("Uploaded diagram {} for project {} to {}", diagramId, projectId, s3Path);
            return s3Path;
        } catch (RuntimeException ex) {
            log.warn(
                "Failed to upload diagram {} for project {} to S3. Local file remains at {}. Cause: {}",
                diagramId,
                projectId,
                localFile.toAbsolutePath(),
                ex.getMessage()
            );
            return null;
        }
    }
}
