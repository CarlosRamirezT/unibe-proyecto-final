using System.Text.Json;
using Backend.Models.Dto;

namespace Backend.Services;

public interface IAiChatService
{
    Task<(bool Succeeded, int StatusCode, string? Error, AiChatResponse? Result)> ChatAsync(
        Guid userId,
        string message,
        IReadOnlyList<string>? tickers,
        IReadOnlyDictionary<string, JsonElement>? metrics,
        CancellationToken cancellationToken = default);
}