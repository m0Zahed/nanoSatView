using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models;

public class OrganizationProjectIndex
{
    [Key]
    [MaxLength(200)]
    public string OrganizationId { get; set; } = string.Empty;

    [Required]
    public string[] ProjectIds { get; set; } = Array.Empty<string>();
}
