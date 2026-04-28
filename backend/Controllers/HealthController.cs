using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class HealthController(HealthCheckService healthCheckService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var report = await healthCheckService.CheckHealthAsync(cancellationToken);
        return Ok(new
        {
            status = report.Status.ToString().ToLowerInvariant(),
            service = "backend"
        });
    }
}
