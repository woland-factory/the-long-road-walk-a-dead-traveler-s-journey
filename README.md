# The Long Road

Walk a real historic journey mile for mile, and earn the traveler's own diary
as you go. Each day you log the miles you actually walked. When your total
reaches a milepost on the route, the app hands you what the traveler wrote at
that spot, keyed to the ground you reached. This is a deliberate daily
check-in, not background step tracking, so you enter your miles by hand.

This repository ships the check-in loop and the first real journey: John Muir's
1867 walk to the Gulf. A single Trail screen, local persistence, and the
verified Muir diary keyed to the miles you reach. The double journal lays each
earned entry beside your own line for that milepost, prints as a facing-page
keepsake through the browser's print dialog, and travels with you as a single
JSON backup file you can save and restore on any device.

## First run

The first time you open the app, a Start screen tells you what it is and that it
asks for a short daily check-in, then lets you choose a journey. Choosing one
creates your local record and drops you on the Trail. A short guided path points
at the check-in and walks you to your first entry, either by crossing the first
milepost or previewing it on the next-milepost card. You can skip it at any
step, and it never shows again once you have logged a walk.

## Adding miles from a file

Besides typing your miles, you can add them from a file. Two formats are read,
both parsed entirely on your device with nothing sent anywhere:

- A `date,miles` CSV, one row per day, like `2026-06-01,3.5`.
- An Apple Health `export.xml` (walking and running distance). Unzip the
  `export.zip` the Health app gives you and choose the `export.xml` inside.

Before anything changes, the app shows a preview: how many days it will add and
why it left any out. It never counts a day you already logged twice, never
accepts a day above 200 miles or dated in the future, and re-importing the same
file adds nothing. Miles that cross a milepost earn the traveler's words exactly
like typed miles do.

## The journeys

The first journey is John Muir's *A Thousand-Mile Walk to the Gulf*, his 1867
walk from Kentucky to the Gulf coast of Florida. The diary text comes from
[Project Gutenberg ebook #60749](https://www.gutenberg.org/files/60749/60749-0.txt),
which is in the public domain. The words you earn at each milepost are Muir's
own, verbatim. We frame them, and we never edit them. Muir wrote in 1867 and
carries the views and language of his time, so the app shows a short framing
note beside the diary.

Packs live in `web/src/packs/`. Each pack is a JSON file plus a typed re-export,
validated against its committed public-domain source. The schema and its rules
are documented in [`web/src/packs/SCHEMA.md`](web/src/packs/SCHEMA.md); the
source text a pack is verified against lives in `web/src/packs/sources/` and is
read only by the tests.

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
  packs/             journey pack schema, the registry, the Muir pack, validators
  state/             IndexedDB storage, migrations, odometer logic, backup file
  firstrun/          the Start screen, the journey picker, the guided walkthrough
  importer/          the CSV and Apple Health parsers, the merge plan, the import view
  trail/             the Trail screen and its parts
  journal/           the double journal, print styles hook-in, backup controls
  lib/               small shared helpers (reading a chosen file as text)
  observability/     Sentry and Umami wiring
web/e2e/             Playwright end-to-end tests
Dockerfile           multi-stage build, nginx serve
docker-compose.staging.yml
```

## Run the tests

```bash
cd web
npm run typecheck      # TypeScript, strict
npm test               # Vitest unit and component tests
npm run validate:packs # validate every journey pack against its source
npm run test:e2e       # Playwright end-to-end tests
```

`npm test` and `npm run validate:packs` are the build gate for packs. They fail
if any milepost's diary text is not verbatim against its committed source, if a
pack breaks the schema, or if the ordering or spread rules are violated. Note
that `npm run build` does not run the tests, so run the commands above to prove
a pack.

The end-to-end suite starts its own preview server on a random port and needs
no external services. Each unit run uses a fresh in-memory database, so tests
never share state between runs.

## Security note

The app keeps all state locally in the browser (IndexedDB). It has no accounts,
no server-side data, and no application API beyond serving static files and the
`/healthz` check. There are no login or mutation endpoints, so server-side
authorization and rate limiting do not apply here. Input from the mile field
and from a chosen backup file is validated in the browser before it changes
any stored state.

## License

MIT. See [LICENSE](LICENSE).
