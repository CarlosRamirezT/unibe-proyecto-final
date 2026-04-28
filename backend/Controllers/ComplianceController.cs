using System.Security.Claims;
using Backend.Models.Dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/compliance")]
[Authorize]
public sealed class ComplianceController(IComplianceService complianceService) : ControllerBase
{
    [HttpGet("terms")]
    public async Task<IActionResult> GetTerms(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { error = "Invalid token." });
        }

        var response = await complianceService.GetTermsAsync(userId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("terms/accept")]
    public async Task<IActionResult> AcceptTerms([FromBody] ComplianceTermsAcceptRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { error = "Invalid token." });
        }

        var result = await complianceService.AcceptTermsAsync(userId, request.Version, cancellationToken);
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
