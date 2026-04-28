using Backend.Models.Dto;

namespace Backend.Services;

public interface IUserPlanService
{
    Task<UserPlanResponse?> GetPlanAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<(bool Succeeded, string? Error, UserPlanResponse? Result)> SetPlanAsync(
        Guid userId,
        string plan,
        CancellationToken cancellationToken = default);
}
