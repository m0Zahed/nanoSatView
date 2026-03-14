using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models;

public class ComponentAuditEvent
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid ComponentId { get; set; }

    [Required]
    [MaxLength(200)]
    public string ComponentName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string EditorId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string EditorName { get; set; } = string.Empty;

    [Required]
    public DateTime EventTime { get; set; } = DateTime.UtcNow;

    public Project? Project { get; set; }
}
