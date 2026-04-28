namespace Backend.Options;

public sealed class AiOptions
{
    public string Provider { get; set; } = "OpenAI";

    public string Model { get; set; } = "gpt-4o-mini";

    public string OpenAiApiKey { get; set; } = string.Empty;

    public string OpenAiBaseUrl { get; set; } = "https://api.openai.com/v1";

    public string ApiStyle { get; set; } = "responses";

    public string SystemPromptPath { get; set; } = "Prompts/copilot-system-context.md";

    public string ClaudeApiKey { get; set; } = string.Empty;

    public string ClaudeModel { get; set; } = "claude-3-5-sonnet-latest";
}