package com.example.demo.diagram;

import jakarta.validation.constraints.NotBlank;

public record DiagramSaveRequest(
    @NotBlank String projectId,
    @NotBlank String memberId,
    @NotBlank String diagramName,
    String diagramDescription,
    @NotBlank String xmlContent
) {
}
