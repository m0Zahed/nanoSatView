using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models;

/// <summary>
/// Organization/workspace metadata used to group projects in the frontend.
/// </summary>
public class Organisation 
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(8)]
    public string Initials { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Color { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string InviteLink { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
