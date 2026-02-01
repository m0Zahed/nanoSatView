namespace ProjectManagement.Models;

public record RequirementCreateDto(
    string Title,
    string Description,
    string Type,
    RequirementLevel Level,
    string Subsystem,
    string[] Tags
);

public record RequirementUpdateDto(
    string Title,
    string Description,
    string Type,
    RequirementLevel Level,
    string Subsystem,
    string[] Tags
);
