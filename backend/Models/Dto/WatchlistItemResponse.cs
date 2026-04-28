namespace Backend.Models.Dto;

public sealed record WatchlistItemResponse(int Id, string Symbol, DateTime CreatedAtUtc);
