namespace Backend.Models.Dto;

public sealed record ComplianceTermsResponse(string Version, string Text, bool Accepted, DateTime? AcceptedAtUtc);
