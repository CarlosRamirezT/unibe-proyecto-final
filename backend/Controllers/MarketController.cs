using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/market")]
public sealed class MarketController(IMarketSummaryService marketSummaryService) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] string ticker, CancellationToken cancellationToken)
    {
        var result = await marketSummaryService.GetSummaryAsync(ticker, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Result);
    }
}