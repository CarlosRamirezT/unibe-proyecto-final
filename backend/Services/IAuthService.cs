using Backend.Models.Dto;

namespace Backend.Services;

public interface IAuthService
{
    Task<(bool Succeeded, string? Error, AuthUserResponse? User)> RegisterAsync(string email, string password, CancellationToken cancellationToken = default);

    Task<(bool Succeeded, string? Error, AuthLoginResponse? Response)> LoginAsync(string email, string password, CancellationToken cancellationToken = default);

    Task<AuthUserResponse?> GetMeAsync(Guid userId, CancellationToken cancellationToken = default);
}
