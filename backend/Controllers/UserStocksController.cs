using System.Security.Claims;
using Backend.Models.Dto;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/user/stocks")]
[Authorize]
public sealed class UserStocksController(IUserStocksService userStocksService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetUserStocks(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { error = "Invalid token." });
        }

        var result = await userStocksService.GetUserStocksAsync(userId, cancellationToken);
        if (!result.Succeeded)
        {
            return Unauthorized(new { error = result.Error });
        }

        return Ok(result.Items);
    }

    [HttpPost]
    public async Task<IActionResult> AddUserStock([FromBody] UserStockAddRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { error = "Invalid token." });
        }

        var result = await userStocksService.AddUserStockAsync(userId, request.Ticker, request.CurrentInvestment, cancellationToken);
        if (!result.Succeeded)
        {
            if (result.Error == "Ticker already exists in your list.")
            {
                return Conflict(new { error = result.Error });
            }

            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpDelete("{ticker}")]
    public async Task<IActionResult> RemoveUserStock([FromRoute] string ticker, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { error = "Invalid token." });
        }

        var result = await userStocksService.RemoveUserStockAsync(userId, ticker, cancellationToken);
        if (!result.Succeeded)
        {
            return NotFound(new { error = result.Error });
        }

        return NoContent();
    }

    [HttpPut("{ticker}/investment")]
    public async Task<IActionResult> UpdateInvestment(
        [FromRoute] string ticker,
        [FromBody] UserStockInvestmentUpdateRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { error = "Invalid token." });
        }

        var result = await userStocksService.UpdateInvestmentAsync(userId, ticker, request.Amount, cancellationToken);
        if (!result.Succeeded)
        {
            if (result.Error == "Ticker not found in your list.")
            {
                return NotFound(new { error = result.Error });
            }

            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    private bool TryGetUserId(out Guid userId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
        return Guid.TryParse(userIdClaim, out userId);
    }
}