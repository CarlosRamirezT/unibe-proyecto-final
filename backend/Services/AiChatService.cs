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
    IWebHostEnvironment environment,
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
        var systemPrompt = await ResolveSystemPromptAsync(options, cancellationToken);

        var client = httpClientFactory.CreateClient(nameof(AiChatService));
        client.Timeout = TimeSpan.FromSeconds(45);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", options.OpenAiApiKey);

        var (url, payload) = style == "chat_completions"
            ? BuildChatCompletionsRequest(baseUrl, model, systemPrompt, prompt)
            : BuildResponsesRequest(baseUrl, model, systemPrompt, prompt);

        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };

        using var response = await client.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var providerError = TryExtractProviderError(body);
            logger.LogWarning(
                "OpenAI request failed. StatusCode={StatusCode}; ProviderError={ProviderError}; BodyLength={BodyLength}",
                (int)response.StatusCode,
                providerError,
                body.Length);

            if ((int)response.StatusCode == 429)
            {
                var fallbackText = BuildRateLimitFallback(message, tickers);
                return (
                    true,
                    StatusCodes.Status200OK,
                    null,
                    new AiChatResponse("LocalFallback", "rate-limit-fallback", fallbackText, timeProvider.GetUtcNow().UtcDateTime));
            }

            var mappedError = response.StatusCode switch
            {
                System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden
                    => "AI provider authorization failed. Check OPENAI_API_KEY and model access.",
                (System.Net.HttpStatusCode)429
                    => "AI provider rate limit reached. Try again in a moment.",
                _ => string.IsNullOrWhiteSpace(providerError)
                    ? "AI provider request failed."
                    : $"AI provider request failed: {providerError}"
            };

            return (false, StatusCodes.Status502BadGateway, mappedError, null);
        }

        var assistantText = style == "chat_completions"
            ? TryExtractChatCompletionsText(body)
            : TryExtractResponsesText(body);

        if (string.IsNullOrWhiteSpace(assistantText))
        {
            return (false, StatusCodes.Status502BadGateway, "AI provider returned an empty response.", null);
        }

        assistantText = EnsureRecommendationRestrictions(message, assistantText);

        return (
            true,
            StatusCodes.Status200OK,
            null,
            new AiChatResponse("OpenAI", model, assistantText.Trim(), timeProvider.GetUtcNow().UtcDateTime));
    }

    private static (string Url, string Payload) BuildResponsesRequest(string baseUrl, string model, string systemPrompt, string prompt)
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
                        new { type = "input_text", text = systemPrompt }
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

    private static (string Url, string Payload) BuildChatCompletionsRequest(string baseUrl, string model, string systemPrompt, string prompt)
    {
        var payloadObject = new
        {
            model,
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = systemPrompt
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

    private async Task<string> ResolveSystemPromptAsync(AiOptions options, CancellationToken cancellationToken)
    {
        const string fallbackPrompt = "You are a concise trading copilot assistant. Mention uncertainty where needed and avoid financial guarantees.";

        var configuredPath = string.IsNullOrWhiteSpace(options.SystemPromptPath)
            ? "Prompts/copilot-system-context.md"
            : options.SystemPromptPath.Trim();

        var fullPath = Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.Combine(environment.ContentRootPath, configuredPath);

        try
        {
            if (!File.Exists(fullPath))
            {
                logger.LogWarning("System prompt file not found at {PromptPath}. Using fallback prompt.", fullPath);
                return fallbackPrompt;
            }

            var content = await File.ReadAllTextAsync(fullPath, cancellationToken);
            if (string.IsNullOrWhiteSpace(content))
            {
                logger.LogWarning("System prompt file is empty at {PromptPath}. Using fallback prompt.", fullPath);
                return fallbackPrompt;
            }

            return content;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to read system prompt at {PromptPath}. Using fallback prompt.", fullPath);
            return fallbackPrompt;
        }
    }

    private static string EnsureRecommendationRestrictions(string userMessage, string assistantText)
    {
        if (!IsRecommendationRequest(userMessage))
        {
            return assistantText.Trim();
        }

        var normalizedResponse = assistantText.ToLowerInvariant();
        if (normalizedResponse.Contains("restricciones del modelo"))
        {
            return assistantText.Trim();
        }

        var restrictions = string.Join('\n',
            "Restricciones del modelo:",
            "- No proporciono asesoria financiera personalizada.",
            "- No garantizo resultados ni rendimientos.",
            "- La decision final de inversion es responsabilidad del usuario.",
            string.Empty);

        return restrictions + assistantText.Trim();
    }

    private static bool IsRecommendationRequest(string userMessage)
    {
        var normalized = (userMessage ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return false;
        }

        return normalized.Contains("me recomiendas comprar")
            || normalized.Contains("debo comprar")
            || normalized.Contains("debo vender")
            || normalized.Contains("recomiendas vender")
            || normalized.Contains("buy or sell")
            || normalized.Contains("should i buy")
            || normalized.Contains("should i sell");
    }

    private static string? TryExtractProviderError(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (root.TryGetProperty("error", out var errorElement))
            {
                if (errorElement.ValueKind == JsonValueKind.String)
                {
                    return errorElement.GetString();
                }

                if (errorElement.ValueKind == JsonValueKind.Object &&
                    errorElement.TryGetProperty("message", out var msgElement) &&
                    msgElement.ValueKind == JsonValueKind.String)
                {
                    return msgElement.GetString();
                }
            }
        }
        catch
        {
            // Ignore JSON parse failures and fall back to generic error.
        }

        return null;
    }

    private static string BuildRateLimitFallback(string message, IReadOnlyList<string> tickers)
    {
        var activeTicker = tickers.FirstOrDefault();
        var tickerContext = string.IsNullOrWhiteSpace(activeTicker)
            ? "tu ticker activo"
            : activeTicker;

        return $"Estoy operando en modo contingencia porque el proveedor IA esta temporalmente saturado (rate limit). " +
               $"Para avanzar con \"{tickerContext}\" te sugiero este mini-checklist: " +
               "1) Define horizonte (intradia, swing, largo plazo). " +
               "2) Identifica niveles clave de soporte/resistencia recientes. " +
               "3) Establece riesgo maximo por operacion y stop antes de entrar. " +
               "4) Espera confirmacion de volumen/momentum en tu direccion. " +
               "Si quieres, te doy una plantilla de plan de trade para tu mensaje: \"" + message.Trim() + "\".";
    }
}