using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<WatchlistItem> WatchlistItems => Set<WatchlistItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
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
    }
}
