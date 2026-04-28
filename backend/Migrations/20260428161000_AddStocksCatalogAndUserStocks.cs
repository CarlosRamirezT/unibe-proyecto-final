using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Migrations
{
    public partial class AddStocksCatalogAndUserStocks : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "stocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Ticker = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stocks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "user_stocks",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    StockId = table.Column<int>(type: "integer", nullable: false),
                    CurrentInvestment = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_stocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_stocks_app_users_UserId",
                        column: x => x.UserId,
                        principalTable: "app_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_stocks_stocks_StockId",
                        column: x => x.StockId,
                        principalTable: "stocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "stocks",
                columns: new[] { "Id", "CreatedAtUtc", "Name", "Ticker" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc), "Apple Inc.", "AAPL" },
                    { 2, new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc), "Microsoft Corporation", "MSFT" },
                    { 3, new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc), "Tesla, Inc.", "TSLA" },
                    { 4, new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc), "NVIDIA Corporation", "NVDA" },
                    { 5, new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc), "Amazon.com, Inc.", "AMZN" },
                    { 6, new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc), "Alphabet Inc.", "GOOGL" },
                    { 7, new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc), "Meta Platforms, Inc.", "META" },
                    { 8, new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc), "Netflix, Inc.", "NFLX" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_stocks_Ticker",
                table: "stocks",
                column: "Ticker",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_stocks_StockId",
                table: "user_stocks",
                column: "StockId");

            migrationBuilder.CreateIndex(
                name: "IX_user_stocks_UserId_StockId",
                table: "user_stocks",
                columns: new[] { "UserId", "StockId" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_stocks");

            migrationBuilder.DropTable(
                name: "stocks");
        }
    }
}