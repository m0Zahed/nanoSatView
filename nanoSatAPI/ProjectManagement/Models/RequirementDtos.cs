namespace ProjectManagement.Models;

public record RequirementCreateDto(
    string ReqId,
    string Description,
    string Subsystem,
    Guid ProjectId,
    string[] Tags,
    string[] AssignedComponents
);

public record RequirementUpdateDto(
    string ReqId,
    string Description,
    string Subsystem,
    Guid ProjectId,
    string[] Tags,
    string[] AssignedComponents
);
