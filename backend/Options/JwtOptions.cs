namespace Backend.Options;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "QuantumChart";

    public string Audience { get; set; } = "QuantumChart.Client";

    public string Key { get; set; } = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY_123456";

    public int ExpirationMinutes { get; set; } = 120;
}
