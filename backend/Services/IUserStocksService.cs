using Backend.Models.Dto;

namespace Backend.Services;

public interface IUserStocksService
{
    Task<IReadOnlyList<StockResponse>> GetStocksCatalogAsync(CancellationToken cancellationToken = default);

    Task<(bool Succeeded, string? Error, IReadOnlyList<UserStockResponse>? Items)> GetUserStocksAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<(bool Succeeded, string? Error, UserStockResponse? Item)> AddUserStockAsync(
        Guid userId,
        string ticker,
        decimal? currentInvestment,
        CancellationToken cancellationToken = default);

    Task<(bool Succeeded, string? Error)> RemoveUserStockAsync(
        Guid userId,
        string ticker,
        CancellationToken cancellationToken = default);
}