using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models;

public class ProjectComponent
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Type { get; set; } = string.Empty;

    [Required]
    public int Quantity { get; set; } = 1;

    [MaxLength(4000)]
    public string Notes { get; set; } = string.Empty;

    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid[] RequirementIds { get; set; } = Array.Empty<Guid>();

    [Required]
    public string BuilderStackJson { get; set; } = "[]";

    public string MarkdownDraft { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string LastEditedBy { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string LastEditedByName { get; set; } = string.Empty;

    public DateTime LastEditedAt { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Project? Project { get; set; }
}
