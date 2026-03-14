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

            entity.Property(r => r.AssignedComponents)
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
    }
}
