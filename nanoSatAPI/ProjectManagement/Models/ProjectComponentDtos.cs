namespace ProjectManagement.Models;

public record ComponentBuilderBlobDto(
    string Id,
    string Type,
    string Title,
    string Content,
    string? SourceId
);

public record ProjectComponentCreateDto(
    string Name,
    string Type,
    int Quantity,
    string Notes,
    Guid ProjectId,
    Guid[] RequirementIds,
    List<ComponentBuilderBlobDto>? BuilderStack,
    string MarkdownDraft,
    string EditorId,
    string EditorName
);

public record ProjectComponentUpdateDto(
    string Name,
    string Type,
    int Quantity,
    string Notes,
    Guid ProjectId,
    Guid[] RequirementIds,
    List<ComponentBuilderBlobDto>? BuilderStack,
    string MarkdownDraft,
    string EditorId,
    string EditorName
);

public record ProjectComponentResponseDto(
    Guid Id,
    string Name,
    string Type,
    int Quantity,
    string Notes,
    Guid ProjectId,
    Guid[] RequirementIds,
    List<ComponentBuilderBlobDto> BuilderStack,
    string MarkdownDraft,
    string LastEditedBy,
    string LastEditedByName,
    DateTime LastEditedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ComponentAuditEventResponseDto(
    Guid Id,
    Guid ProjectId,
    Guid ComponentId,
    string ComponentName,
    string Action,
    string EditorId,
    string EditorName,
    DateTime EventTime
);
