# unibe-proyecto-final

Base inicial estatica del proyecto de trading con IA.

## Estructura actual

```text
.
├── index.html
├── figma-design/
├── scripts/
	└── smoke-routes.sh
└── src/
	├── assets/
	│   └── images/
	├── css/
	│   └── main.css
	├── js/
	│   ├── navigation.js
	│   └── pages/
	│       ├── index.js
	│       ├── markets.js
	│       ├── brokers.js
	│       ├── login.js
	│       ├── signup.js
	│       ├── pricing.js
	│       ├── dashboard.js
	│       └── copilot.js
	└── html/
		├── index.html
		├── markets.html
		├── news.html
		├── forum.html
		├── signup.html
		├── courses.html
		├── pricing.html
		├── qa.html
		├── brokers.html
		├── login.html
		├── dashboard.html
		└── copilot.html
```

## Mapa de vistas

- Landing: `src/html/index.html`
- Stock Markets: `src/html/markets.html`
- News: `src/html/news.html`
- Forum: `src/html/forum.html`
- Signup: `src/html/signup.html`
- E-learning: `src/html/courses.html`
- Plans & Pricing: `src/html/pricing.html`
- Q&A: `src/html/qa.html`
- Brokers: `src/html/brokers.html`
- Login: `src/html/login.html`
- Start Trading: `src/html/dashboard.html`
- Trading Copilot: `src/html/copilot.html`

## Navegacion

- Navegacion global centralizada en `src/js/navigation.js`.
- Enlaces del navbar, CTAs y enlaces utility/footer resueltos por mapeo de texto.
- Todas las vistas cargan `../css/main.css` y `../js/navigation.js`.

## Scripts por vista

- Se extrajo la logica inline a archivos dedicados en `src/js/pages/`.
- Vistas con script de pagina: landing, markets, brokers, login, signup, pricing, dashboard y copilot.
- Esto deja las vistas HTML mas limpias y facilita la migracion posterior a React.

## Ejecucion local

Usa cualquier servidor estatico desde la raiz del proyecto.

Ejemplo con Python:

```bash
python3 -m http.server 5500
```

Luego abre `http://localhost:5500/`.

## Smoke Test

Valida rapidamente consistencia de rutas internas y assets de las vistas estaticas.

```bash
./scripts/smoke-routes.sh
```

## Configuracion OpenAI (Docker)

Si aparece el error "OpenAI API key is not configured.", configura la variable de entorno del backend:

1. Copia `.env.example` a `.env` en la raiz del proyecto.
2. Edita `.env` y coloca tu key real:

```env
OPENAI_API_KEY=sk-...
```

3. Reinicia el backend para que tome la variable:

```bash
docker compose up -d --build backend
```

Nota: en `docker-compose.yml` el backend ya mapea esta variable con `Ai__OpenAiApiKey: ${OPENAI_API_KEY:-}`.

## Build y Docker en Windows

Comandos recomendados en Windows PowerShell (desde la raiz del repo):

1. Build del backend (.NET):

```powershell
cd backend
dotnet build
cd ..
```

2. Levantar/reconstruir contenedores:

```powershell
docker compose up -d --build --force-recreate
```

Importante:
- `--force-build` no es un flag valido de `docker compose up`.
- El flag correcto para forzar recompilacion de imagenes es `--build`.
- El flag correcto para forzar recreacion de contenedores es `--force-recreate`.

Opcional (si quieres bajar todo antes de volver a levantar):

```powershell
docker compose down
docker compose up -d --build --force-recreate
```
