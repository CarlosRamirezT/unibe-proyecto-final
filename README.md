# unibe-proyecto-final

Base inicial estatica del proyecto de trading con IA.

## Estructura actual

```text
.
├── index.html
├── figma-design/
└── src/
	├── assets/
	│   └── images/
	├── css/
	│   └── main.css
	├── js/
	│   └── navigation.js
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
- Enlaces del navbar y CTAs principales resueltos por mapeo de texto.
- Todas las vistas cargan `../css/main.css` y `../js/navigation.js`.

## Ejecucion local

Usa cualquier servidor estatico desde la raiz del proyecto.

Ejemplo con Python:

```bash
python3 -m http.server 5500
```

Luego abre `http://localhost:5500/`.
