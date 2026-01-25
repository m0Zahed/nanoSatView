using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using RequirementManagement.Models;

namespace RequirementManagement.Data;

public class RequirementsDbContextFactory : IDesignTimeDbContextFactory<RequirementsDbContext>
{
    public RequirementsDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<RequirementsDbContext>();
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? "Host=localhost;Port=5432;Database=requirements;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString);

        return new RequirementsDbContext(optionsBuilder.Options);
    }
}
