using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models;

/// <summary>
/// One-time/expiring invite token used to join an organization.
/// </summary>
public class OrganisationInvite
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string OrganizationId { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Token { get; set; } = string.Empty;

    [Required]
    public DateTime ExpiresAt { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RedeemedAt { get; set; }
}
