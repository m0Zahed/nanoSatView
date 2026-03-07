using System.Data;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:6969", "http://0.0.0.0:5001");

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddDbContext<RequirementsDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Default");
    options.UseNpgsql(connectionString);
});

var allowedOrigins = (builder.Configuration["ALLOWED_ORIGINS"] ?? string.Empty)
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else
        {
            policy.SetIsOriginAllowed(IsLocalDevOrigin)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors();

app.Lifetime.ApplicationStopping.Register(() =>
{
    PersistSeedDataSnapshotOnShutdown(app);
});


// Infra endpoint: used by local/dev checks and deployment probes, not directly called by UI screens.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
// Infra endpoint: lets frontend/debug tools show API version mismatch issues.
app.MapGet("/version", (IConfiguration config) =>
{
    var version = config["APP_VERSION"] ?? "unknown";
    return Results.Ok(new { version });
});

// =======================================   REQUIREMENTS  ============================================= 


// Frontend requirements list/detail screens: fetch all requirements for browsing/filtering.
app.MapGet("/requirements", async (RequirementsDbContext db) =>
    await db.Requirements.AsNoTracking().OrderBy(r => r.Title).ToListAsync()
);

// Frontend requirement detail/edit screen: fetch one requirement by id.
app.MapGet("/requirements/{id:guid}", async (Guid id, RequirementsDbContext db) =>
{
    var requirement = await db.Requirements.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
    return requirement is null ? Results.NotFound() : Results.Ok(requirement);
});

// Frontend requirement create flow: create a new requirement under a project.
app.MapPost("/requirements", async (RequirementCreateDto input, RequirementsDbContext db) =>
{
    if (!IsValidRequirementCreate(input))
    {
        return Results.BadRequest(new { error = "Invalid requirement payload." });
    }

    var projectExists = await db.Projects
        .AsNoTracking()
        .AnyAsync(p => p.Id == input.ProjectId);
    if (!projectExists)
    {
        return Results.BadRequest(new { error = "ProjectId does not exist." });
    }

    var requirement = new Requirement
    {
        Title = input.Title.Trim(),
        Description = input.Description.Trim(),
        Type = input.Type.Trim(),
        Level = input.Level,
        Subsystem = input.Subsystem.Trim(),
        ProjectId = input.ProjectId,
        Tags = NormalizeTags(input.Tags),
    };

    db.Requirements.Add(requirement);
    await db.SaveChangesAsync();

    return Results.Created($"/requirements/{requirement.Id}", requirement);
});

// Frontend requirement edit flow: update an existing requirement row.
app.MapPut("/requirements/{id:guid}", async (Guid id, RequirementUpdateDto input, RequirementsDbContext db) =>
{
    if (!IsValidRequirementUpdate(input))
    {
        return Results.BadRequest(new { error = "Invalid requirement payload." });
    }

    var projectExists = await db.Projects
        .AsNoTracking()
        .AnyAsync(p => p.Id == input.ProjectId);
    if (!projectExists)
    {
        return Results.BadRequest(new { error = "ProjectId does not exist." });
    }

    var requirement = await db.Requirements.FirstOrDefaultAsync(r => r.Id == id);
    if (requirement is null)
    {
        return Results.NotFound();
    }

    requirement.Title = input.Title.Trim();
    requirement.Description = input.Description.Trim();
    requirement.Type = input.Type.Trim();
    requirement.Level = input.Level;
    requirement.Subsystem = input.Subsystem.Trim();
    requirement.ProjectId = input.ProjectId;
    requirement.Tags = NormalizeTags(input.Tags);

    await db.SaveChangesAsync();

    return Results.Ok(requirement);
});

// Frontend requirement delete action: remove requirement from the selected project.
app.MapDelete("/requirements/{id:guid}", async (Guid id, RequirementsDbContext db) =>
{
    var requirement = await db.Requirements.FirstOrDefaultAsync(r => r.Id == id);
    if (requirement is null)
    {
        return Results.NotFound();
    }

    db.Requirements.Remove(requirement);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

// =========================== Projects ==========================

// Frontend dashboard/project picker: fetch all projects.
app.MapGet("/projects", async (RequirementsDbContext db) =>
    await db.Projects.AsNoTracking().OrderBy(p => p.Name).ToListAsync()
);

// Frontend project details page: fetch one project by id.
app.MapGet("/projects/{id:guid}", async (Guid id, RequirementsDbContext db) =>
{
    var project = await db.Projects
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.Id == id);

    return project is null ? Results.NotFound() : Results.Ok(project);
});

// Frontend project creation modal/form (Dashboard): create a project and update member/org indexes.
app.MapPost("/projects", async (ProjectCreateDto input, RequirementsDbContext db) =>
{
    var normalized = NormalizeProjectCreate(input);
    if (!IsValidProject(normalized.Name, normalized.Owner, normalized.DocumentIds, normalized.MemberIds, normalized.PendingRequests, normalized.OrganizationId, normalized.PersonalProject))
    {
        return Results.BadRequest(new { error = "Invalid project payload." });
    }

    var project = new Project
    {
        Name = normalized.Name,
        Description = normalized.Description,
        Owner = normalized.Owner,
        IsPublic = normalized.IsPublic,
        PersonalProject = normalized.PersonalProject,
        OrganizationId = normalized.OrganizationId,
        ComponentsListId = normalized.ComponentsListId,
        TimelineId = normalized.TimelineId,
        IntegrationsId = normalized.IntegrationsId,
        DocumentIds = normalized.DocumentIds,
        MemberIds = normalized.MemberIds,
        PendingRequests = normalized.PendingRequests,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    db.Projects.Add(project);
    await UpdateMemberProjectIndexesAsync(db, project.Id, Array.Empty<string>(), project.MemberIds);
    await AddProjectToOrganizationIndexAsync(db, project.OrganizationId, project.Id);
    await db.SaveChangesAsync();

    return Results.Created($"/projects/{project.Id}", project);
});

// Frontend project edit/settings: update project data and keep member/org indexes in sync.
app.MapPut("/projects/{id:guid}", async (Guid id, ProjectUpdateDto input, RequirementsDbContext db) =>
{
    var normalized = NormalizeProjectUpdate(input);
    if (!IsValidProject(normalized.Name, normalized.Owner, normalized.DocumentIds, normalized.MemberIds, normalized.PendingRequests, normalized.OrganizationId, normalized.PersonalProject))
    {
        return Results.BadRequest(new { error = "Invalid project payload." });
    }

    var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id);
    if (project is null)
    {
        return Results.NotFound();
    }

    var previousMembers = project.MemberIds.ToArray();
    var previousOrganizationId = project.OrganizationId;

    project.Name = normalized.Name;
    project.Description = normalized.Description;
    project.Owner = normalized.Owner;
    project.IsPublic = normalized.IsPublic;
    project.PersonalProject = normalized.PersonalProject;
    project.OrganizationId = normalized.OrganizationId;
    project.ComponentsListId = normalized.ComponentsListId;
    project.TimelineId = normalized.TimelineId;
    project.IntegrationsId = normalized.IntegrationsId;
    project.DocumentIds = normalized.DocumentIds;
    project.MemberIds = normalized.MemberIds;
    project.PendingRequests = normalized.PendingRequests;
    project.UpdatedAt = DateTime.UtcNow;

    await UpdateMemberProjectIndexesAsync(db, project.Id, previousMembers, project.MemberIds);
    await UpdateOrganizationProjectIndexAsync(db, project.Id, previousOrganizationId, project.OrganizationId);
    await db.SaveChangesAsync();

    return Results.Ok(project);
});

// Frontend project deletion flow: remove project and clean related indexes.
app.MapDelete("/projects/{id:guid}", async (Guid id, RequirementsDbContext db) =>
{
    var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id);
    if (project is null)
    {
        return Results.NotFound();
    }

    var members = project.MemberIds.ToArray();
    var organizationId = project.OrganizationId;

    db.Projects.Remove(project);
    await RemoveProjectFromIndexesAsync(db, project.Id, members);
    await RemoveProjectFromOrganizationIndexAsync(db, organizationId, project.Id);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

/**
 * This builds the invite link to obtain the  
 */
// Frontend invite-generation action: creates sharable invite token/link for an organization.
app.MapPost("/organizations/{organizationId}/invites", async (string organizationId, RequirementsDbContext db, IConfiguration config) =>
{
    organizationId = organizationId?.Trim() ?? string.Empty;
    if (string.IsNullOrWhiteSpace(organizationId))
    {
        return Results.BadRequest(new { error = "organizationId is required." });
    }

    var token = GenerateInviteToken();
    var expiresAt = DateTime.UtcNow.AddDays(7);
    var invite = new OrganisationInvite
    {
        OrganizationId = organizationId,
        Token = token,
        ExpiresAt = expiresAt,
        CreatedAt = DateTime.UtcNow,
    };

    db.OrganisationInvites.Add(invite);
    await db.SaveChangesAsync();

    var link = BuildInviteLink(config, token);

    return Results.Ok(new CreateInviteResponse(token, expiresAt, link));
});

// Frontend invite-acceptance flow: validates token and adds member to all org projects.
app.MapPost("/organizations/join", async (OrganisationJoinRequest input, RequirementsDbContext db) =>
{
    var token = input.Token?.Trim();
    var memberId = input.MemberId?.Trim();

    if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(memberId))
    {
        return Results.BadRequest(new { error = "Token and memberId are required." });
    }

    var invite = await db.OrganisationInvites
        .FirstOrDefaultAsync(i => i.Token == token);

    if (invite is null || invite.ExpiresAt <= DateTime.UtcNow)
    {
        return Results.BadRequest(new { error = "Invite is invalid or expired." });
    }

    var organizationId = invite.OrganizationId;
    var projects = await db.Projects
        .Where(p => string.Equals(p.OrganizationId, organizationId, StringComparison.OrdinalIgnoreCase))
        .ToListAsync();

    var joinedProjectIds = new List<Guid>();
    foreach (var project in projects)
    {
        if (!project.MemberIds.Contains(memberId, StringComparer.OrdinalIgnoreCase))
        {
            project.MemberIds = project.MemberIds
                .Concat(new[] { memberId })
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        project.UpdatedAt = DateTime.UtcNow;
        await AddProjectToIndexAsync(db, memberId, project.Id);
        joinedProjectIds.Add(project.Id);
    }

    invite.RedeemedAt = invite.RedeemedAt ?? DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        organizationId,
        memberId,
        joinedProjectIds
    });
});


// ================================ Organisation ==================================================

// Frontend organization creation flow (British spelling route kept for compatibility).
app.MapPost("/organisations", async (OrganisationCreateDto input, RequirementsDbContext db) =>
{
    var normalized = NormalizeOrganisationCreate(input);
    if (!IsValidOrganisationCreate(normalized))
    {
        return Results.BadRequest(new { error = "Invalid organisation payload." });
    }

    var organisation = new Organisation
    {
        Name = normalized.Name,
        Color = normalized.Color,
        Initials = BuildOrganizationInitials(normalized.Name),
        InviteLink = BuildOrganizationInviteLink(normalized.Name),
        CreatedAt = DateTime.UtcNow,
    };

    db.Organisations.Add(organisation);
    await db.SaveChangesAsync();

    return Results.Created($"/organisations/{organisation.Id}", organisation);
});

// Frontend organization creation flow (US spelling route used by web client).
app.MapPost("/organizations", async (OrganisationCreateDto input, RequirementsDbContext db) =>
{
    var normalized = NormalizeOrganisationCreate(input);
    if (!IsValidOrganisationCreate(normalized))
    {
        return Results.BadRequest(new { error = "Invalid organization payload." });
    }

    var organisation = new Organisation
    {
        Name = normalized.Name,
        Color = normalized.Color,
        Initials = BuildOrganizationInitials(normalized.Name),
        InviteLink = BuildOrganizationInviteLink(normalized.Name),
        CreatedAt = DateTime.UtcNow,
    };

    db.Organisations.Add(organisation);
    await db.SaveChangesAsync();

    return Results.Created($"/organizations/{organisation.Id}", organisation);
});

// Frontend organization selector/listing (British spelling alias).
app.MapGet("/organisations", async (RequirementsDbContext db) =>
    await db.Organisations.AsNoTracking().OrderBy(o => o.Name).ToListAsync()
);

// Frontend organization selector/listing (US spelling route used by Dashboard).
app.MapGet("/organizations", async (RequirementsDbContext db) =>
    await db.Organisations.AsNoTracking().OrderBy(o => o.Name).ToListAsync()
);

// Frontend organization page: fetch all projects inside one organization.
app.MapGet("/organizations/{organizationId}/projects", async (string organizationId, RequirementsDbContext db) =>
{
    organizationId = organizationId?.Trim() ?? string.Empty;
    if (string.IsNullOrWhiteSpace(organizationId))
    {
        return Results.BadRequest(new { error = "organizationId is required." });
    }

    var projects = await db.Projects
        .AsNoTracking()
        .Where(p => p.OrganizationId == organizationId)
        .OrderBy(p => p.Name)
        .ToListAsync();

    return Results.Ok(projects);
});

// =============================== Get Projects by member  ==========================================
// Frontend member workspace bootstrap: fetch project index row for a member.
app.MapGet("/members/{memberId}/projects", async (string memberId, RequirementsDbContext db) =>
{
    memberId = memberId?.Trim() ?? string.Empty;
    if (string.IsNullOrWhiteSpace(memberId))
    {
        return Results.BadRequest(new { error = "memberId is required." });
    }

    var index = await db.MemberProjectIndexes
        .AsNoTracking()
        .FirstOrDefaultAsync(i => i.MemberId == memberId);

    if (index is null)
    {
        return Results.Ok(new MemberProjectIndex
        {
            MemberId = memberId,
            ProjectIds = Array.Empty<string>(),
            ProjectRoles = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase),
        });
    }

    return Results.Ok(index);
});

// Frontend role-management UI: get the roles a member has for a specific project.
app.MapGet("/members/{memberId}/projects/{projectId:guid}/roles", async (string memberId, Guid projectId, RequirementsDbContext db) =>
{
    memberId = memberId?.Trim() ?? string.Empty;
    if (string.IsNullOrWhiteSpace(memberId))
    {
        return Results.BadRequest(new { error = "memberId is required." });
    }

    var projectIdString = projectId.ToString();
    var index = await db.MemberProjectIndexes
        .AsNoTracking()
        .FirstOrDefaultAsync(i => i.MemberId == memberId);

    if (index is null || !index.ProjectRoles.TryGetValue(projectIdString, out var roles))
    {
        return Results.Ok(new { memberId, projectId, roles = Array.Empty<string>() });
    }

    return Results.Ok(new { memberId, projectId, roles });
});

// Frontend role-management UI: set/replace the roles for a member on a specific project.
app.MapPut("/members/{memberId}/projects/{projectId:guid}/roles", async (string memberId, Guid projectId, MemberProjectRolesUpdateDto input, RequirementsDbContext db) =>
{
    memberId = memberId?.Trim() ?? string.Empty;
    if (string.IsNullOrWhiteSpace(memberId))
    {
        return Results.BadRequest(new { error = "memberId is required." });
    }

    var projectIdString = projectId.ToString();
    var normalizedRoles = NormalizeRoles(input.Roles);

    var index = await db.MemberProjectIndexes.FirstOrDefaultAsync(i => i.MemberId == memberId);
    if (index is null)
    {
        db.MemberProjectIndexes.Add(new MemberProjectIndex
        {
            MemberId = memberId,
            ProjectIds = new[] { projectIdString },
            ProjectRoles = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                [projectIdString] = normalizedRoles
            }
        });

        await db.SaveChangesAsync();
        return Results.Ok(new { memberId, projectId, roles = normalizedRoles });
    }

    if (!index.ProjectIds.Contains(projectIdString, StringComparer.OrdinalIgnoreCase))
    {
        index.ProjectIds = index.ProjectIds
            .Concat(new[] { projectIdString })
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    var updatedRoles = new Dictionary<string, string[]>(index.ProjectRoles, StringComparer.OrdinalIgnoreCase)
    {
        [projectIdString] = normalizedRoles
    };
    index.ProjectRoles = updatedRoles;

    await db.SaveChangesAsync();
    return Results.Ok(new { memberId, projectId, roles = normalizedRoles });
});

// Frontend dashboard grouping view: fetch member projects grouped by organization.
app.MapGet("/members/{memberId}/organizations/projects", async (string memberId, RequirementsDbContext db) =>
{
    memberId = memberId?.Trim() ?? string.Empty;
    if (string.IsNullOrWhiteSpace(memberId))
    {
        return Results.BadRequest(new { error = "memberId is required." });
    }

    var projects = await db.Projects
        .AsNoTracking()
        .Where(p => p.MemberIds.Contains(memberId))
        .OrderBy(p => p.OrganizationId)
        .ThenBy(p => p.Name)
        .ToListAsync();

    var grouped = projects
        .GroupBy(p => p.OrganizationId, StringComparer.OrdinalIgnoreCase)
        .Select(g => new
        {
            OrganizationId = g.Key,
            Projects = g.ToList()
        });

    return Results.Ok(grouped);
});

// Internal admin UI entrypoint: serves HTML page to inspect DB tables/rows locally.
app.MapGet("/admin", () =>
    Results.Content(GetAdminPageHtml(), "text/html")
);

// Internal admin UI data feed: returns all non-system schema tables and rows.
app.MapGet("/admin/data", async (RequirementsDbContext db) =>
{
    var tables = await GetDatabaseSnapshotAsync(db);
    return Results.Ok(new
    {
        generatedAtUtc = DateTime.UtcNow,
        tables
    });
});

// Internal admin debug endpoint: exposes active DB connection identity shown in admin header.
app.MapGet("/admin/connection", async (RequirementsDbContext db) =>
{
    var info = await GetConnectionInfoAsync(db);
    return Results.Ok(info);
});

// Internal seed-management endpoint: exports current DB content as seed JSON for frontend/dev recovery.
app.MapGet("/admin/seed/export", async (RequirementsDbContext db) =>
{
    var seedData = await BuildSeedDataFileAsync(db);
    return Results.Ok(seedData);
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

await ApplyMigrationsWithRetryAsync(app);
await ApplySeedDataIfDatabaseEmptyAsync(app);

app.Run();

// ==================  Functions to verify if the API payload is correct for that API call ============================

static bool IsValidRequirementCreate(RequirementCreateDto input)
{
    return IsValidRequirementFields(
        input.Title,
        input.Description,
        input.Type,
        input.Subsystem,
        input.ProjectId,
        input.Tags
    );
}

static bool IsValidRequirementUpdate(RequirementUpdateDto input)
{
    return IsValidRequirementFields(
        input.Title,
        input.Description,
        input.Type,
        input.Subsystem,
        input.ProjectId,
        input.Tags
    );
}

static bool IsValidRequirementFields(
    string title,
    string description,
    string type,
    string subsystem,
    Guid projectId,
    string[] tags)
{
    return !string.IsNullOrWhiteSpace(title)
        && !string.IsNullOrWhiteSpace(description)
        && !string.IsNullOrWhiteSpace(type)
        && !string.IsNullOrWhiteSpace(subsystem)
        && projectId != Guid.Empty
        && tags is { Length: > 0 };
}

/**
 * Converts the tags into standard form
 */
static string[] NormalizeTags(string[] tags)
{
    return tags
        .Where(tag => !string.IsNullOrWhiteSpace(tag))
        .Select(tag => tag.Trim())
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();
}

/**
 * Normalize and return a Data Transfer Object
 */
static ProjectCreateDto NormalizeProjectCreate(ProjectCreateDto input)
{
    var personal = input.PersonalProject;
    var orgId = (input.OrganizationId ?? string.Empty).Trim();
    if (personal && string.IsNullOrWhiteSpace(orgId))
    {
        orgId = "personal";
    }

    return input with
    {
        Name = input.Name.Trim(),
        Description = (input.Description ?? string.Empty).Trim(),
        Owner = input.Owner.Trim(),
        PersonalProject = personal,
        OrganizationId = orgId,
        ComponentsListId = (input.ComponentsListId ?? string.Empty).Trim(),
        TimelineId = (input.TimelineId ?? string.Empty).Trim(),
        IntegrationsId = (input.IntegrationsId ?? string.Empty).Trim(),
        DocumentIds = NormalizeStringArray(input.DocumentIds),
        MemberIds = NormalizeStringArray(input.MemberIds),
        PendingRequests = NormalizeStringArray(input.PendingRequests),
    };
}

static ProjectUpdateDto NormalizeProjectUpdate(ProjectUpdateDto input)
{
    var personal = input.PersonalProject;
    var orgId = (input.OrganizationId ?? string.Empty).Trim();
    if (personal && string.IsNullOrWhiteSpace(orgId))
    {
        orgId = "personal";
    }

    return input with
    {
        Name = input.Name.Trim(),
        Description = (input.Description ?? string.Empty).Trim(),
        Owner = input.Owner.Trim(),
        PersonalProject = personal,
        OrganizationId = orgId,
        ComponentsListId = (input.ComponentsListId ?? string.Empty).Trim(),
        TimelineId = (input.TimelineId ?? string.Empty).Trim(),
        IntegrationsId = (input.IntegrationsId ?? string.Empty).Trim(),
        DocumentIds = NormalizeStringArray(input.DocumentIds),
        MemberIds = NormalizeStringArray(input.MemberIds),
        PendingRequests = NormalizeStringArray(input.PendingRequests),
    };
}

static string[] NormalizeStringArray(string[]? items)
{
    return (items ?? Array.Empty<string>())
        .Where(item => !string.IsNullOrWhiteSpace(item))
        .Select(item => item.Trim())
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();
}

static string[] NormalizeRoles(string[]? roles)
{
    return (roles ?? Array.Empty<string>())
        .Where(role => !string.IsNullOrWhiteSpace(role))
        .Select(role => role.Trim())
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();
}

static OrganisationCreateDto NormalizeOrganisationCreate(OrganisationCreateDto input)
{
    return input with
    {
        Name = (input.Name ?? string.Empty).Trim(),
        Color = (input.Color ?? string.Empty).Trim(),
    };
}

static bool IsValidOrganisationCreate(OrganisationCreateDto input)
{
    return !string.IsNullOrWhiteSpace(input.Name)
        && input.Name.Length <= 200
        && input.Color.Length <= 50;
}

static bool IsValidProject(string name, string owner, string[] documentIds, string[] memberIds, string[] pendingRequests, string organizationId, bool personalProject)
{
    return !string.IsNullOrWhiteSpace(name)
        && !string.IsNullOrWhiteSpace(owner)
        && (!string.IsNullOrWhiteSpace(organizationId) || personalProject)
        && documentIds is not null
        && memberIds is not null
        && pendingRequests is not null;
}

static string GenerateInviteToken()
{
    return Convert.ToHexString(Guid.NewGuid().ToByteArray()).ToLowerInvariant();
}

/**
 * Function to build invite link
 */
static string? BuildInviteLink(IConfiguration config, string token)
{
    var baseUrl = config["FRONTEND__BASE_URL"] ?? config["ALLOWED_ORIGINS"]?.Split(',').FirstOrDefault();
    if (string.IsNullOrWhiteSpace(baseUrl))
    {
        return null;
    }

    baseUrl = baseUrl.TrimEnd('/');
    return $"{baseUrl}/organizations/invite/{token}";
}

static string BuildOrganizationInitials(string name)
{
    var initials = string.Concat(
        name.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part[0])
    ).ToUpperInvariant();

    return initials.Length <= 2 ? initials : initials[..2];
}

static string BuildOrganizationInviteLink(string name)
{
    var slug = string.Join('-', name
        .ToLowerInvariant()
        .Split(' ', StringSplitOptions.RemoveEmptyEntries));

    var token = Convert.ToHexString(Guid.NewGuid().ToByteArray())
        .ToLowerInvariant()[..8];

    return $"{slug}-{token}";
}

static async Task UpdateMemberProjectIndexesAsync(RequirementsDbContext db, Guid projectId, string[] previousMembers, string[] newMembers)
{
    var comparer = StringComparer.OrdinalIgnoreCase;
    var removed = previousMembers.Except(newMembers, comparer).ToArray();
    var added = newMembers.Except(previousMembers, comparer).ToArray();

    foreach (var memberId in added)
    {
        await AddProjectToIndexAsync(db, memberId, projectId);
    }

    foreach (var memberId in removed)
    {
        await RemoveProjectFromIndexAsync(db, memberId, projectId);
    }
}

static async Task AddProjectToIndexAsync(RequirementsDbContext db, string memberId, Guid projectId)
{
    if (string.IsNullOrWhiteSpace(memberId))
    {
        return;
    }

    var projectIdString = projectId.ToString();
    var index = await db.MemberProjectIndexes.FirstOrDefaultAsync(i => i.MemberId == memberId);

    if (index is null)
    {
        db.MemberProjectIndexes.Add(new MemberProjectIndex
        {
            MemberId = memberId,
            ProjectIds = new[] { projectIdString },
            ProjectRoles = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                [projectIdString] = Array.Empty<string>()
            }
        });
        return;
    }

    if (!index.ProjectIds.Contains(projectIdString, StringComparer.OrdinalIgnoreCase))
    {
        index.ProjectIds = index.ProjectIds
            .Concat(new[] { projectIdString })
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    if (!index.ProjectRoles.ContainsKey(projectIdString))
    {
        var updatedRoles = new Dictionary<string, string[]>(index.ProjectRoles, StringComparer.OrdinalIgnoreCase)
        {
            [projectIdString] = Array.Empty<string>()
        };
        index.ProjectRoles = updatedRoles;
    }
}

static async Task RemoveProjectFromIndexesAsync(RequirementsDbContext db, Guid projectId, string[] memberIds)
{
    foreach (var memberId in memberIds)
    {
        await RemoveProjectFromIndexAsync(db, memberId, projectId);
    }
}

static async Task RemoveProjectFromIndexAsync(RequirementsDbContext db, string memberId, Guid projectId)
{
    if (string.IsNullOrWhiteSpace(memberId))
    {
        return;
    }

    var projectIdString = projectId.ToString();
    var index = await db.MemberProjectIndexes.FirstOrDefaultAsync(i => i.MemberId == memberId);
    if (index is null)
    {
        return;
    }

    index.ProjectIds = index.ProjectIds
        .Where(id => !string.Equals(id, projectIdString, StringComparison.OrdinalIgnoreCase))
        .ToArray();

    if (index.ProjectRoles.ContainsKey(projectIdString))
    {
        var updatedRoles = new Dictionary<string, string[]>(index.ProjectRoles, StringComparer.OrdinalIgnoreCase);
        updatedRoles.Remove(projectIdString);
        index.ProjectRoles = updatedRoles;
    }

    if (index.ProjectIds.Length == 0)
    {
        db.MemberProjectIndexes.Remove(index);
    }
}

static async Task AddProjectToOrganizationIndexAsync(RequirementsDbContext db, string organizationId, Guid projectId)
{
    if (string.IsNullOrWhiteSpace(organizationId))
    {
        return;
    }

    var projectIdString = projectId.ToString();
    var index = await db.OrganizationProjectIndexes.FirstOrDefaultAsync(i => i.OrganizationId == organizationId);

    if (index is null)
    {
        db.OrganizationProjectIndexes.Add(new OrganizationProjectIndex
        {
            OrganizationId = organizationId,
            ProjectIds = new[] { projectIdString },
        });
        return;
    }

    if (!index.ProjectIds.Contains(projectIdString, StringComparer.OrdinalIgnoreCase))
    {
        index.ProjectIds = index.ProjectIds
            .Concat(new[] { projectIdString })
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }
}

static async Task RemoveProjectFromOrganizationIndexAsync(RequirementsDbContext db, string organizationId, Guid projectId)
{
    if (string.IsNullOrWhiteSpace(organizationId))
    {
        return;
    }

    var projectIdString = projectId.ToString();
    var index = await db.OrganizationProjectIndexes.FirstOrDefaultAsync(i => i.OrganizationId == organizationId);
    if (index is null)
    {
        return;
    }

    index.ProjectIds = index.ProjectIds
        .Where(id => !string.Equals(id, projectIdString, StringComparison.OrdinalIgnoreCase))
        .ToArray();

    if (index.ProjectIds.Length == 0)
    {
        db.OrganizationProjectIndexes.Remove(index);
    }
}

static async Task UpdateOrganizationProjectIndexAsync(RequirementsDbContext db, Guid projectId, string previousOrganizationId, string newOrganizationId)
{
    if (!string.Equals(previousOrganizationId, newOrganizationId, StringComparison.OrdinalIgnoreCase))
    {
        await RemoveProjectFromOrganizationIndexAsync(db, previousOrganizationId, projectId);
        await AddProjectToOrganizationIndexAsync(db, newOrganizationId, projectId);
    }
}

static async Task<List<AdminTableSnapshot>> GetDatabaseSnapshotAsync(RequirementsDbContext db)
{
    await using var connection = db.Database.GetDbConnection();
    if (connection.State != ConnectionState.Open)
    {
        await connection.OpenAsync();
    }

    var tableNames = new List<(string Schema, string Table)>();
    await using (var command = connection.CreateCommand())
    {
        command.CommandText = """
            SELECT schemaname, tablename
            FROM pg_catalog.pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schemaname, tablename;
            """;

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tableNames.Add((reader.GetString(0), reader.GetString(1)));
        }
    }

    var snapshot = new List<AdminTableSnapshot>();
    foreach (var (schemaName, tableName) in tableNames)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = $"SELECT * FROM {QuoteIdentifier(schemaName)}.{QuoteIdentifier(tableName)};";

        await using var reader = await command.ExecuteReaderAsync();
        var columns = Enumerable.Range(0, reader.FieldCount).Select(reader.GetName).ToArray();
        var rows = new List<Dictionary<string, object?>>();

        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            for (var i = 0; i < reader.FieldCount; i++)
            {
                row[columns[i]] = DbValueToSerializable(reader.GetValue(i));
            }

            rows.Add(row);
        }

        snapshot.Add(new AdminTableSnapshot(schemaName, tableName, columns, rows));
    }

    return snapshot;
}

static async Task<AdminConnectionInfo> GetConnectionInfoAsync(RequirementsDbContext db)
{
    await using var connection = db.Database.GetDbConnection();
    if (connection.State != ConnectionState.Open)
    {
        await connection.OpenAsync();
    }

    await using var command = connection.CreateCommand();
    command.CommandText = """
        SELECT
            current_database(),
            current_user,
            COALESCE(inet_server_addr()::text, 'local'),
            inet_server_port();
        """;

    await using var reader = await command.ExecuteReaderAsync();
    await reader.ReadAsync();

    return new AdminConnectionInfo(
        connection.Database,
        reader.GetString(1),
        reader.GetString(2),
        reader.IsDBNull(3) ? null : reader.GetInt32(3)
    );
}

static async Task<SeedDataFile> BuildSeedDataFileAsync(RequirementsDbContext db)
{
    var organisations = await db.Organisations.AsNoTracking().ToListAsync();
    var projects = await db.Projects.AsNoTracking().ToListAsync();
    var requirements = await db.Requirements.AsNoTracking().ToListAsync();
    var invites = await db.OrganisationInvites.AsNoTracking().ToListAsync();
    var memberIndexes = await db.MemberProjectIndexes.AsNoTracking().ToListAsync();
    var organizationIndexes = await db.OrganizationProjectIndexes.AsNoTracking().ToListAsync();

    return new SeedDataFile(
        organisations,
        projects,
        requirements,
        invites,
        memberIndexes,
        organizationIndexes
    );
}

static object? DbValueToSerializable(object value)
{
    if (value is DBNull)
    {
        return null;
    }

    if (value is Array array && value is not byte[])
    {
        var items = new List<object?>(array.Length);
        foreach (var item in array)
        {
            items.Add(item is null ? null : DbValueToSerializable(item));
        }

        return items;
    }

    return value;
}

static string QuoteIdentifier(string identifier)
{
    return $"\"{identifier.Replace("\"", "\"\"")}\"";
}

static bool IsLocalDevOrigin(string? origin)
{
    if (string.IsNullOrWhiteSpace(origin))
    {
        return false;
    }

    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
    {
        return false;
    }

    if (!string.Equals(uri.Scheme, "http", StringComparison.OrdinalIgnoreCase)
        && !string.Equals(uri.Scheme, "https", StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    var host = uri.Host;
    if (string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase)
        || host.Equals("127.0.0.1"))
    {
        return true;
    }

    if (System.Net.IPAddress.TryParse(host, out var ip))
    {
        var bytes = ip.GetAddressBytes();
        if (bytes.Length == 4)
        {
            // 10.0.0.0/8
            if (bytes[0] == 10) return true;
            // 172.16.0.0/12
            if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) return true;
            // 192.168.0.0/16
            if (bytes[0] == 192 && bytes[1] == 168) return true;
            // 100.64.0.0/10 (CGNAT/Tailscale common range)
            if (bytes[0] == 100 && bytes[1] >= 64 && bytes[1] <= 127) return true;
        }
    }

    return false;
}

static string GetAdminPageHtml()
{
    return """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ProjectManagement Admin</title>
  <style>
    :root {
      --bg: #f7f8fc;
      --card: #ffffff;
      --text: #151a2d;
      --muted: #5e647a;
      --border: #dde2ef;
      --accent: #1f6feb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: "Segoe UI", Arial, sans-serif;
      background: radial-gradient(circle at top left, #ffffff, var(--bg));
      color: var(--text);
    }
    h1 { margin: 0 0 8px 0; }
    p { margin: 0 0 16px 0; color: var(--muted); }
    .meta { margin-bottom: 20px; color: var(--muted); }
    .table-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 18px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(13, 23, 36, 0.06);
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      font-weight: 600;
    }
    .badge {
      color: white;
      background: var(--accent);
      border-radius: 999px;
      padding: 3px 10px;
      font-size: 12px;
    }
    .table-scroll { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
      white-space: pre-wrap;
      word-break: break-word;
      min-width: 120px;
    }
    th { background: #f0f4ff; position: sticky; top: 0; }
    .empty { padding: 12px 14px; color: var(--muted); }
    .error {
      border: 1px solid #ffd3d3;
      background: #fff2f2;
      color: #781d1d;
      border-radius: 8px;
      padding: 10px 12px;
    }
  </style>
</head>
<body>
  <h1>Database Admin</h1>
  <p>All tables in the public schema and their current rows.</p>
  <div id="meta" class="meta">Loading...</div>
  <button id="refreshBtn" type="button">Refresh now</button>
  <div id="content"></div>

  <script>
    const meta = document.getElementById("meta");
    const content = document.getElementById("content");
    const refreshBtn = document.getElementById("refreshBtn");

    function formatValue(value) {
      if (value === null || value === undefined) return "null";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    }

    function buildTableCard(table) {
      const card = document.createElement("section");
      card.className = "table-card";

      const header = document.createElement("div");
      header.className = "table-header";
      header.innerHTML = `<span>${table.schema}.${table.name}</span><span class="badge">${table.rows.length} rows</span>`;
      card.appendChild(header);

      if (!table.rows.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No rows";
        card.appendChild(empty);
        return card;
      }

      const scroll = document.createElement("div");
      scroll.className = "table-scroll";
      const grid = document.createElement("table");
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");

      table.columns.forEach((column) => {
        const th = document.createElement("th");
        th.textContent = column;
        headRow.appendChild(th);
      });

      thead.appendChild(headRow);
      grid.appendChild(thead);

      const tbody = document.createElement("tbody");
      table.rows.forEach((row) => {
        const tr = document.createElement("tr");
        table.columns.forEach((column) => {
          const td = document.createElement("td");
          td.textContent = formatValue(row[column]);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

      grid.appendChild(tbody);
      scroll.appendChild(grid);
      card.appendChild(scroll);
      return card;
    }

    async function loadData() {
      try {
        const response = await fetch("/admin/data", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const [dataResponse, connectionResponse] = await Promise.all([
          fetch("/admin/data", { cache: "no-store" }),
          fetch("/admin/connection", { cache: "no-store" })
        ]);

        if (!dataResponse.ok) {
          throw new Error(`Data request failed: ${dataResponse.status}`);
        }
        if (!connectionResponse.ok) {
          throw new Error(`Connection request failed: ${connectionResponse.status}`);
        }

        const payload = await dataResponse.json();
        const connection = await connectionResponse.json();
        const tables = payload.tables || [];
        meta.textContent = `DB: ${connection.database} | User: ${connection.user} | Host: ${connection.host}:${connection.port ?? "?"} | Generated: ${new Date(payload.generatedAtUtc).toLocaleString()} | ${tables.length} tables`;
        content.innerHTML = "";
        tables.forEach((table) => content.appendChild(buildTableCard(table)));
      } catch (error) {
        meta.textContent = "Failed to load database data.";
        content.innerHTML = `<div class="error">${error.message}</div>`;
      }
    }

    refreshBtn.addEventListener("click", loadData);
    loadData();
    setInterval(loadData, 5000);
  </script>
</body>
</html>
""";
}

static async Task ApplyMigrationsWithRetryAsync(WebApplication app)
{
    const int maxAttempts = 10;
    var delay = TimeSpan.FromSeconds(2);

    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Migrations");
    var db = scope.ServiceProvider.GetRequiredService<RequirementsDbContext>();

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            await db.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied.");
            return;
        }
        catch (Exception ex) when (attempt < maxAttempts)
        {
            logger.LogWarning(ex, "Migration attempt {Attempt} failed. Retrying in {Delay}...", attempt, delay);
            await Task.Delay(delay);
            delay = delay + delay;
        }
    }

    await db.Database.MigrateAsync();
}

static async Task ApplySeedDataIfDatabaseEmptyAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("SeedData");
    var db = scope.ServiceProvider.GetRequiredService<RequirementsDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    var hasData = await db.Organisations.AsNoTracking().AnyAsync()
        || await db.Projects.AsNoTracking().AnyAsync()
        || await db.Requirements.AsNoTracking().AnyAsync();
    if (hasData)
    {
        logger.LogInformation("Skipping seed load because database already contains data.");
        return;
    }

    var seedFilePath = ResolveSeedFilePath(config, app.Environment);

    if (!File.Exists(seedFilePath))
    {
        logger.LogInformation("No seed file found at {SeedFilePath}.", seedFilePath);
        return;
    }

    SeedDataFile? seed;
    try
    {
        var json = await File.ReadAllTextAsync(seedFilePath);
        seed = JsonSerializer.Deserialize<SeedDataFile>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to read seed file at {SeedFilePath}.", seedFilePath);
        return;
    }

    if (seed is null)
    {
        logger.LogWarning("Seed file at {SeedFilePath} is empty or invalid JSON.", seedFilePath);
        return;
    }

    var organisations = seed.Organisations ?? new List<Organisation>();
    var projects = seed.Projects ?? new List<Project>();
    var requirements = seed.Requirements ?? new List<Requirement>();
    var invites = seed.OrganisationInvites ?? new List<OrganisationInvite>();
    var memberIndexes = seed.MemberProjectIndexes ?? new List<MemberProjectIndex>();
    var organizationIndexes = seed.OrganizationProjectIndexes ?? new List<OrganizationProjectIndex>();

    if (organisations.Count == 0
        && projects.Count == 0
        && requirements.Count == 0
        && invites.Count == 0
        && memberIndexes.Count == 0
        && organizationIndexes.Count == 0)
    {
        logger.LogInformation("Seed file found at {SeedFilePath}, but it contains no rows.", seedFilePath);
        return;
    }

    db.Organisations.AddRange(organisations);
    db.Projects.AddRange(projects);
    db.Requirements.AddRange(requirements);
    db.OrganisationInvites.AddRange(invites);
    db.MemberProjectIndexes.AddRange(memberIndexes);
    db.OrganizationProjectIndexes.AddRange(organizationIndexes);

    await db.SaveChangesAsync();
    logger.LogInformation(
        "Seed data loaded from {SeedFilePath}: organisations={Organisations}, projects={Projects}, requirements={Requirements}, invites={Invites}, memberIndexes={MemberIndexes}, organizationIndexes={OrganizationIndexes}.",
        seedFilePath,
        organisations.Count,
        projects.Count,
        requirements.Count,
        invites.Count,
        memberIndexes.Count,
        organizationIndexes.Count
    );
}

static void PersistSeedDataSnapshotOnShutdown(WebApplication app)
{
    try
    {
        PersistSeedDataSnapshotAsync(app).GetAwaiter().GetResult();
    }
    catch (Exception ex)
    {
        using var scope = app.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("SeedData");
        logger.LogError(ex, "Failed to persist seed snapshot during shutdown.");
    }
}

static async Task PersistSeedDataSnapshotAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("SeedData");
    var db = scope.ServiceProvider.GetRequiredService<RequirementsDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    var seedData = await BuildSeedDataFileAsync(db);
    var seedFilePath = ResolveSeedFilePath(config, app.Environment);
    var seedDirectory = Path.GetDirectoryName(seedFilePath);
    if (!string.IsNullOrWhiteSpace(seedDirectory))
    {
        Directory.CreateDirectory(seedDirectory);
    }

    var json = JsonSerializer.Serialize(seedData, new JsonSerializerOptions
    {
        WriteIndented = true
    });

    await File.WriteAllTextAsync(seedFilePath, json);
    logger.LogInformation("Seed snapshot saved to {SeedFilePath}.", seedFilePath);
}

static string ResolveSeedFilePath(IConfiguration config, IWebHostEnvironment environment)
{
    var seedFilePath = config["SEED__FILE_PATH"] ?? Path.Combine(environment.ContentRootPath, "Data", "seed-data.json");
    if (!Path.IsPathRooted(seedFilePath))
    {
        seedFilePath = Path.Combine(environment.ContentRootPath, seedFilePath);
    }

    return seedFilePath;
}

sealed record AdminTableSnapshot(string Schema, string Name, string[] Columns, List<Dictionary<string, object?>> Rows);
sealed record AdminConnectionInfo(string Database, string User, string Host, int? Port);
sealed record MemberProjectRolesUpdateDto(string[] Roles);
sealed record SeedDataFile(
    List<Organisation>? Organisations,
    List<Project>? Projects,
    List<Requirement>? Requirements,
    List<OrganisationInvite>? OrganisationInvites,
    List<MemberProjectIndex>? MemberProjectIndexes,
    List<OrganizationProjectIndex>? OrganizationProjectIndexes
);
