namespace Backend.Models.Dto;

public sealed record UserPlanResponse(string? Plan, DateTime? SelectedAtUtc);
