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
    public DbSet<ProjectInvite> ProjectInvites => Set<ProjectInvite>();
    public DbSet<MemberProjectIndex> MemberProjectIndexes => Set<MemberProjectIndex>();
    public DbSet<OrganizationProjectIndex> OrganizationProjectIndexes => Set<OrganizationProjectIndex>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Requirement>(entity =>
        {
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

        modelBuilder.Entity<ProjectInvite>(entity =>
        {
            entity.HasIndex(i => i.Token).IsUnique();

            entity.HasOne(i => i.Project)
                .WithMany(p => p.Invites)
                .HasForeignKey(i => i.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MemberProjectIndex>(entity =>
        {
            entity.HasKey(i => i.MemberId);

            entity.Property(i => i.ProjectIds)
                .HasColumnType("text[]");
        });

        modelBuilder.Entity<OrganizationProjectIndex>(entity =>
        {
            entity.HasKey(i => i.OrganizationId);

            entity.Property(i => i.ProjectIds)
                .HasColumnType("text[]");
        });
    }
}
