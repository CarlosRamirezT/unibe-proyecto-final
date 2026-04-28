namespace Backend.Options;

public sealed class MarketDataOptions
{
    public string Provider { get; set; } = "Stub";

    public string PublicApiBaseUrl { get; set; } = string.Empty;
}