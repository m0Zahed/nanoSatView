using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using RequirementManagement.Data;
using RequirementManagement.Models;

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
                .AllowAnyMethod();
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
