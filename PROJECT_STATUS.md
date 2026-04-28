# PROJECT_STATUS

## Vision Del Proyecto
Quantum Chart es una plataforma de trading con asistente IA para onboarding guiado:
1. Registro/login con JWT.
2. Aceptacion obligatoria de terminos.
3. Seleccion de plan.
4. Seleccion y gestion de acciones por usuario.
5. Copilot IA con contexto de tickers del usuario.
6. Panel lateral de indicadores y disclaimers visibles.

El objetivo actual es MVP funcional de flujo completo, con datos de mercado en modo demo/stub y arquitectura lista para conectar proveedor real.

## Como Correr
### Local (frontend estatico rapido)
Desde la raiz:

```bash
python3 -m http.server 5500
```

Abrir: `http://localhost:5500/`

Referencia: [README.md](README.md)

### Local (backend + frontend sin compose)
Requisitos:
1. .NET 8 SDK.
2. PostgreSQL local con DB/usuario/password segun [backend/appsettings.json](backend/appsettings.json).

Backend:

```bash
cd backend
dotnet run
```

Frontend estatico (otra terminal):

```bash
cd /Users/cadara/projects/unibe-proyecto-final
python3 -m http.server 5500
```

Nota: CORS por defecto en backend esta configurado para `http://localhost:8080` en [backend/appsettings.json](backend/appsettings.json). Para entorno local fuera de ese origen, ajustar `Cors:AllowedOrigins`.

### Docker Compose (recomendado para stack completo)
1. Copiar variables:

```bash
cp .env.example .env
```

2. Levantar stack:

```bash
docker compose up --build
```

3. URLs:
1. Frontend: `http://localhost:8080`
2. Backend: `http://localhost:8081`
3. Health backend: `http://localhost:8081/health`

Orquestacion en [docker-compose.yml](docker-compose.yml).

## Arquitectura Actual
### Frontend
1. HTML estatico en [src/html](src/html).
2. CSS compartido en [src/css/main.css](src/css/main.css).
3. JS por pagina en [src/js/pages](src/js/pages).
4. Navegacion centralizada por mapeo textual en [src/js/navigation.js](src/js/navigation.js).

### Backend
1. ASP.NET Core .NET 8 en [backend](backend).
2. Controladores REST en [backend/Controllers](backend/Controllers).
3. Servicios de dominio en [backend/Services](backend/Services).
4. Opciones/configuracion en [backend/Options](backend/Options).
5. EF Core + migraciones en [backend/Data](backend/Data) y [backend/Migrations](backend/Migrations).

### Base De Datos
PostgreSQL 16 (compose) con entidades principales:
1. `app_users`
2. `terms_acceptances`
3. `stocks`
4. `user_stocks`
5. `watchlist_items` (legado global, no user-scoped)

## Variables De Entorno (Sin Secretos)
Base (ver [docker-compose.yml](docker-compose.yml) y [.env.example](.env.example)):
1. `POSTGRES_DB`
2. `POSTGRES_USER`
3. `POSTGRES_PASSWORD`
4. `JWT_KEY`
5. `OPENAI_API_KEY`
6. `CLAUDE_API_KEY`
7. `AI_PROVIDER` (`OpenAI` o `Claude` placeholder)
8. `AI_MODEL`
9. `AI_API_STYLE` (`responses` o `chat_completions`)

Internamente compose tambien usa:
1. `ConnectionStrings__DefaultConnection`
2. `Ai__Provider`
3. `Ai__Model`
4. `Ai__ApiStyle`
5. `Ai__OpenAiApiKey`
6. `Ai__ClaudeApiKey`

## Endpoints Principales
### Salud
1. `GET /health`
2. `GET /api/health`

### Auth
1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `GET /api/auth/me` (JWT)

### Compliance
1. `GET /api/compliance/terms` (JWT)
2. `POST /api/compliance/terms/accept` (JWT)

### Plan
1. `GET /api/user/plan` (JWT)
2. `POST /api/user/plan` (JWT)

### Stocks (MVP)
1. `GET /api/stocks`
2. `GET /api/user/stocks` (JWT)
3. `POST /api/user/stocks` (JWT)
4. `DELETE /api/user/stocks/{ticker}` (JWT)
5. `PUT /api/user/stocks/{ticker}/investment` (JWT)

### IA
1. `POST /api/ai/chat` (JWT)
   - proveedor configurable en backend
   - OpenAI implementado
   - Claude placeholder

### Market Summary (panel lateral)
1. `GET /api/market/summary?ticker=...`
   - actualmente `Stub` demo en [backend/Services/MarketSummaryService.cs](backend/Services/MarketSummaryService.cs)

## Happy Path Implementado (Estado Actual)
1. Signup en [src/html/signup.html](src/html/signup.html).
2. Login en [src/html/login.html](src/html/login.html).
3. Dashboard protegido en [src/html/dashboard.html](src/html/dashboard.html).
4. Modal obligatorio de terminos y aceptacion persistida.
5. Seleccion de plan (`FREE/PRO/ELITE/B2B`).
6. Primera vez: redireccion a seleccionar acciones en [src/html/select-stocks.html](src/html/select-stocks.html).
7. Mis Acciones con monto editable en [src/html/my-stocks.html](src/html/my-stocks.html).
8. Boton IA por accion hacia [src/html/copilot.html](src/html/copilot.html) con contexto de tickers.
9. Copilot conectado a `/api/ai/chat` + panel lateral de indicadores + info tips + disclaimers.

## Pendientes Priorizados
### P0 (Critico)
- [ ] Mover secretos fuera de defaults inseguros (ej. `Jwt:Key` por defecto en [backend/appsettings.json](backend/appsettings.json)).
- [ ] Agregar rate limiting para `POST /api/ai/chat` (hoy solo login tiene limiter).
- [ ] Definir politica de errores/transient faults para proveedor IA (retry/circuit-breaker).

### P1 (Alto)
- [ ] Integrar proveedor real de mercado (actualmente `Stub-demo`).
- [ ] E2E de happy path completo (signup -> copilot) en CI.
- [ ] Pruebas unitarias de servicios: Auth, Compliance, UserPlan, UserStocks, AiChat.
- [ ] Hardening de validaciones de payload y longitud de mensaje IA.
- [ ] Revisar entidad `watchlist_items` legacy para converger en modelo user-scoped.

### P2 (Medio)
- [ ] Telemetria funcional (latencias por endpoint, tasa de error IA, trazas por request id).
- [ ] Mejorar UX de copilot (persistencia de historial por usuario, estados de carga mas granulares).
- [ ] Mejorar smoke test con chequeos de ids requeridos por JS de pagina.

### P3 (Mejora Continua)
- [ ] Documentar contrato OpenAPI/Swagger para endpoints.
- [ ] Pipeline CI con lint/build/test/smoke-routes.
- [ ] Estrategia de versionado de API y migraciones.

## Convenciones Para No Romper El Frontend
1. Mantener `../css/main.css` y `../js/navigation.js` en todas las vistas de [src/html](src/html).
2. No renombrar archivos de rutas existentes (`dashboard.html`, `copilot.html`, `my-stocks.html`, etc.) sin actualizar [src/js/navigation.js](src/js/navigation.js).
3. No eliminar IDs usados por JS de pagina.
   - Dashboard depende de ids como `termsModal`, `planModal`, `save-plan-btn`, `user-plan-badge`.
   - Copilot depende de `chat-messages`, `market-summary-panel`, `prompt-templates`, `copilot-stocks-context`.
4. Mantener orden de scripts cuando haya dependencias:
   1. librerias externas (Bootstrap bundle)
   2. componentes reutilizables (ej. `info-tip.js`)
   3. script de pagina (ej. `copilot.js`)
   4. `navigation.js`
5. Evitar cambiar texto de anchors del navbar/footer sin validar mapeos de [src/js/navigation.js](src/js/navigation.js), porque la navegacion se resuelve por texto.
6. Cualquier cambio en vistas debe pasar smoke de rutas:

```bash
./scripts/smoke-routes.sh
```

7. Si se agregan scripts por vista, mantenerlos en [src/js/pages](src/js/pages) (no volver a logica inline).

## Estado General
MVP funcional de onboarding y copilot con backend real para auth/compliance/plan/stocks/ia, y datos de mercado en modo demo. El siguiente salto de valor esta en seguridad operativa + data market real + automatizacion de pruebas/CI.
