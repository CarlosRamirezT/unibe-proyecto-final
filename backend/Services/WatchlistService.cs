using Backend.Data;
using Backend.Models;
using Backend.Models.Dto;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public sealed class WatchlistService(AppDbContext dbContext) : IWatchlistService
{
    public async Task<IReadOnlyList<WatchlistItemResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.WatchlistItems
            .OrderBy(x => x.Symbol)
            .Select(x => new WatchlistItemResponse(x.Id, x.Symbol, x.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<(bool Succeeded, string? Error, WatchlistItemResponse? Item)> AddAsync(string symbol, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(symbol))
        {
            return (false, "Symbol is required.", null);
        }

        var normalized = symbol.Trim().ToUpperInvariant();
        var exists = await dbContext.WatchlistItems.AnyAsync(x => x.Symbol == normalized, cancellationToken);

        if (exists)
        {
            return (false, "Symbol already exists in watchlist.", null);
        }

        var item = new WatchlistItem
        {
            Symbol = normalized
        };

        dbContext.WatchlistItems.Add(item);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new WatchlistItemResponse(item.Id, item.Symbol, item.CreatedAtUtc);
        return (true, null, response);
    }
}
