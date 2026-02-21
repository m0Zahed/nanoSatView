using System.ComponentModel.DataAnnotations;

namespace ProjectManagement.Models;

/// <summary>
/// Per-member index for fast project membership lookup and role resolution.
/// Mapping rule:
/// MemberId + ProjectId -> Roles[] (unique key per project inside each member row).
/// </summary>
public class MemberProjectIndex
{
    /// <summary>
    /// Member identifier (primary key for this index row).
    /// </summary>
    [Key]
    [MaxLength(200)]
    public string MemberId { get; set; } = string.Empty;

    /// <summary>
    /// Flat project membership list for the member (kept for simple membership queries).
    /// </summary>
    [Required]
    public string[] ProjectIds { get; set; } = Array.Empty<string>();

    /// <summary>
    /// ProjectId -> roles mapping for this member.
    /// Each project id appears at most once as a dictionary key.
    /// </summary>
    [Required]
    public Dictionary<string, string[]> ProjectRoles { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
