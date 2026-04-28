using System.Security.Claims;
using Backend.Models.Dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public sealed class AiController(IAiChatService aiChatService) : ControllerBase
{
    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] AiChatRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { error = "Invalid token." });
        }

        var result = await aiChatService.ChatAsync(userId, request.Message, request.Tickers, request.Metrics, cancellationToken);
        if (!result.Succeeded)
        {
            return StatusCode(result.StatusCode, new { error = result.Error });
        }

        return Ok(result.Result);
    }

    private bool TryGetUserId(out Guid userId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
        return Guid.TryParse(userIdClaim, out userId);
    }
}