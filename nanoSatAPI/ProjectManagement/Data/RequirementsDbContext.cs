using Microsoft.EntityFrameworkCore;
using ProjectManagement.Models;

namespace ProjectManagement.Data;

public class RequirementsDbContext : DbContext
{
    public RequirementsDbContext(DbContextOptions<RequirementsDbContext> options)
        : base(options)
    {
    }

    public DbSet<Requirement> Requirements => Set<Requirement>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectComponent> ProjectComponents => Set<ProjectComponent>();
    public DbSet<ComponentAuditEvent> ComponentAuditEvents => Set<ComponentAuditEvent>();
    public DbSet<Organisation> Organisations => Set<Organisation>();
    public DbSet<OrganisationInvite> OrganisationInvites => Set<OrganisationInvite>();
    public DbSet<MemberProjectIndex> MemberProjectIndexes => Set<MemberProjectIndex>();
    public DbSet<OrganizationProjectIndex> OrganizationProjectIndexes => Set<OrganizationProjectIndex>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Requirement>(entity =>
        {
            entity.Property(r => r.ReqId)
                .HasMaxLength(200);

            entity.Property(r => r.Tags)
                .HasColumnType("text[]");
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.Property(p => p.DocumentIds)
                .HasColumnType("text[]");

            entity.Property(p => p.MemberIds)
                .HasColumnType("text[]");

            entity.Property(p => p.PendingRequests)
                .HasColumnType("text[]");

            entity.Property(p => p.OrganizationId)
                .HasMaxLength(200);

            entity.Property(p => p.CreatedAt)
                .HasDefaultValueSql("NOW()");

            entity.Property(p => p.UpdatedAt)
                .HasDefaultValueSql("NOW()");
        });

        modelBuilder.Entity<ProjectComponent>(entity =>
        {
            entity.Property(c => c.RequirementIds)
                .HasColumnType("uuid[]");

            entity.Property(c => c.BuilderStackJson)
                .HasColumnType("jsonb");

            entity.Property(c => c.MarkdownDraft)
                .HasColumnType("text");

            entity.Property(c => c.CreatedAt)
                .HasDefaultValueSql("NOW()");

            entity.Property(c => c.UpdatedAt)
                .HasDefaultValueSql("NOW()");

            entity.Property(c => c.LastEditedAt)
                .HasDefaultValueSql("NOW()");

            entity.HasIndex(c => new { c.ProjectId, c.UpdatedAt });
        });

        modelBuilder.Entity<ComponentAuditEvent>(entity =>
        {
            entity.Property(e => e.ComponentName)
                .HasMaxLength(200);

            entity.Property(e => e.Action)
                .HasMaxLength(50);

            entity.Property(e => e.EditorId)
                .HasMaxLength(200);

            entity.Property(e => e.EditorName)
                .HasMaxLength(200);

            entity.HasIndex(e => new { e.ProjectId, e.EventTime });
        });

        modelBuilder.Entity<OrganisationInvite>(entity =>
        {
            entity.HasIndex(i => i.Token).IsUnique();
            entity.Property(i => i.OrganizationId)
                .HasMaxLength(200);
        });

        modelBuilder.Entity<Organisation>(entity =>
        {
            entity.HasIndex(o => o.InviteLink).IsUnique();

            entity.Property(o => o.CreatedAt)
                .HasDefaultValueSql("NOW()");
        });

        modelBuilder.Entity<MemberProjectIndex>(entity =>
        {
            entity.HasKey(i => i.MemberId);

            entity.Property(i => i.ProjectIds)
                .HasColumnType("text[]");

            entity.Property(i => i.ProjectRoles)
                .HasColumnType("jsonb");
        });

        modelBuilder.Entity<OrganizationProjectIndex>(entity =>
        {
            entity.HasKey(i => i.OrganizationId);

            entity.Property(i => i.ProjectIds)
                .HasColumnType("text[]");
        });

        modelBuilder.Entity<Requirement>()
            .HasOne(r => r.Project)
            .WithMany(p => p.Requirements)
            .HasForeignKey(r => r.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProjectComponent>()
            .HasOne(c => c.Project)
            .WithMany(p => p.Components)
            .HasForeignKey(c => c.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ComponentAuditEvent>()
            .HasOne(e => e.Project)
            .WithMany(p => p.ComponentAuditEvents)
            .HasForeignKey(e => e.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
