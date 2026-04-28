namespace Backend.Models;

public sealed class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string? PlanCode { get; set; }

    public DateTime? PlanSelectedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
