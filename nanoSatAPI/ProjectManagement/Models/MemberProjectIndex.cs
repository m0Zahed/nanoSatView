using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models;

public class MemberProjectIndex
{
    [Key]
    [MaxLength(200)]
    public string MemberId { get; set; } = string.Empty;

    [Required]
    public string[] ProjectIds { get; set; } = Array.Empty<string>();
}
