using Backend.Models.Dto;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class WatchlistController(IWatchlistService watchlistService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<WatchlistItemResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var items = await watchlistService.GetAllAsync(cancellationToken);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] WatchlistCreateRequest request, CancellationToken cancellationToken)
    {
        var result = await watchlistService.AddAsync(request.Symbol, cancellationToken);

        if (!result.Succeeded)
        {
            if (result.Error == "Symbol already exists in watchlist.")
            {
                return Conflict(new { error = result.Error });
            }

            return BadRequest(new { error = result.Error });
        }

        return Created($"/api/watchlist/{result.Item!.Id}", result.Item);
    }
}
