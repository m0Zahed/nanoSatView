using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectManagement.Migrations
{
    /// <inheritdoc />
    public partial class _PendingCheck : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                CREATE TABLE IF NOT EXISTS "Organisations" (
                    "Id" uuid NOT NULL,
                    "Name" character varying(200) NOT NULL,
                    "Initials" character varying(8) NOT NULL,
                    "Color" character varying(50) NOT NULL,
                    "InviteLink" character varying(200) NOT NULL,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_Organisations" PRIMARY KEY ("Id")
                );
                """
            );

            migrationBuilder.Sql(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_Organisations_InviteLink"
                ON "Organisations" ("InviteLink");
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""DROP TABLE IF EXISTS "Organisations";""");
        }
    }
}
