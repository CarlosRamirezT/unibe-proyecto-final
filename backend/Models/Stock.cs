namespace Backend.Models;

public sealed class Stock
{
    public int Id { get; set; }

    public string Ticker { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}