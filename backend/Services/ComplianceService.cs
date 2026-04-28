using Backend.Data;
using Backend.Models;
using Backend.Models.Dto;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public sealed class ComplianceService(AppDbContext dbContext, TimeProvider timeProvider) : IComplianceService
{
    private const string CurrentTermsVersion = "v1.0.0-2026-04";

    private const string TermsText = """
TÉRMINOS Y CONDICIONES DE USO (Referencia legal a validar)
Versión: v1.0.0-2026-04

1) Privacidad y tratamiento de datos
Utilizamos datos de cuenta, uso de plataforma y eventos operativos para permitir autenticación, seguridad, soporte y mejora del servicio.
La finalidad principal es operar la aplicación, prevenir abuso y mantener trazabilidad técnica.
Conservaremos datos durante el tiempo necesario para fines operativos, de seguridad y cumplimiento interno; luego se eliminan o anonimizan según políticas vigentes.

2) Seguridad y buenas prácticas
Debes proteger tu contraseña, evitar compartir credenciales y cerrar sesión en dispositivos compartidos.
Activa medidas de seguridad disponibles y reporta accesos no autorizados.
La plataforma implementa controles razonables, pero ningún sistema garantiza riesgo cero.

3) No asesoría financiera
La aplicación no constituye asesoría financiera, legal ni tributaria.
El sistema muestra información, estadísticas, visualizaciones y cálculos de apoyo; no emite recomendaciones personalizadas de inversión.

4) Responsabilidad del usuario
Las decisiones de inversión son exclusivamente tuyas.
Eres responsable de validar información, evaluar riesgos y consultar profesionales cuando corresponda.
No asumimos responsabilidad por pérdidas derivadas de decisiones basadas en la información mostrada.

5) Limitaciones de IA
Funciones con IA pueden contener errores, sesgos, omisiones o desactualización.
Debes verificar cualquier salida de IA antes de tomar decisiones.
La IA es una herramienta de apoyo y no sustituye criterio profesional.

6) Referencias regulatorias generales (República Dominicana)
Este texto se alinea de forma general con principios de comercio electrónico y firma digital, protección de personas consumidoras y principios de protección de datos personales.
Referencia legal a validar por el titular del proyecto antes de uso en producción.
""";

    public async Task<ComplianceTermsResponse> GetTermsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var acceptance = await dbContext.TermsAcceptances
            .Where(x => x.UserId == userId && x.TermsVersion == CurrentTermsVersion)
            .OrderByDescending(x => x.AcceptedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        return new ComplianceTermsResponse(
            CurrentTermsVersion,
            TermsText,
            acceptance is not null,
            acceptance?.AcceptedAtUtc);
    }

    public async Task<(bool Succeeded, string? Error, ComplianceTermsResponse? Result)> AcceptTermsAsync(
        Guid userId,
        string version,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(version?.Trim(), CurrentTermsVersion, StringComparison.Ordinal))
        {
            return (false, "Terms version mismatch. Refresh and try again.", null);
        }

        var userExists = await dbContext.AppUsers.AnyAsync(x => x.Id == userId, cancellationToken);
        if (!userExists)
        {
            return (false, "Invalid token.", null);
        }

        var alreadyAccepted = await dbContext.TermsAcceptances
            .AnyAsync(x => x.UserId == userId && x.TermsVersion == CurrentTermsVersion, cancellationToken);

        if (!alreadyAccepted)
        {
            dbContext.TermsAcceptances.Add(new TermsAcceptance
            {
                UserId = userId,
                TermsVersion = CurrentTermsVersion,
                AcceptedAtUtc = timeProvider.GetUtcNow().UtcDateTime
            });

            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var result = await GetTermsAsync(userId, cancellationToken);
        return (true, null, result);
    }
}
