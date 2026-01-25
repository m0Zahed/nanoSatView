using Microsoft.EntityFrameworkCore;
using RequirementManagement.Models;

namespace RequirementManagement.Data;

public class RequirementsDbContext : DbContext
{
    public RequirementsDbContext(DbContextOptions<RequirementsDbContext> options)
        : base(options)
    {
    }

    public DbSet<Requirement> Requirements => Set<Requirement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Requirement>(entity =>
        {
            entity.Property(r => r.Tags)
                .HasColumnType("text[]");
        });
    }
}
