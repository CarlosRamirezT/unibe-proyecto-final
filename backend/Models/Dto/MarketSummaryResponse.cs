namespace Backend.Models.Dto;

public sealed record MarketSummaryResponse(
    string Ticker,
    string Source,
    bool IsDemo,
    DateTime GeneratedAtUtc,
    decimal LastHourChangePct,
    decimal LastDayChangePct,
    decimal LastWeekChangePct,
    decimal LastMonthChangePct,
    decimal Last3MonthsChangePct,
    decimal Last6MonthsChangePct,
    decimal LastYearChangePct,
    IReadOnlyList<MarketSummaryIndicatorDto> Indicators);