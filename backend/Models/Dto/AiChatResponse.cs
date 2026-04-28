namespace Backend.Models.Dto;

public sealed record AiChatResponse(
    string Provider,
    string Model,
    string Response,
    DateTime GeneratedAtUtc);