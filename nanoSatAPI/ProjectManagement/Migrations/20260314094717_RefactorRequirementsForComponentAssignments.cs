using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class RefactorRequirementsForComponentAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Level",
                table: "Requirements");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Requirements");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "Requirements",
                newName: "ReqId");

            migrationBuilder.AddColumn<string[]>(
                name: "AssignedComponents",
                table: "Requirements",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignedComponents",
                table: "Requirements");

            migrationBuilder.RenameColumn(
                name: "ReqId",
                table: "Requirements",
                newName: "Title");

            migrationBuilder.AddColumn<int>(
                name: "Level",
                table: "Requirements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Requirements",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
