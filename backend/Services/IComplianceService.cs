using Backend.Models.Dto;

namespace Backend.Services;

public interface IComplianceService
{
    Task<ComplianceTermsResponse> GetTermsAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<(bool Succeeded, string? Error, ComplianceTermsResponse? Result)> AcceptTermsAsync(
        Guid userId,
        string version,
        CancellationToken cancellationToken = default);
}
