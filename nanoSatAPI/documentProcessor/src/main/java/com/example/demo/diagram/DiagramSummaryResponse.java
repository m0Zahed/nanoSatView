package com.example.demo.diagram;

import java.time.Instant;

public record DiagramSummaryResponse(
    String diagramId,
    Instant eventTime,
    String idOfLastMemberWhoEdited,
    String projectId,
    String diagramName,
    String diagramDescription,
    String filepathLocal
) {
    public static DiagramSummaryResponse from(ProjectManagementDiagramEntity entity) {
        return new DiagramSummaryResponse(
            entity.getDiagramId(),
            entity.getEventTime(),
            entity.getIdOfLastMemberWhoEdited(),
            entity.getProjectId(),
            entity.getDiagramName(),
            entity.getDiagramDescription(),
            entity.getFilepathLocal()
        );
    }
}
