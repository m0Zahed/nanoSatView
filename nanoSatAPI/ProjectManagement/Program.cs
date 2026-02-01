using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using ProjectManagement.Data;
using ProjectManagement.Models;

var builder = WebApplication.CreateBuilder(args);

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
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/version", (IConfiguration config) =>
{
    var version = config["APP_VERSION"] ?? "unknown";
    return Results.Ok(new { version });
});

app.MapGet("/requirements", async (RequirementsDbContext db) =>
    await db.Requirements.AsNoTracking().OrderBy(r => r.Title).ToListAsync()
);

app.MapGet("/requirements/{id:guid}", async (Guid id, RequirementsDbContext db) =>
{
    var requirement = await db.Requirements.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
    return requirement is null ? Results.NotFound() : Results.Ok(requirement);
});

app.MapPost("/requirements", async (RequirementCreateDto input, RequirementsDbContext db) =>
{
    if (!IsValidRequirementCreate(input))
    {
        return Results.BadRequest(new { error = "Invalid requirement payload." });
    }

    var requirement = new Requirement
    {
        Title = input.Title.Trim(),
        Description = input.Description.Trim(),
        Type = input.Type.Trim(),
        Level = input.Level,
        Subsystem = input.Subsystem.Trim(),
        Tags = NormalizeTags(input.Tags),
    };

    db.Requirements.Add(requirement);
    await db.SaveChangesAsync();

    return Results.Created($"/requirements/{requirement.Id}", requirement);
});

app.MapPut("/requirements/{id:guid}", async (Guid id, RequirementUpdateDto input, RequirementsDbContext db) =>
{
    if (!IsValidRequirementUpdate(input))
    {
        return Results.BadRequest(new { error = "Invalid requirement payload." });
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
    requirement.Tags = NormalizeTags(input.Tags);

    await db.SaveChangesAsync();

    return Results.Ok(requirement);
});

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

// --- Projects ---

app.MapGet("/projects", async (RequirementsDbContext db) =>
    await db.Projects.AsNoTracking().OrderBy(p => p.Name).ToListAsync()
);

app.MapGet("/projects/{id:guid}", async (Guid id, RequirementsDbContext db) =>
{
    var project = await db.Projects
        .Include(p => p.Invites.Where(i => i.ExpiresAt > DateTime.UtcNow && i.RedeemedAt == null))
        .AsNoTracking()
        .FirstOrDefaultAsync(p => p.Id == id);

    return project is null ? Results.NotFound() : Results.Ok(project);
});

app.MapPost("/projects", async (ProjectCreateDto input, RequirementsDbContext db, IConfiguration config) =>
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
        RequirementsListId = normalized.RequirementsListId,
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
    project.RequirementsListId = normalized.RequirementsListId;
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

app.MapPost("/projects/{id:guid}/invites", async (Guid id, RequirementsDbContext db, IConfiguration config) =>
{
    var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id);
    if (project is null)
    {
        return Results.NotFound();
    }

    var token = GenerateInviteToken();
    var expiresAt = DateTime.UtcNow.AddDays(7);
    var invite = new ProjectInvite
    {
        ProjectId = id,
        Token = token,
        ExpiresAt = expiresAt,
        CreatedAt = DateTime.UtcNow,
    };

    db.ProjectInvites.Add(invite);
    await db.SaveChangesAsync();

    var link = BuildInviteLink(config, token);

    return Results.Ok(new CreateInviteResponse(token, expiresAt, link));
});

app.MapPost("/projects/join", async (ProjectJoinRequest input, RequirementsDbContext db) =>
{
    var token = input.Token?.Trim();
    var memberId = input.MemberId?.Trim();

    if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(memberId))
    {
        return Results.BadRequest(new { error = "Token and memberId are required." });
    }

    var invite = await db.ProjectInvites
        .Include(i => i.Project)
        .FirstOrDefaultAsync(i => i.Token == token);

    if (invite is null || invite.ExpiresAt <= DateTime.UtcNow)
    {
        return Results.BadRequest(new { error = "Invite is invalid or expired." });
    }

    var project = invite.Project;
    if (project is null)
    {
        return Results.NotFound();
    }

    if (!project.MemberIds.Contains(memberId, StringComparer.OrdinalIgnoreCase))
    {
        project.MemberIds = project.MemberIds
            .Concat(new[] { memberId })
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    invite.RedeemedAt = invite.RedeemedAt ?? DateTime.UtcNow;
    project.UpdatedAt = DateTime.UtcNow;

    await AddProjectToIndexAsync(db, memberId, project.Id);
    await db.SaveChangesAsync();

    return Results.Ok(project);
});

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
        });
    }

    return Results.Ok(index);
});

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

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

await ApplyMigrationsWithRetryAsync(app);

app.Run();

static bool IsValidRequirementCreate(RequirementCreateDto input)
{
    return IsValidRequirementFields(
        input.Title,
        input.Description,
        input.Type,
        input.Subsystem,
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
        input.Tags
    );
}

static bool IsValidRequirementFields(
    string title,
    string description,
    string type,
    string subsystem,
    string[] tags)
{
    return !string.IsNullOrWhiteSpace(title)
        && !string.IsNullOrWhiteSpace(description)
        && !string.IsNullOrWhiteSpace(type)
        && !string.IsNullOrWhiteSpace(subsystem)
        && tags is { Length: > 0 };
}

static string[] NormalizeTags(string[] tags)
{
    return tags
        .Where(tag => !string.IsNullOrWhiteSpace(tag))
        .Select(tag => tag.Trim())
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();
}

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
        RequirementsListId = (input.RequirementsListId ?? string.Empty).Trim(),
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
        RequirementsListId = (input.RequirementsListId ?? string.Empty).Trim(),
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

static string? BuildInviteLink(IConfiguration config, string token)
{
    var baseUrl = config["FRONTEND__BASE_URL"] ?? config["ALLOWED_ORIGINS"]?.Split(',').FirstOrDefault();
    if (string.IsNullOrWhiteSpace(baseUrl))
    {
        return null;
    }

    baseUrl = baseUrl.TrimEnd('/');
    return $"{baseUrl}/projects/invite/{token}";
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
