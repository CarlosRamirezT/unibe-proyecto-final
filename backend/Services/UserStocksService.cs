using Backend.Data;
using Backend.Models;
using Backend.Models.Dto;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public sealed class UserStocksService(AppDbContext dbContext) : IUserStocksService
{
    public async Task<IReadOnlyList<StockResponse>> GetStocksCatalogAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Stocks
            .OrderBy(x => x.Ticker)
            .Select(x => new StockResponse(x.Ticker, x.Name))
            .ToListAsync(cancellationToken);
    }

    public async Task<(bool Succeeded, string? Error, IReadOnlyList<UserStockResponse>? Items)> GetUserStocksAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var userExists = await dbContext.AppUsers.AnyAsync(x => x.Id == userId, cancellationToken);
        if (!userExists)
        {
            return (false, "Invalid token.", null);
        }

        var items = await dbContext.UserStocks
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.Stock!.Ticker)
            .Select(x => new UserStockResponse(
                x.Stock!.Ticker,
                x.Stock.Name,
                x.CurrentInvestment,
                x.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return (true, null, items);
    }

    public async Task<(bool Succeeded, string? Error, UserStockResponse? Item)> AddUserStockAsync(
        Guid userId,
        string ticker,
        decimal? currentInvestment,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ticker))
        {
            return (false, "Ticker is required.", null);
        }

        if (currentInvestment is < 0)
        {
            return (false, "Current investment must be greater than or equal to 0.", null);
        }

        var userExists = await dbContext.AppUsers.AnyAsync(x => x.Id == userId, cancellationToken);
        if (!userExists)
        {
            return (false, "Invalid token.", null);
        }

        var normalizedTicker = ticker.Trim().ToUpperInvariant();
        var stock = await dbContext.Stocks.FirstOrDefaultAsync(x => x.Ticker == normalizedTicker, cancellationToken);
        if (stock is null)
        {
            return (false, "Ticker not found in catalog.", null);
        }

        var exists = await dbContext.UserStocks.AnyAsync(
            x => x.UserId == userId && x.StockId == stock.Id,
            cancellationToken);

        if (exists)
        {
            return (false, "Ticker already exists in your list.", null);
        }

        var entity = new UserStock
        {
            UserId = userId,
            StockId = stock.Id,
            CurrentInvestment = currentInvestment ?? 0m
        };

        dbContext.UserStocks.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return (true, null, new UserStockResponse(stock.Ticker, stock.Name, entity.CurrentInvestment, entity.CreatedAtUtc));
    }

    public async Task<(bool Succeeded, string? Error)> RemoveUserStockAsync(
        Guid userId,
        string ticker,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ticker))
        {
            return (false, "Ticker is required.");
        }

        var normalizedTicker = ticker.Trim().ToUpperInvariant();
        var item = await dbContext.UserStocks
            .Include(x => x.Stock)
            .FirstOrDefaultAsync(
                x => x.UserId == userId && x.Stock != null && x.Stock.Ticker == normalizedTicker,
                cancellationToken);

        if (item is null)
        {
            return (false, "Ticker not found in your list.");
        }

        dbContext.UserStocks.Remove(item);
        await dbContext.SaveChangesAsync(cancellationToken);
        return (true, null);
    }
}