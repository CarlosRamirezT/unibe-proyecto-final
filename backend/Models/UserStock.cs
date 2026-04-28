namespace Backend.Models;

public sealed class UserStock
{
    public long Id { get; set; }

    public Guid UserId { get; set; }

    public int StockId { get; set; }

    public decimal CurrentInvestment { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public AppUser? User { get; set; }

    public Stock? Stock { get; set; }
}