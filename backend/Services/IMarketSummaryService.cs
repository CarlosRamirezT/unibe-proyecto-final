using Backend.Models.Dto;

namespace Backend.Services;

public interface IMarketSummaryService
{
    Task<(bool Succeeded, string? Error, MarketSummaryResponse? Result)> GetSummaryAsync(
        string ticker,
        CancellationToken cancellationToken = default);
}