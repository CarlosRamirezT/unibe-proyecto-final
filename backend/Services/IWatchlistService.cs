using Backend.Models.Dto;

namespace Backend.Services;

public interface IWatchlistService
{
    Task<IReadOnlyList<WatchlistItemResponse>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<(bool Succeeded, string? Error, WatchlistItemResponse? Item)> AddAsync(string symbol, CancellationToken cancellationToken = default);
}
