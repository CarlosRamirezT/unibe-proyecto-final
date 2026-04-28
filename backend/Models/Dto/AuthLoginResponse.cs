namespace Backend.Models.Dto;

public sealed record AuthLoginResponse(string Token, DateTime ExpiresAtUtc, AuthUserResponse User);
