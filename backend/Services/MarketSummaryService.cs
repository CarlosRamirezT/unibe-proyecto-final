using Backend.Models.Dto;
using Backend.Options;
using Microsoft.Extensions.Options;

namespace Backend.Services;

public sealed class MarketSummaryService(
    IOptions<MarketDataOptions> marketOptions,
    TimeProvider timeProvider) : IMarketSummaryService
{
    public Task<(bool Succeeded, string? Error, MarketSummaryResponse? Result)> GetSummaryAsync(
        string ticker,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ticker))
        {
            return Task.FromResult((false, "Ticker is required.", (MarketSummaryResponse?)null));
        }

        var normalizedTicker = ticker.Trim().ToUpperInvariant();
        var provider = (marketOptions.Value.Provider ?? string.Empty).Trim();
        if (!string.Equals(provider, "Stub", StringComparison.OrdinalIgnoreCase))
        {
            // MVP fallback: if provider is not implemented, keep returning demo/stub output.
            provider = "Stub";
        }

        var baseValue = GetDeterministicBase(normalizedTicker);
        var response = new MarketSummaryResponse(
            normalizedTicker,
            $"{provider}-demo",
            true,
            timeProvider.GetUtcNow().UtcDateTime,
            GetRangeValue(baseValue, 0.9m),
            GetRangeValue(baseValue, 1.8m),
            GetRangeValue(baseValue, 3.2m),
            GetRangeValue(baseValue, 6.8m),
            GetRangeValue(baseValue, 9.5m),
            GetRangeValue(baseValue, 14.2m),
            GetRangeValue(baseValue, 21.5m),
            new List<MarketSummaryIndicatorDto>
            {
                new("RSI (14)", (45m + GetRangeValue(baseValue, 20m)).ToString("0.0"), true),
                new("SMA 50", "demo", true),
                new("SMA 200", "demo", true),
                new("Volatilidad", Math.Abs(GetRangeValue(baseValue, 5m)).ToString("0.00") + "%", true),
                new("Beta", (0.8m + Math.Abs(GetRangeValue(baseValue, 0.6m))).ToString("0.00"), true),
                new("Volumen relativo", (0.9m + Math.Abs(GetRangeValue(baseValue, 0.7m))).ToString("0.00") + "x", true)
            });

        return Task.FromResult((true, (string?)null, response));
    }

    private static decimal GetDeterministicBase(string ticker)
    {
        var hash = 0;
        foreach (var ch in ticker)
        {
            hash = (hash * 31) + ch;
        }

        var normalized = Math.Abs(hash % 1000) / 1000m;
        return normalized - 0.5m;
    }

    private static decimal GetRangeValue(decimal baseValue, decimal amplitude)
    {
        return Math.Round(baseValue * amplitude, 2, MidpointRounding.AwayFromZero);
    }
}