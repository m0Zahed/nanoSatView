using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models;

/// <summary>
/// Requirement record belonging to one project (ProjectId foreign key).
/// </summary>
public class Requirement
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string ReqId { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Subsystem { get; set; } = string.Empty;

    [Required]
    public string[] Tags { get; set; } = Array.Empty<string>();

    [Required]
    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }
}
