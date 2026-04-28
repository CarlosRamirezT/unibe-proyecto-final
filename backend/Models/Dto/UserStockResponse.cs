namespace Backend.Models.Dto;

public sealed record UserStockResponse(
    string Ticker,
    string Name,
    decimal CurrentInvestment,
    DateTime AddedAtUtc);