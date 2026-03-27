# Static Phase Task Board

## Core Structure
- [x] Create base src structure (html, css, js, assets/images)
- [x] Add landing entry point at root (`index.html`) redirecting to static app
- [x] Add shared stylesheet (`src/css/main.css`)
- [x] Add shared navigation runtime (`src/js/navigation.js`)

## Tasks by View/Feature
- [x] Landing page -> `src/html/index.html`
- [x] Stock Markets -> `src/html/markets.html`
- [x] News -> `src/html/news.html`
- [x] Forum -> `src/html/forum.html`
- [x] Signup -> `src/html/signup.html`
- [x] E-learning -> `src/html/courses.html`
- [x] Plans & Pricing -> `src/html/pricing.html`
- [x] Q&A -> `src/html/qa.html`
- [x] Brokers -> `src/html/brokers.html`
- [x] Login -> `src/html/login.html`
- [x] Start Trading -> `src/html/dashboard.html`
- [x] Trading Copilot -> `src/html/copilot.html`

## Routing
- [x] Wire navbar links to real HTML views
- [x] Wire major CTA buttons to destination views
- [x] Keep active nav state highlighted per current page

## Pending For Next Iteration
- [x] Extract per-page inline scripts into dedicated files under `src/js/pages/`
- [x] Normalize all footer and utility links (currently many remain placeholders)
- [ ] Download remote images into `src/assets/images/` and replace external URLs
- [ ] Add responsive nav menu behavior for mobile
- [ ] Add lightweight smoke test for internal route consistency
