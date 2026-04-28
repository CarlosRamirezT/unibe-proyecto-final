using System.Security.Claims;
using Backend.Models.Dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/user")]
[Authorize]
public sealed class UserPlanController(IUserPlanService userPlanService) : ControllerBase
{
    [HttpGet("plan")]
    public async Task<IActionResult> GetPlan(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { error = "Invalid token." });
        }

        var plan = await userPlanService.GetPlanAsync(userId, cancellationToken);
        if (plan is null)
        {
            return Unauthorized(new { error = "Invalid token." });
        }

        return Ok(plan);
    }

    [HttpPost("plan")]
    public async Task<IActionResult> SetPlan([FromBody] UserPlanUpdateRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { error = "Invalid token." });
        }

        var result = await userPlanService.SetPlanAsync(userId, request.Plan, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Result);
    }

    private bool TryGetUserId(out Guid userId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
        return Guid.TryParse(userIdClaim, out userId);
    }
}
