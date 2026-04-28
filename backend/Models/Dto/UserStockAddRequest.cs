namespace Backend.Models.Dto;

public sealed record UserStockAddRequest(string Ticker, decimal? CurrentInvestment);