using System.Text.Json;

namespace Backend.Models.Dto;

public sealed record AiChatRequest(
    string Message,
    List<string>? Tickers,
    Dictionary<string, JsonElement>? Metrics);