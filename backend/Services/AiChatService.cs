using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Backend.Models.Dto;
using Backend.Options;
using Microsoft.Extensions.Options;

namespace Backend.Services;

public sealed class AiChatService(
    IHttpClientFactory httpClientFactory,
    IOptions<AiOptions> aiOptions,
    ILogger<AiChatService> logger,
    TimeProvider timeProvider) : IAiChatService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<(bool Succeeded, int StatusCode, string? Error, AiChatResponse? Result)> ChatAsync(
        Guid userId,
        string message,
        IReadOnlyList<string>? tickers,
        IReadOnlyDictionary<string, JsonElement>? metrics,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return (false, StatusCodes.Status400BadRequest, "Message is required.", null);
        }

        var options = aiOptions.Value;
        var provider = (options.Provider ?? string.Empty).Trim();
        var normalizedProvider = provider.ToUpperInvariant();

        var normalizedTickers = (tickers ?? [])
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim().ToUpperInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        logger.LogInformation(
            "AI chat request received. Provider={Provider}; UserId={UserId}; MessageLength={MessageLength}; TickerCount={TickerCount}; MetricCount={MetricCount}",
            provider,
            userId,
            message.Length,
            normalizedTickers.Length,
            metrics?.Count ?? 0);

        return normalizedProvider switch
        {
            "OPENAI" => await ChatWithOpenAiAsync(options, message, normalizedTickers, metrics, cancellationToken),
            "CLAUDE" => (false, StatusCodes.Status501NotImplemented, "Claude provider is configured as a placeholder in this MVP.", null),
            _ => (false, StatusCodes.Status400BadRequest, "Unsupported AI provider. Use OpenAI or Claude.", null)
        };
    }

    private async Task<(bool Succeeded, int StatusCode, string? Error, AiChatResponse? Result)> ChatWithOpenAiAsync(
        AiOptions options,
        string message,
        IReadOnlyList<string> tickers,
        IReadOnlyDictionary<string, JsonElement>? metrics,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(options.OpenAiApiKey))
        {
            return (false, StatusCodes.Status500InternalServerError, "OpenAI API key is not configured.", null);
        }

        var style = (options.ApiStyle ?? string.Empty).Trim().ToLowerInvariant();
        var model = string.IsNullOrWhiteSpace(options.Model) ? "gpt-4o-mini" : options.Model.Trim();
        var baseUrl = string.IsNullOrWhiteSpace(options.OpenAiBaseUrl)
            ? "https://api.openai.com/v1"
            : options.OpenAiBaseUrl.Trim().TrimEnd('/');

        var prompt = BuildUserPrompt(message, tickers, metrics);

        var client = httpClientFactory.CreateClient(nameof(AiChatService));
        client.Timeout = TimeSpan.FromSeconds(45);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", options.OpenAiApiKey);

        var (url, payload) = style == "chat_completions"
            ? BuildChatCompletionsRequest(baseUrl, model, prompt)
            : BuildResponsesRequest(baseUrl, model, prompt);

        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };

        using var response = await client.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("OpenAI request failed. StatusCode={StatusCode}; BodyLength={BodyLength}", (int)response.StatusCode, body.Length);
            return (false, StatusCodes.Status502BadGateway, "AI provider request failed.", null);
        }

        var assistantText = style == "chat_completions"
            ? TryExtractChatCompletionsText(body)
            : TryExtractResponsesText(body);

        if (string.IsNullOrWhiteSpace(assistantText))
        {
            return (false, StatusCodes.Status502BadGateway, "AI provider returned an empty response.", null);
        }

        return (
            true,
            StatusCodes.Status200OK,
            null,
            new AiChatResponse("OpenAI", model, assistantText.Trim(), timeProvider.GetUtcNow().UtcDateTime));
    }

    private static (string Url, string Payload) BuildResponsesRequest(string baseUrl, string model, string prompt)
    {
        var payloadObject = new
        {
            model,
            input = new object[]
            {
                new
                {
                    role = "system",
                    content = new object[]
                    {
                        new { type = "input_text", text = "You are a concise trading copilot assistant. Mention uncertainty where needed and avoid financial guarantees." }
                    }
                },
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new { type = "input_text", text = prompt }
                    }
                }
            }
        };

        return ($"{baseUrl}/responses", JsonSerializer.Serialize(payloadObject, JsonOptions));
    }

    private static (string Url, string Payload) BuildChatCompletionsRequest(string baseUrl, string model, string prompt)
    {
        var payloadObject = new
        {
            model,
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "You are a concise trading copilot assistant. Mention uncertainty where needed and avoid financial guarantees."
                },
                new
                {
                    role = "user",
                    content = prompt
                }
            }
        };

        return ($"{baseUrl}/chat/completions", JsonSerializer.Serialize(payloadObject, JsonOptions));
    }

    private static string BuildUserPrompt(
        string message,
        IReadOnlyList<string> tickers,
        IReadOnlyDictionary<string, JsonElement>? metrics)
    {
        var sb = new StringBuilder();
        sb.AppendLine("User message:");
        sb.AppendLine(message.Trim());

        if (tickers.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("Selected tickers:");
            sb.AppendLine(string.Join(", ", tickers));
        }

        if (metrics is { Count: > 0 })
        {
            sb.AppendLine();
            sb.AppendLine("Provided metrics:");
            foreach (var item in metrics)
            {
                sb.AppendLine($"- {item.Key}: {item.Value}");
            }
        }

        return sb.ToString();
    }

    private static string? TryExtractResponsesText(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.TryGetProperty("output_text", out var outputTextElement) && outputTextElement.ValueKind == JsonValueKind.String)
        {
            return outputTextElement.GetString();
        }

        if (!root.TryGetProperty("output", out var outputElement) || outputElement.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        foreach (var outputItem in outputElement.EnumerateArray())
        {
            if (!outputItem.TryGetProperty("content", out var content) || content.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var contentItem in content.EnumerateArray())
            {
                if (contentItem.TryGetProperty("text", out var textElement) && textElement.ValueKind == JsonValueKind.String)
                {
                    var text = textElement.GetString();
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        return text;
                    }
                }
            }
        }

        return null;
    }

    private static string? TryExtractChatCompletionsText(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (!root.TryGetProperty("choices", out var choices) || choices.ValueKind != JsonValueKind.Array || choices.GetArrayLength() == 0)
        {
            return null;
        }

        var first = choices[0];
        if (!first.TryGetProperty("message", out var messageElement))
        {
            return null;
        }

        if (messageElement.TryGetProperty("content", out var contentElement) && contentElement.ValueKind == JsonValueKind.String)
        {
            return contentElement.GetString();
        }

        if (messageElement.TryGetProperty("content", out contentElement) && contentElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in contentElement.EnumerateArray())
            {
                if (item.TryGetProperty("text", out var textElement) && textElement.ValueKind == JsonValueKind.String)
                {
                    var text = textElement.GetString();
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        return text;
                    }
                }
            }
        }

        return null;
    }
}