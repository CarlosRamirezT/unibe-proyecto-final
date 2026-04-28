using Backend.Data;
using Backend.Models.Dto;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public sealed class UserPlanService(AppDbContext dbContext, TimeProvider timeProvider) : IUserPlanService
{
    private static readonly HashSet<string> AllowedPlans = new(StringComparer.OrdinalIgnoreCase)
    {
        "FREE",
        "PRO",
        "ELITE",
        "B2B"
    };

    public async Task<UserPlanResponse?> GetPlanAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.AppUsers
            .Where(x => x.Id == userId)
            .Select(x => new { x.PlanCode, x.PlanSelectedAtUtc })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
        {
            return null;
        }

        return new UserPlanResponse(user.PlanCode, user.PlanSelectedAtUtc);
    }

    public async Task<(bool Succeeded, string? Error, UserPlanResponse? Result)> SetPlanAsync(
        Guid userId,
        string plan,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(plan))
        {
            return (false, "Plan is required.", null);
        }

        var normalized = plan.Trim().ToUpperInvariant();
        if (!AllowedPlans.Contains(normalized))
        {
            return (false, "Invalid plan. Use Free, Pro, Elite or B2B.", null);
        }

        var user = await dbContext.AppUsers.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
        if (user is null)
        {
            return (false, "Invalid token.", null);
        }

        user.PlanCode = normalized;
        user.PlanSelectedAtUtc = timeProvider.GetUtcNow().UtcDateTime;
        await dbContext.SaveChangesAsync(cancellationToken);

        return (true, null, new UserPlanResponse(user.PlanCode, user.PlanSelectedAtUtc));
    }
}
