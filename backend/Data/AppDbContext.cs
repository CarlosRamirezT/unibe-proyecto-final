using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> AppUsers => Set<AppUser>();
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
