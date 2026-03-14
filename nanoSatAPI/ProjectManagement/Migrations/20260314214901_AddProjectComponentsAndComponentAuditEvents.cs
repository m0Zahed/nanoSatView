using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectComponentsAndComponentAuditEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignedComponents",
                table: "Requirements");

            migrationBuilder.CreateTable(
                name: "ComponentAuditEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    ComponentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ComponentName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EditorId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EditorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EventTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComponentAuditEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComponentAuditEvents_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectComponents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequirementIds = table.Column<Guid[]>(type: "uuid[]", nullable: false),
                    BuilderStackJson = table.Column<string>(type: "jsonb", nullable: false),
                    MarkdownDraft = table.Column<string>(type: "text", nullable: false),
                    LastEditedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    LastEditedByName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    LastEditedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectComponents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectComponents_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComponentAuditEvents_ProjectId_EventTime",
                table: "ComponentAuditEvents",
                columns: new[] { "ProjectId", "EventTime" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectComponents_ProjectId_UpdatedAt",
                table: "ProjectComponents",
                columns: new[] { "ProjectId", "UpdatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ComponentAuditEvents");

            migrationBuilder.DropTable(
                name: "ProjectComponents");

            migrationBuilder.AddColumn<string[]>(
                name: "AssignedComponents",
                table: "Requirements",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);
        }
    }
}
