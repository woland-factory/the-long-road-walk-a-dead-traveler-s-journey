# The Long Road

Walk a real historic journey mile for mile, and earn the traveler's own diary
as you go. Each day you log the miles you actually walked. When your total
reaches a milepost on the route, the app hands you what the traveler wrote at
that spot, keyed to the ground you reached. This is a deliberate daily
check-in, not background step tracking, so you enter your miles by hand.

This repository is the foundation: a single Trail screen with the check-in
loop, local persistence, and a placeholder fixture route. Real journeys and the
keepsake journal arrive in later work.

## Run it locally

The app is a static single-page app built with React, Vite, and TypeScript. It
lives in the `web/` directory.

```bash
cd web
npm ci
npm run dev
```

Then open the URL Vite prints (http://localhost:5173 by default).

To build the production assets:

```bash
cd web
npm run build     # outputs web/dist
npm run preview   # serves the built assets locally
```

## Run it with Docker

The container builds the SPA and serves it with nginx. It also answers
`GET /healthz` with `ok`.

```bash
docker compose -f docker-compose.staging.yml up --build
```

Runtime configuration reaches the browser through `/config.js`, which the
container regenerates from its environment at startup. Nothing sensitive is
baked into the built bundle. See `.env.example` for the four variables:

- `SEED_DEMO` loads a small demo walker on an empty database so the screen
  shows real value on first open.
- `SENTRY_DSN` turns on error tracking when set.
- `UMAMI_URL` and `UMAMI_WEBSITE_ID` turn on privacy-friendly analytics when
  both are set.

## Where the code lives

```
web/src/
  env.ts             runtime config reader
  packs/             journey pack types and the fixture pack
  state/             IndexedDB storage, migrations, odometer logic
  trail/             the Trail screen and its parts
  observability/     Sentry and Umami wiring
web/e2e/             Playwright end-to-end tests
Dockerfile           multi-stage build, nginx serve
docker-compose.staging.yml
```

## Run the tests

```bash
cd web
npm run typecheck   # TypeScript, strict
npm test            # Vitest unit and component tests
npm run test:e2e    # Playwright end-to-end tests
```

The end-to-end suite starts its own preview server on a random port and needs
no external services. Each unit run uses a fresh in-memory database, so tests
never share state between runs.

## Security note

The app keeps all state locally in the browser (IndexedDB). It has no accounts,
no server-side data, and no application API beyond serving static files and the
`/healthz` check. There are no login or mutation endpoints, so server-side
authorization and rate limiting do not apply here. Input from the one mile
field is validated in the browser before it changes any stored state.

## License

MIT. See [LICENSE](LICENSE).
