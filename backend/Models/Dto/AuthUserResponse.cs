namespace Backend.Models.Dto;

public sealed record AuthUserResponse(Guid Id, string Email, DateTime CreatedAtUtc);
