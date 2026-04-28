namespace Backend.Models;

public sealed class WatchlistItem
{
    public int Id { get; set; }

    public string Symbol { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
