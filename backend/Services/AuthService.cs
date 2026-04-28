using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using Backend.Data;
using Backend.Models;
using Backend.Models.Dto;
using Backend.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services;

public sealed class AuthService(
    AppDbContext dbContext,
    IPasswordHasher<AppUser> passwordHasher,
    IOptions<JwtOptions> jwtOptions,
    TimeProvider timeProvider) : IAuthService
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public async Task<(bool Succeeded, string? Error, AuthUserResponse? User)> RegisterAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (normalizedEmail is null)
        {
            return (false, "Email is invalid.", null);
        }

        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
        {
            return (false, "Password must be at least 8 characters.", null);
        }

        var exists = await dbContext.AppUsers
            .AnyAsync(x => x.Email == normalizedEmail, cancellationToken);

        if (exists)
        {
            return (false, "Email is already in use.", null);
        }

        var user = new AppUser
        {
            Email = normalizedEmail
        };

        user.PasswordHash = passwordHasher.HashPassword(user, password);

        dbContext.AppUsers.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return (true, null, ToUserResponse(user));
    }

    public async Task<(bool Succeeded, string? Error, AuthLoginResponse? Response)> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (normalizedEmail is null || string.IsNullOrWhiteSpace(password))
        {
            return (false, "Invalid email or password.", null);
        }

        var user = await dbContext.AppUsers
            .FirstOrDefaultAsync(x => x.Email == normalizedEmail, cancellationToken);

        if (user is null)
        {
            return (false, "Invalid email or password.", null);
        }

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (verification == PasswordVerificationResult.Failed)
        {
            return (false, "Invalid email or password.", null);
        }

        var now = timeProvider.GetUtcNow().UtcDateTime;
        var expiresAtUtc = now.AddMinutes(_jwtOptions.ExpirationMinutes);
        var token = BuildToken(user, expiresAtUtc);

        var response = new AuthLoginResponse(token, expiresAtUtc, ToUserResponse(user));
        return (true, null, response);
    }

    public async Task<AuthUserResponse?> GetMeAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.AppUsers
            .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);

        return user is null ? null : ToUserResponse(user);
    }

    private string BuildToken(AppUser user, DateTime expiresAtUtc)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string? NormalizeEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var trimmed = email.Trim();
        try
        {
            var mail = new MailAddress(trimmed);
            if (!string.Equals(mail.Address, trimmed, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            return trimmed.ToLower(CultureInfo.InvariantCulture);
        }
        catch
        {
            return null;
        }
    }

    private static AuthUserResponse ToUserResponse(AppUser user)
    {
        return new AuthUserResponse(user.Id, user.Email, user.CreatedAtUtc);
    }
}
