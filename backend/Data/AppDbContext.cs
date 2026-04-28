using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<UserStock> UserStocks => Set<UserStock>();
    public DbSet<TermsAcceptance> TermsAcceptances => Set<TermsAcceptance>();
    public DbSet<WatchlistItem> WatchlistItems => Set<WatchlistItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.ToTable("app_users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email)
                .HasMaxLength(200)
                .IsRequired();
            entity.HasIndex(x => x.Email)
                .IsUnique();
            entity.Property(x => x.PasswordHash)
                .HasMaxLength(500)
                .IsRequired();
            entity.Property(x => x.PlanCode)
                .HasMaxLength(20);
            entity.Property(x => x.PlanSelectedAtUtc);
            entity.Property(x => x.CreatedAtUtc)
                .HasDefaultValueSql("NOW()")
                .IsRequired();
        });

        modelBuilder.Entity<WatchlistItem>(entity =>
        {
            entity.ToTable("watchlist_items");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Symbol)
                .HasMaxLength(20)
                .IsRequired();
            entity.HasIndex(x => x.Symbol)
                .IsUnique();
            entity.Property(x => x.CreatedAtUtc)
                .HasDefaultValueSql("NOW()")
                .IsRequired();
        });

        modelBuilder.Entity<Stock>(entity =>
        {
            entity.ToTable("stocks");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Ticker)
                .HasMaxLength(20)
                .IsRequired();
            entity.HasIndex(x => x.Ticker)
                .IsUnique();
            entity.Property(x => x.Name)
                .HasMaxLength(120)
                .IsRequired();
            entity.Property(x => x.CreatedAtUtc)
                .HasDefaultValueSql("NOW()")
                .IsRequired();

            entity.HasData(
                new Stock { Id = 1, Ticker = "AAPL", Name = "Apple Inc.", CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc) },
                new Stock { Id = 2, Ticker = "MSFT", Name = "Microsoft Corporation", CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc) },
                new Stock { Id = 3, Ticker = "TSLA", Name = "Tesla, Inc.", CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc) },
                new Stock { Id = 4, Ticker = "NVDA", Name = "NVIDIA Corporation", CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc) },
                new Stock { Id = 5, Ticker = "AMZN", Name = "Amazon.com, Inc.", CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc) },
                new Stock { Id = 6, Ticker = "GOOGL", Name = "Alphabet Inc.", CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc) },
                new Stock { Id = 7, Ticker = "META", Name = "Meta Platforms, Inc.", CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc) },
                new Stock { Id = 8, Ticker = "NFLX", Name = "Netflix, Inc.", CreatedAtUtc = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc) }
            );
        });

        modelBuilder.Entity<UserStock>(entity =>
        {
            entity.ToTable("user_stocks");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CurrentInvestment)
                .HasPrecision(18, 2)
                .HasDefaultValue(0m)
                .IsRequired();
            entity.Property(x => x.CreatedAtUtc)
                .HasDefaultValueSql("NOW()")
                .IsRequired();
            entity.HasIndex(x => new { x.UserId, x.StockId })
                .IsUnique();
            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Stock)
                .WithMany()
                .HasForeignKey(x => x.StockId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TermsAcceptance>(entity =>
        {
            entity.ToTable("terms_acceptances");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TermsVersion)
                .HasMaxLength(40)
                .IsRequired();
            entity.Property(x => x.AcceptedAtUtc)
                .HasDefaultValueSql("NOW()")
                .IsRequired();
            entity.HasIndex(x => new { x.UserId, x.TermsVersion })
                .IsUnique();
            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
