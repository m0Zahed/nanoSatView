using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingRequestsAndMemberIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string[]>(
                name: "PendingRequests",
                table: "Projects",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            migrationBuilder.CreateTable(
                name: "MemberProjectIndexes",
                columns: table => new
                {
                    MemberId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ProjectIds = table.Column<string[]>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberProjectIndexes", x => x.MemberId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MemberProjectIndexes");

            migrationBuilder.DropColumn(
                name: "PendingRequests",
                table: "Projects");
        }
    }
}
