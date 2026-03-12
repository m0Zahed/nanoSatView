namespace ProjectManagement.Models;

public record ProjectCreateDto(
    string Name,
    string Description,
    string Owner,
    bool IsPublic,
    bool PersonalProject,
    string OrganizationId,
    string RequirementsListId,
    string ComponentsListId,
    string TimelineId,
    string IntegrationsId,
    string[] DocumentIds,
    string[] MemberIds,
    string[] PendingRequests
);

public record ProjectUpdateDto(
    string Name,
    string Description,
    string Owner,
    bool IsPublic,
    bool PersonalProject,
    string OrganizationId,
    string RequirementsListId,
    string ComponentsListId,
    string TimelineId,
    string IntegrationsId,
    string[] DocumentIds,
    string[] MemberIds,
    string[] PendingRequests
);

public record CreateInviteResponse(
    string Token,
    DateTime ExpiresAt,
    string? Link
);

public record ProjectJoinRequest(
    string Token,
    string MemberId
);
