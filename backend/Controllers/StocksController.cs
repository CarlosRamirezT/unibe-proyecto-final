using Backend.Models.Dto;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/stocks")]
public sealed class StocksController(IUserStocksService userStocksService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StockResponse>>> GetCatalog(CancellationToken cancellationToken)
    {
        var items = await userStocksService.GetStocksCatalogAsync(cancellationToken);
        return Ok(items);
    }
}