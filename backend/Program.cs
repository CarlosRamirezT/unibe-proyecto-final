using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing connection string: DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddHealthChecks();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // If migrations are present, apply them; otherwise create schema for the current model.
    var hasMigrations = (await db.Database.GetMigrationsAsync()).Any();
    if (hasMigrations)
    {
        await db.Database.MigrateAsync();
    }
    else
    {
        await db.Database.EnsureCreatedAsync();
    }
}

app.MapGet("/api/health", async (AppDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    return Results.Ok(new
    {
        status = canConnect ? "ok" : "degraded",
        service = "backend",
        database = canConnect ? "reachable" : "unreachable"
    });
});

app.MapGet("/api/watchlist", async (AppDbContext db) =>
{
    var items = await db.WatchlistItems
        .OrderBy(x => x.Symbol)
        .Select(x => new { x.Id, x.Symbol, x.CreatedAtUtc })
        .ToListAsync();

    return Results.Ok(items);
});

app.MapPost("/api/watchlist", async (AppDbContext db, WatchlistCreateRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Symbol))
    {
        return Results.BadRequest(new { error = "Symbol is required." });
    }

    var normalized = request.Symbol.Trim().ToUpperInvariant();

    var exists = await db.WatchlistItems.AnyAsync(x => x.Symbol == normalized);
    if (exists)
    {
        return Results.Conflict(new { error = "Symbol already exists in watchlist." });
    }

    var item = new WatchlistItem
    {
        Symbol = normalized
    };

    db.WatchlistItems.Add(item);
    await db.SaveChangesAsync();

    return Results.Created($"/api/watchlist/{item.Id}", new { item.Id, item.Symbol, item.CreatedAtUtc });
});

app.Run();

public sealed record WatchlistCreateRequest(string Symbol);
