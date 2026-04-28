using System.Text;
using Backend.Data;
using Backend.Models;
using Backend.Options;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing connection string: DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwtSettings.Key) || jwtSettings.Key.Length < 32)
{
    throw new InvalidOperationException("Jwt:Key must be configured and at least 32 characters long.");
}

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<AiOptions>(builder.Configuration.GetSection("Ai"));
builder.Services.Configure<MarketDataOptions>(builder.Configuration.GetSection("MarketData"));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("auth-login", limiter =>
    {
        limiter.PermitLimit = 5;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 0;
        limiter.AutoReplenishment = true;
    });
});

builder.Services.AddScoped<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();
builder.Services.AddSingleton<TimeProvider>(TimeProvider.System);
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IComplianceService, ComplianceService>();
builder.Services.AddScoped<IUserPlanService, UserPlanService>();
builder.Services.AddScoped<IUserStocksService, UserStocksService>();
builder.Services.AddScoped<IAiChatService, AiChatService>();
builder.Services.AddScoped<IMarketSummaryService, MarketSummaryService>();
builder.Services.AddScoped<IWatchlistService, WatchlistService>();
builder.Services.AddHttpClient();
builder.Services.AddControllers();

const string corsPolicyName = "FrontendOnly";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:8080"];

builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddHealthChecks();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseBootstrap");

    // Step 1: ensure all application tables exist (idempotent raw SQL).
    await BootstrapSchemaAsync(db, logger);

    // Step 2: ensure __EFMigrationsHistory exists and contains all known migrations
    // so that MigrateAsync is a no-op and never tries to re-apply already-run DDL.
    await SeedMigrationHistoryAsync(db, logger);

    // Step 3: MigrateAsync is now safe — all migrations are marked applied.
    try
    {
        await db.Database.MigrateAsync();
        logger.LogInformation("Database schema is up to date.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "MigrateAsync check failed (non-fatal — schema was bootstrapped via raw SQL).");
    }
}

app.UseCors(corsPolicyName);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health");
app.MapControllers();

app.Run();

static async Task BootstrapSchemaAsync(AppDbContext db, ILogger logger)
{
    logger.LogInformation("Running idempotent schema bootstrap...");
    await db.Database.ExecuteSqlRawAsync(@"
CREATE TABLE IF NOT EXISTS app_users (
  ""Id"" uuid PRIMARY KEY,
  ""Email"" character varying(200) NOT NULL,
  ""PasswordHash"" character varying(500) NOT NULL,
  ""PlanCode"" character varying(20),
  ""PlanSelectedAtUtc"" timestamp with time zone,
  ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_app_users_Email"" ON app_users (""Email"");

CREATE TABLE IF NOT EXISTS watchlist_items (
  ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ""Symbol"" character varying(20) NOT NULL,
  ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_watchlist_items_Symbol"" ON watchlist_items (""Symbol"");

CREATE TABLE IF NOT EXISTS terms_acceptances (
  ""Id"" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ""UserId"" uuid NOT NULL REFERENCES app_users(""Id"") ON DELETE CASCADE,
  ""TermsVersion"" character varying(40) NOT NULL,
  ""AcceptedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_terms_acceptances_UserId_TermsVersion"" ON terms_acceptances (""UserId"", ""TermsVersion"");

CREATE TABLE IF NOT EXISTS stocks (
  ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ""Ticker"" character varying(20) NOT NULL,
  ""Name"" character varying(120) NOT NULL,
  ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_stocks_Ticker"" ON stocks (""Ticker"");

CREATE TABLE IF NOT EXISTS user_stocks (
  ""Id"" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ""UserId"" uuid NOT NULL REFERENCES app_users(""Id"") ON DELETE CASCADE,
  ""StockId"" integer NOT NULL REFERENCES stocks(""Id"") ON DELETE CASCADE,
  ""CurrentInvestment"" numeric(18,2) NOT NULL DEFAULT 0,
  ""CreatedAtUtc"" timestamp with time zone NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_user_stocks_UserId_StockId"" ON user_stocks (""UserId"", ""StockId"");
CREATE INDEX IF NOT EXISTS ""IX_user_stocks_StockId"" ON user_stocks (""StockId"");

INSERT INTO stocks (""Ticker"", ""Name"") VALUES
('AAPL','Apple Inc.'),('MSFT','Microsoft Corporation'),('TSLA','Tesla, Inc.'),
('NVDA','NVIDIA Corporation'),('AMZN','Amazon.com, Inc.'),('GOOGL','Alphabet Inc.'),
('META','Meta Platforms, Inc.'),('NFLX','Netflix, Inc.')
ON CONFLICT (""Ticker"") DO NOTHING;
");
    logger.LogInformation("Schema bootstrap complete.");
}

static async Task SeedMigrationHistoryAsync(AppDbContext db, ILogger logger)
{
    // Known migration IDs — must match the filenames in Migrations/
    var migrations = new[]
    {
        ("20260428120000_InitialCreate",              "8.0.4"),
        ("20260428133000_AddTermsAcceptances",        "8.0.4"),
        ("20260428142000_AddPlanToUsers",             "8.0.4"),
        ("20260428161000_AddStocksCatalogAndUserStocks", "8.0.4"),
    };

    await db.Database.ExecuteSqlRawAsync(@"
CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
    ""MigrationId"" character varying(150) NOT NULL,
    ""ProductVersion"" character varying(32) NOT NULL,
    CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
);");

    foreach (var (id, ver) in migrations)
    {
        await db.Database.ExecuteSqlRawAsync(
            $"INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ('{id}', '{ver}') ON CONFLICT DO NOTHING;");
    }

    logger.LogInformation("Migration history seeded with {Count} entries.", migrations.Length);
}
