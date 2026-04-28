namespace Backend.Models;

public sealed class TermsAcceptance
{
    public long Id { get; set; }

    public Guid UserId { get; set; }

    public AppUser User { get; set; } = null!;

    public string TermsVersion { get; set; } = string.Empty;

    public DateTime AcceptedAtUtc { get; set; } = DateTime.UtcNow;
}
