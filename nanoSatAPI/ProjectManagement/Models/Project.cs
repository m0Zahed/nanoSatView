using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models;

/// <summary>
/// Project aggregate persisted for dashboard/project management flows.
/// Linked to an organization by OrganizationId and to requirements by ProjectId.
/// </summary>
public class Project
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Owner { get; set; } = string.Empty;

    [Required]
    public bool IsPublic { get; set; }

    [Required]
    public string[] DocumentIds { get; set; } = Array.Empty<string>();

    [Required]
    public string[] MemberIds { get; set; } = Array.Empty<string>();

    [Required]
    public string[] PendingRequests { get; set; } = Array.Empty<string>();

    [Required]
    public bool PersonalProject { get; set; } = false;

    [Required]
    [MaxLength(200)]
    public string OrganizationId { get; set; } = string.Empty;

    public ICollection<Requirement> Requirements { get; set; } = new List<Requirement>();
    public ICollection<ProjectComponent> Components { get; set; } = new List<ProjectComponent>();
    public ICollection<ComponentAuditEvent> ComponentAuditEvents { get; set; } = new List<ComponentAuditEvent>();

    [MaxLength(200)]
    public string ComponentsListId { get; set; } = string.Empty;

    [MaxLength(200)]
    public string TimelineId { get; set; } = string.Empty;

    [MaxLength(200)]
    public string IntegrationsId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

}
