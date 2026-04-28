using System;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Migrations
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.4")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("Backend.Models.AppUser", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<DateTime>("CreatedAtUtc")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("timestamp with time zone")
                        .HasDefaultValueSql("NOW()");

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.Property<string>("PasswordHash")
                        .IsRequired()
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<string>("PlanCode")
                        .HasMaxLength(20)
                        .HasColumnType("character varying(20)");

                    b.Property<DateTime?>("PlanSelectedAtUtc")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.HasIndex("Email")
                        .IsUnique();

                    b.ToTable("app_users", (string)null);
                });

            modelBuilder.Entity("Backend.Models.Stock", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<DateTime>("CreatedAtUtc")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("timestamp with time zone")
                        .HasDefaultValueSql("NOW()");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(120)
                        .HasColumnType("character varying(120)");

                    b.Property<string>("Ticker")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("character varying(20)");

                    b.HasKey("Id");

                    b.HasIndex("Ticker")
                        .IsUnique();

                    b.ToTable("stocks", (string)null);

                    b.HasData(
                        new
                        {
                            Id = 1,
                            CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc),
                            Name = "Apple Inc.",
                            Ticker = "AAPL"
                        },
                        new
                        {
                            Id = 2,
                            CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc),
                            Name = "Microsoft Corporation",
                            Ticker = "MSFT"
                        },
                        new
                        {
                            Id = 3,
                            CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc),
                            Name = "Tesla, Inc.",
                            Ticker = "TSLA"
                        },
                        new
                        {
                            Id = 4,
                            CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc),
                            Name = "NVIDIA Corporation",
                            Ticker = "NVDA"
                        },
                        new
                        {
                            Id = 5,
                            CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc),
                            Name = "Amazon.com, Inc.",
                            Ticker = "AMZN"
                        },
                        new
                        {
                            Id = 6,
                            CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc),
                            Name = "Alphabet Inc.",
                            Ticker = "GOOGL"
                        },
                        new
                        {
                            Id = 7,
                            CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc),
                            Name = "Meta Platforms, Inc.",
                            Ticker = "META"
                        },
                        new
                        {
                            Id = 8,
                            CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc),
                            Name = "Netflix, Inc.",
                            Ticker = "NFLX"
                        });
                });

            modelBuilder.Entity("Backend.Models.TermsAcceptance", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<DateTime>("AcceptedAtUtc")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("timestamp with time zone")
                        .HasDefaultValueSql("NOW()");

                    b.Property<string>("TermsVersion")
                        .IsRequired()
                        .HasMaxLength(40)
                        .HasColumnType("character varying(40)");

                    b.Property<Guid>("UserId")
                        .HasColumnType("uuid");

                    b.HasKey("Id");

                    b.HasIndex("UserId", "TermsVersion")
                        .IsUnique();

                    b.ToTable("terms_acceptances", (string)null);
                });

            modelBuilder.Entity("Backend.Models.UserStock", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<DateTime>("CreatedAtUtc")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("timestamp with time zone")
                        .HasDefaultValueSql("NOW()");

                    b.Property<decimal>("CurrentInvestment")
                        .ValueGeneratedOnAdd()
                        .HasPrecision(18, 2)
                        .HasColumnType("numeric(18,2)")
                        .HasDefaultValue(0m);

                    b.Property<int>("StockId")
                        .HasColumnType("integer");

                    b.Property<Guid>("UserId")
                        .HasColumnType("uuid");

                    b.HasKey("Id");

                    b.HasIndex("StockId");

                    b.HasIndex("UserId", "StockId")
                        .IsUnique();

                    b.ToTable("user_stocks", (string)null);
                });

            modelBuilder.Entity("Backend.Models.WatchlistItem", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<DateTime>("CreatedAtUtc")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("timestamp with time zone")
                        .HasDefaultValueSql("NOW()");

                    b.Property<string>("Symbol")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("character varying(20)");

                    b.HasKey("Id");

                    b.HasIndex("Symbol")
                        .IsUnique();

                    b.ToTable("watchlist_items", (string)null);
                });

            modelBuilder.Entity("Backend.Models.TermsAcceptance", b =>
                {
                    b.HasOne("Backend.Models.AppUser", "User")
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("User");
                });

            modelBuilder.Entity("Backend.Models.UserStock", b =>
                {
                    b.HasOne("Backend.Models.Stock", "Stock")
                        .WithMany()
                        .HasForeignKey("StockId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Backend.Models.AppUser", "User")
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Stock");

                    b.Navigation("User");
                });
#pragma warning restore 612, 618
        }
    }
}
