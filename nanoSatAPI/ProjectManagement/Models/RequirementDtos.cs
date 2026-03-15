namespace ProjectManagement.Models;

public record RequirementCreateDto(
    string ReqId,
    string Description,
    string Subsystem,
    Guid ProjectId,
    string[] Tags
);

public record RequirementUpdateDto(
    string ReqId,
    string Description,
    string Subsystem,
    Guid ProjectId,
    string[] Tags
);

public record RequirementResponseDto(
    Guid Id,
    string ReqId,
    string Description,
    string Subsystem,
    string[] Tags,
    string[] AssignedComponents,
    Guid ProjectId
);
