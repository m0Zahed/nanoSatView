using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models;

public class ProjectInvite
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }

    [Required]
    [MaxLength(120)]
    public string Token { get; set; } = string.Empty;

    [Required]
    public DateTime ExpiresAt { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RedeemedAt { get; set; }
}
