using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models;

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

    [MaxLength(200)]
    public string RequirementsListId { get; set; } = string.Empty;

    [MaxLength(200)]
    public string ComponentsListId { get; set; } = string.Empty;

    [MaxLength(200)]
    public string TimelineId { get; set; } = string.Empty;

    [MaxLength(200)]
    public string IntegrationsId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ProjectInvite> Invites { get; set; } = new List<ProjectInvite>();
}
