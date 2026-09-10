# EPIC SPEC — Foundation, the check-in loop, and the staging scaffold

*The Long Road: walk a dead traveler's journey, mile for mile, diary for diary.*

## Quality differentiator (this app must win here)

**The substance of the payoff.** Every rival virtual-journey product rewards
distance with medals, points, or cartoon scenery. This app rewards distance
with a real dead person's actual words, verbatim, keyed to the exact ground you
reached, and it withholds tomorrow's entry until your feet earn it.

**What that demands of THIS epic.** EPIC 1 ships no real diary content (that is
EPIC 2) and no unlock ceremony (that is EPIC 3). But it builds the *mechanism*
that the whole product turns on: an odometer that advances only from logged
miles, a milepost that is unreadable until the odometer crosses it, and text
that appears the moment it is earned. That withhold-then-reveal machinery must
be correct here, with placeholder fixture text, because EPICs 2 and 3 pour real
verbatim words into exactly this loop. If the loop lets a walker see a milepost
before reaching it, or fails to reveal it on crossing, the differentiator is
broken at the foundation. Build the mechanism as if the words were already real.

---

## 1. Scope

### In scope
- A React + Vite + TypeScript single-page app, mobile-first, that builds to
  static assets.
- One screen: **Trail** (the home/check-in screen). It shows a cumulative
  odometer, a ten-second check-in (type miles), progress toward the next
  milepost, and the mileposts already reached with their fixture text shown
  inline.
- A tiny **built-in fixture pack** (2 or 3 mileposts) so the loop is testable
  end to end without any real content.
- **Local persistence** of walker state (miles logged, cumulative total,
  mileposts reached) that survives a page reload, in IndexedDB, behind a small
  storage module the later EPICs extend.
- The **withhold-then-reveal mechanism**: a milepost's text is not rendered
  until `cumulativeMiles >= milepost.mileMark`; on crossing, it is revealed.
- **Designed empty, loading, and error states** on the Trail.
- A **`SEED_DEMO` env flag** that, when set, seeds a walker whose logged miles
  have already crossed at least one fixture milepost, so a stranger sees an
  earned (fixture) entry within a minute with no hand-crafted input.
- **Deploy scaffold**: a `Dockerfile` and a `docker-compose.staging.yml` that
  build the SPA, serve it, and answer `/healthz`.
- **Runtime env injection** so `SEED_DEMO`, `SENTRY_DSN`, `UMAMI_URL`, and
  `UMAMI_WEBSITE_ID` reach the client at container start without being baked
  into the bundle.
- **Frontend observability**: Sentry (GlitchTip-compatible) and Umami wired,
  active only when their env values are present.
- A **`README.md` skeleton** for strangers (what it is, how to run, where code
  lives).

### Out of scope (Non-goals — binding, do not build)
- **No real journey content.** The only pack is the throwaway fixture. Do not
  add Muir, Lewis & Clark, or any real diary text (EPIC 2).
- **No unlock ceremony / Arrival screen.** No dedicated dramatic reveal screen,
  no facing-line composition field. Reached fixture mileposts are shown inline
  on the Trail as plain reached items (EPIC 3 owns the ceremony).
- **No Journal screen and no journal export** (EPIC 4).
- **No onboarding walkthrough, no Start/journey-picker screen, no
  health-export import** (EPIC 5).
- No accounts, no server-side state, no runtime LLM, no BYOK surface, no map
  polyline rendering, no unit switching (fixed to miles this EPIC), no
  km/mi toggle, no multi-voice rendering.

### Reconciling `SEED_DEMO` with the non-goals
The planner's `SEED_DEMO` criterion speaks of "an earned entry and a populated
journal." EPIC 1 has neither the Arrival ceremony nor the Journal screen (both
are non-goals owned by later EPICs). The consistent, non-drifting reading: in
EPIC 1, `SEED_DEMO` seeds miles past a fixture milepost so that on first load a
stranger sees the odometer already advanced and at least one fixture milepost
already **reached, with its fixture text revealed inline on the Trail** (not a
blank first-run screen). This honors the flag's mechanism and its "within a
minute, no hand-crafted input" intent at EPIC 1's fixture fidelity. The
ceremony and the real journal arrive in EPICs 3 and 4 and will reuse the same
seeded state. Do not build a Journal or Arrival screen to satisfy this.

---

## 2. Technical design

### 2.1 Stack and layout
- React 18, Vite 5, TypeScript (strict). Package manager: npm (`package-lock.json`
  committed so `npm ci` is reproducible in Docker).
- Vitest + React Testing Library (jsdom) for unit/component tests;
  `fake-indexeddb` for storage tests; Playwright for the browser-level
  reload/viewport/healthz checks.
- Suggested source layout (implementer may adjust names, keep the separation):
  ```
  src/
    main.tsx                 # bootstrap: read runtime env, init observability, render
    App.tsx                  # app shell, mounts Trail
    env.ts                   # reads window.__ENV__ with typed getters + safe defaults
    observability/
      sentry.ts              # init Sentry only if SENTRY_DSN present
      umami.ts               # inject Umami script only if URL + website id present
    packs/
      fixturePack.ts         # the 2-3 milepost fixture JourneyPack
      types.ts               # JourneyPack / Milepost types (subset used this EPIC)
    state/
      types.ts               # WalkerState types + schemaVersion
      store.ts               # IndexedDB-backed load/save + forward-only migrations
      odometer.ts            # pure functions: add miles, compute cumulative + reached
    trail/
      Trail.tsx              # the Trail screen
      CheckIn.tsx            # mile input + validation + submit
      Odometer.tsx           # cumulative display
      NextMilepost.tsx       # distance-to-next
      ReachedList.tsx        # reached mileposts with revealed fixture text
      states.tsx             # Empty / Loading / Error presentational components
    styles/                  # mobile-first CSS (CSS modules or plain CSS)
  public/
    config.js                # dev default runtime config (empty values)
  index.html                 # references /config.js before the module bundle
  ```

### 2.2 Runtime env injection (no secrets in the bundle)
The SPA is served as static files, so env must reach the client at container
start, not build time.

- `index.html` includes `<script src="/config.js"></script>` **before** the app
  module script.
- `public/config.js` (committed) is the dev default, all values empty/false:
  ```js
  window.__ENV__ = { SEED_DEMO: "false", SENTRY_DSN: "", UMAMI_URL: "", UMAMI_WEBSITE_ID: "" };
  ```
- In the Docker image, `docker-entrypoint.sh` regenerates `config.js` from the
  container's environment at startup, then execs nginx. The bundle itself
  contains no DSN, no website id, no seed flag.
- `src/env.ts` reads `window.__ENV__` with typed getters and safe fallbacks so
  the app never crashes when `config.js` is missing or partial.

Note: `SENTRY_DSN` and `UMAMI_WEBSITE_ID` are public client identifiers, not
secrets; injecting them at runtime keeps the built bundle environment-agnostic
and satisfies "wired via env." There are no true secrets in this EPIC.

### 2.3 Data model (forward-only migrations)
Local state lives in IndexedDB under a single record keyed `walkerState`.
Establish a versioned schema now so later EPICs add fields by migration, never
by breaking reads.

```ts
// state/types.ts
interface WalkerStateV1 {
  schemaVersion: 1;
  activePackId: string;          // the fixture pack id this EPIC
  createdAt: string;             // ISO timestamp of first load
  dailyLog: { date: string; miles: number }[];  // source of truth; date = YYYY-MM-DD
  cumulativeMiles: number;       // derived from dailyLog, stored for O(1) reads
  reachedMilepostIds: string[];  // derived: mileposts with mileMark <= cumulativeMiles
}
type WalkerState = WalkerStateV1;  // union grows in later EPICs
```

- `store.ts` exposes `loadState(): Promise<WalkerState | null>`,
  `saveState(s: WalkerState): Promise<void>`, and a `migrate(raw): WalkerState`
  step run on load. `migrate` switches on `schemaVersion`; unknown/absent
  version returns `null` (treated as fresh) rather than throwing. This is the
  forward-only seam: EPIC 4 (personalLog, export) and EPIC 3
  (per-milepost reveal) extend the union and add `case` branches.
- `cumulativeMiles` and `reachedMilepostIds` are always recomputed from
  `dailyLog` on write via `odometer.ts`, so they can never drift from the
  source of truth.

### 2.4 Odometer logic (pure, unit-tested)
```ts
// odometer.ts
addMiles(state, milesToday, today): WalkerState
  // appends { date: today, miles } to dailyLog,
  // recomputes cumulativeMiles = sum(dailyLog.miles),
  // recomputes reachedMilepostIds from pack.mileposts where mileMark <= cumulativeMiles
newlyReached(before, after): string[]   // ids reached by this submit, for reveal
milesToNext(state, pack): number | null // distance to nearest unreached milepost, null if all reached
```
Keep these pure (no IndexedDB, no React) so they are cheap to test exhaustively.

### 2.5 Input validation (boundary)
The mile field is the only mutation input. Validate before it touches state:
- Parse as a number. Reject NaN, empty, negative, and zero.
- Reject values above a sane per-check-in cap (e.g. 200 miles) and reject more
  than one decimal place beyond hundredths.
- On invalid input, show a designed inline error and do not advance the
  odometer. On valid input, advance optimistically (feedback under 100ms; the
  IndexedDB write is async and does not block the UI update).

### 2.6 Fixture pack
A tiny, clearly-labeled fixture `JourneyPack` living in code (not a real pack
file). Small total so a demo crosses a milepost quickly. Example shape (fixture
text below is sample data, written to pass the copy sweep):

```ts
{
  id: "fixture-demo",
  title: "Fixture trail",
  traveler: "Sample traveler",
  totalMiles: 20,
  mileposts: [
    { id: "fx-1", mileMark: 5,  place: "The first ford",  approxNote: "near this ground",
      text: "We crossed the river at dawn. The water ran cold and clear." },
    { id: "fx-2", mileMark: 12, place: "The ridge camp",  approxNote: "near this ground",
      text: "We rested on the ridge and watched the valley fill with light." },
    { id: "fx-3", mileMark: 20, place: "The far meadow",  approxNote: "near this ground",
      text: "We reached the meadow by evening and made our fire." }
  ]
}
```
The fixture exists only to exercise the loop; EPIC 2 replaces it with the real
Muir pack loaded through the same types.

### 2.7 `SEED_DEMO` behavior
- On app init, if `env.SEED_DEMO` is truthy AND no walker state exists yet, seed
  a `WalkerState` whose `dailyLog` sums to a value past the first fixture
  milepost (e.g. 14 miles across two dated entries), then persist it. Result:
  first paint shows odometer at 14, mileposts `fx-1` and `fx-2` reached with
  their fixture text revealed inline, `fx-3` still withheld.
- If real state already exists, `SEED_DEMO` does nothing (never clobber a real
  walker). Seeding is idempotent.
- When `SEED_DEMO` is unset/false, a fresh visitor sees the designed empty
  Trail.

### 2.8 Server / deploy scaffold
- **Dockerfile** (multi-stage):
  - Stage `build`: `node:20-alpine`, `npm ci`, `npm run build` → `/app/dist`.
  - Stage `serve`: `nginx:alpine`, copy `dist` to the web root, copy
    `nginx.conf` and `docker-entrypoint.sh`. `ENTRYPOINT` runs the entrypoint
    (regenerate `config.js` from env, then `nginx -g 'daemon off;'`).
- **nginx.conf**:
  - `location = /healthz { return 200 'ok'; add_header Content-Type text/plain; }`
  - `location / { try_files $uri $uri/ /index.html; }` (SPA fallback)
  - `gzip on` for text assets (perceived speed).
  - Basic hardening headers: `X-Content-Type-Options: nosniff`,
    `Referrer-Policy: no-referrer`, no directory listing. (Keep it minimal; do
    not build a full CSP framework this EPIC.)
- **docker-compose.staging.yml**:
  - One `web` service built from the Dockerfile, publishing a port (e.g.
    `8080:80`).
  - `environment:` passes `SEED_DEMO`, `SENTRY_DSN`, `UMAMI_URL`,
    `UMAMI_WEBSITE_ID` through from the host env with safe defaults
    (`${SEED_DEMO:-false}` etc.).
  - A `healthcheck` hitting `/healthz`.
- **`.env.example`** listing `SEED_DEMO`, `SENTRY_DSN`, `UMAMI_URL`,
  `UMAMI_WEBSITE_ID` with placeholder/empty values and a one-line comment each.
  `.env` stays untracked (add to `.gitignore`).

### 2.9 Observability
- **Sentry** (`@sentry/react`): initialize in `observability/sentry.ts` only if
  `env.SENTRY_DSN` is non-empty. No-op otherwise. Do not log PII (there is no
  user identity anyway). Wire a top-level React error boundary that reports to
  Sentry and renders the designed error state.
- **Umami**: in `observability/umami.ts`, inject the Umami script tag pointing
  at `env.UMAMI_URL` with `data-website-id={env.UMAMI_WEBSITE_ID}` only when
  both are present. No custom event taxonomy required this EPIC; page-load
  tracking is enough.

### 2.10 API contracts
No application API. The only HTTP surfaces are:
- Static assets (SPA bundle, `/config.js`, fixture is in-bundle).
- `GET /healthz` → `200 text/plain "ok"`.
No auth endpoints and no mutation endpoints exist (local-first), so
rate-limiting and server-side authorization are not applicable this EPIC; note
this explicitly in the README/security section rather than inventing endpoints.

---

## 3. Ordered task list (each with acceptance criteria)

### T1 — Project scaffold and app shell
Set up Vite + React + TS (strict), npm scripts (`dev`, `build`, `preview`,
`test`, `test:e2e`, `lint`, `typecheck`), committed lockfile, `.gitignore`.
- **AC1.1** `npm ci && npm run build` produces a `dist/` with an `index.html`
  and hashed asset bundle.
- **AC1.2** `npm run typecheck` passes with `strict: true`.
- **AC1.3** `index.html` references `/config.js` before the app module.

### T2 — Runtime env + observability wiring
Implement `env.ts`, `public/config.js` default, `sentry.ts`, `umami.ts`.
- **AC2.1** With no env values set, the app renders normally and initializes
  neither Sentry nor Umami (no network calls to either).
- **AC2.2** With `SENTRY_DSN` present, Sentry initializes; with `UMAMI_URL` and
  `UMAMI_WEBSITE_ID` present, the Umami script tag is injected with the correct
  website id.
- **AC2.3** No DSN, website id, or seed value appears as a literal in the built
  JS bundle (they arrive only via `config.js` at runtime). Provable by grepping
  `dist/` after a build with those envs unset.

### T3 — Persistence layer (IndexedDB + migrations)
Implement `state/types.ts`, `state/store.ts` with `loadState`, `saveState`,
`migrate`.
- **AC3.1** `saveState` then `loadState` round-trips a `WalkerStateV1` exactly.
- **AC3.2** `loadState` on an empty database returns `null` without throwing.
- **AC3.3** A stored record with an unknown/absent `schemaVersion` is treated as
  fresh (`null`), never crashes the app.

### T4 — Odometer logic (pure)
Implement `odometer.ts` (`addMiles`, `newlyReached`, `milesToNext`).
- **AC4.1** Adding miles increases `cumulativeMiles` by the amount and appends a
  dated `dailyLog` entry.
- **AC4.2** `reachedMilepostIds` contains exactly the fixture mileposts whose
  `mileMark <= cumulativeMiles`, and never a milepost above the odometer.
- **AC4.3** `milesToNext` returns the distance to the nearest unreached
  milepost, and `null` once all are reached.

### T5 — Trail screen and the check-in loop
Build `Trail.tsx`, `CheckIn.tsx`, `Odometer.tsx`, `NextMilepost.tsx`,
`ReachedList.tsx`, wiring odometer → store.
- **AC5.1** Typing a valid mile figure and submitting advances the visible
  cumulative odometer immediately (perceived feedback under 100ms; UI updates
  before/independent of the async persist).
- **AC5.2** After a full page reload, the odometer, reached mileposts, and
  revealed fixture text are all still present (loaded from IndexedDB).
- **AC5.3** A milepost's fixture text is **not** present in the rendered DOM
  until the odometer reaches its `mileMark`; crossing it reveals the text. (The
  withhold-then-reveal mechanism.)
- **AC5.4** Invalid input (empty, non-numeric, negative, zero, above cap) shows
  a designed inline error and does not change the odometer.

### T6 — Designed states
Implement empty, loading, and error states (`states.tsx`) and a top-level error
boundary.
- **AC6.1** A fresh visitor (no state, `SEED_DEMO` off) sees an empty Trail with
  positive plain copy telling them what to do first (for example, "Log your
  first miles to begin"), never a blank region.
- **AC6.2** While IndexedDB is loading, a skeleton/spinner holds the layout
  steady; no white screen.
- **AC6.3** If state load or a render fails, the error boundary shows a designed
  message in the product's voice with a next step (for example, "Your trail
  paused. Reload to pick it up.") and no raw stack trace or error code reaches
  the user. Keep the copy positive and directive.

### T7 — `SEED_DEMO` seeding
Implement idempotent seeding gated on `env.SEED_DEMO` and absence of real state.
- **AC7.1** With `SEED_DEMO` truthy and no prior state, first load shows the
  odometer already past the first fixture milepost and at least one milepost
  reached with its fixture text revealed inline.
- **AC7.2** Seeding never overwrites existing real walker state.
- **AC7.3** With `SEED_DEMO` off, a fresh visitor sees the empty Trail (T6).

### T8 — Mobile-first layout and accessibility
Style the Trail mobile-first.
- **AC8.1** At a 390px-wide viewport there is no horizontal scroll; all content
  fits and is readable without zooming.
- **AC8.2** The check-in input and submit are comfortably tappable (~44px
  targets); the mile input has an associated `<label>`.
- **AC8.3** Visible focus states on all interactive elements; the check-in loop
  is fully operable by keyboard; headings are semantic and landmarks present;
  text/background contrast meets WCAG AA.

### T9 — Deploy scaffold
Add `Dockerfile`, `nginx.conf`, `docker-entrypoint.sh`,
`docker-compose.staging.yml`, `.env.example`, `.dockerignore`.
- **AC9.1** `docker compose -f docker-compose.staging.yml up --build` yields a
  reachable app on the published port serving the SPA.
- **AC9.2** `GET /healthz` returns HTTP 200 with body `ok`.
- **AC9.3** `docker-entrypoint.sh` regenerates `config.js` from container env at
  startup; setting `SEED_DEMO=true` in the compose environment makes the running
  container serve the seeded demo (T7) with no code rebuild.
- **AC9.4** The compose healthcheck reports healthy against `/healthz`.

### T10 — README skeleton
Write `README.md` for strangers.
- **AC10.1** States plainly, in two or three sentences, what the app is (walk a
  real historic journey and earn its diary; a deliberate daily check-in, not
  background tracking).
- **AC10.2** Gives exact commands to run locally (`npm ci`, `npm run dev`) and
  via Docker (`docker compose -f docker-compose.staging.yml up --build`),
  verified against the actual files, and documents the four env vars.
- **AC10.3** Says where the code lives and how to run the tests. Contains no
  factory internals (no agent names, task types, internal paths, or internal
  service jargon).

### T11 — Copy sweep (part of DONE)
Mechanically sweep every user-visible string added in this EPIC (Trail copy,
empty/loading/error states, README, fixture `place`/`text`, `.env.example`
comments).
- **AC11.1** No `—` or `–` and no `" - "` sentence-break in any user-visible
  string.
- **AC11.2** None of the banned LLM vocabulary (seamlessly, effortlessly,
  unlock as filler, elevate, empower, leverage, robust, dive in, etc.) appears
  in user-visible strings.
- **AC11.3** No negative empty-state phrasing ("You don't have", "No … yet",
  "Nothing here", "Unable to", "Something went wrong") in user-visible strings;
  empty and error copy is positive and directive.

---

## 4. Test plan (which automated test proves each criterion)

Every acceptance criterion below is proven by an automated test; the mapping is
explicit so a reviewer can trace each one.

### Unit / component (Vitest + RTL + fake-indexeddb)
- **odometer.test.ts** → AC4.1, AC4.2, AC4.3. Table-driven: add miles across
  the three fixture mileposts, assert cumulative, reached set (including that a
  milepost above the odometer is never reached), and `milesToNext` including the
  all-reached `null`.
- **store.test.ts** (fake-indexeddb) → AC3.1, AC3.2, AC3.3. Round-trip; empty
  DB returns null; unknown `schemaVersion` returns null.
- **env.test.ts** → AC2.1, AC2.2. Mock `window.__ENV__` variants; assert Sentry
  init and Umami injection are gated correctly and are no-ops when values are
  absent.
- **CheckIn.test.tsx** → AC5.1, AC5.4. Enter valid miles, assert odometer text
  updates synchronously; enter each invalid case, assert inline error shown and
  odometer unchanged.
- **Trail.test.tsx** → AC5.3, AC6.1, AC6.2, AC7.1, AC7.2, AC7.3. Assert fixture
  text is absent from the DOM before reaching a milepost and present after
  crossing; assert empty-state copy renders with no state; assert loading
  skeleton renders while the store promise is pending; assert seeded state (mock
  `SEED_DEMO=true`) shows a reached milepost with revealed text on mount and
  does not overwrite existing state.
- **errorBoundary.test.tsx** → AC6.3. Force a child to throw; assert the
  designed error UI renders (no stack trace string, includes a next step).
- **copy.test.ts** → AC11.1, AC11.2, AC11.3. Scan the source of user-visible
  strings (Trail components, states, fixture pack `place`/`text`, README,
  `.env.example`) for `—`/`–`/`" - "`, the banned vocabulary list, and the
  negative empty-state phrases; fail on any hit. This is the mechanical sweep as
  an automated gate.

### Browser end-to-end (Playwright, against `npm run preview` or the container)
- **persistence.e2e.ts** → AC5.2. Load app, submit miles, reload the page,
  assert odometer and revealed mileposts persist.
- **mobile.e2e.ts** → AC8.1, AC8.2, AC8.3. Set viewport to 390px; assert
  `document.scrollingElement.scrollWidth <= innerWidth` (no horizontal scroll);
  assert the submit/input bounding boxes are ≥ ~44px; drive the check-in via
  keyboard only; assert a visible focus indicator. Run an automated a11y check
  (axe) for contrast, labels, and landmarks.
- **healthz.e2e.ts / compose smoke** → AC9.1, AC9.2, AC9.4. Against the running
  container (or preview server plus the nginx healthz route), assert the SPA
  root serves HTML and `GET /healthz` returns 200 `ok`.

### Build / config assertions
- **bundle-no-secrets** check → AC2.3. After `npm run build` with envs unset,
  grep `dist/**/*.js` for a sentinel DSN/website-id string and assert absent.
- **typecheck + build** in CI → AC1.1, AC1.2.
- **entrypoint config generation** → AC9.3. A shell-level test (or a Playwright
  run against the container started with `SEED_DEMO=true`) asserts `/config.js`
  reflects the container env and the seeded demo is served without a rebuild.

### Manual/scripted verification allowed only where automation is impractical
The Docker compose bring-up (AC9.1–AC9.4) is validated by running
`docker compose -f docker-compose.staging.yml up --build` to completion and
curling `/healthz` and root; capture the result. Everything else is covered by
the automated suites above.

---

## 5. Definition of done
- All acceptance criteria T1–T11 pass via the mapped automated tests.
- `npm run typecheck`, `npm run lint`, `npm test`, and the Playwright e2e suite
  all pass.
- `docker compose -f docker-compose.staging.yml up --build` serves the app and a
  passing `/healthz`; `SEED_DEMO=true` shows the seeded fixture demo.
- The copy sweep (T11) passes with zero hits.
- `README.md` is accurate against the actual compose and npm commands and free
  of factory internals.
- No secrets in tracked files; `.env` untracked, `.env.example` placeholders
  only.
