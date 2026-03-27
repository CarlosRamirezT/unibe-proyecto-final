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
