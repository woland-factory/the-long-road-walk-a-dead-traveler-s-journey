# EPIC_SPEC: Polish (the whole product, held to the bar)

This is a **polish EPIC**: a UX, performance, and copy pass over the entire
delivered product against the QUALITY BAR and the quality differentiator. It
**tightens what exists and adds nothing.** No new features, no new packs, no
re-architecture. Every task below is *verify a real surface, lock the result
with a test, and fix only where the surface falls short of the bar.* A task
that would add a capability, a screen, a pack, or an abstraction is out of
scope by definition and is a defect against this spec.

---

## Quality differentiator (this app must win here)

The one dimension this product wins on: **the substance of the payoff.** Every
other virtual-journey product rewards distance with medals, points, postcards,
or cartoon scenery. This app rewards distance with a real dead person's actual
words, verbatim, keyed to the exact ground you reached, and withholds
tomorrow's entry until your feet earn it. We compete on the meaning of the
reward, not on gamification, breadth, or automation.

**What it demands of THIS polish pass:** the moment a stranger opens staging,
the earned verbatim entry and the withheld-until-earned mechanic must be
unmistakable, and the double journal must read as a keepsake, not a dashboard.
Polish here means protecting that payoff: the verbatim words render legibly
(single voice and multi-voice) on a phone and in print, the withholding is
visibly *a diary entry you have not walked to yet* rather than a score, and the
double journal shows a real facing pair. Speed and accessibility exist to keep
the words readable and reachable, never to decorate them. Nothing in this pass
may soften a `voices[].text`, add a medal/points/streak surface, or bury the
words under chrome.

---

## Scope

### In scope

A refinement pass over the already-shipped product: the Start screen and
journey picker, the guided first run, the Trail (odometer, check-in, next
milepost, reached rows), the Arrival ceremony (single and multi-voice), the
double Journal and its print layout, the Backup save/restore, the file
Importer, the two shipped packs' authored copy and framing notes, the staging
`SEED_DEMO` demo, and the README. The work is:

1. **Signature moment** made unmistakable on first load (staging `SEED_DEMO`).
2. **Performance** verified: fast first render, sub-100ms interaction feedback,
   and Trail + Journal that stay fast as months of daily entries accumulate.
3. **Mobile + accessibility** verified at 390px across every surface, with
   automated contrast/label/landmark/keyboard coverage extended to the surfaces
   that lack it today.
4. **Copy sweep** across every user-visible string and both packs' framing and
   authored notes, mechanized and read aloud.
5. **Designed states** reviewed on every empty, loading, and error surface.
6. **README** verified against the actual compose files.

### Out of scope (non-goals, binding)

- **No new features.** No new screen, control, view, setting, or capability.
  Every user action that exists today still exists, unchanged in kind.
- **No new packs** and no change to either pack's verbatim `voices[].text`,
  `place`, `date`, mile marks, dates, or verification behavior. The primary
  source stays byte-identical and unedited.
- **No re-architecture.** No new state shape, no migration, no new dependency,
  no framework, no design system, no refactor of modules the tasks below do not
  name. `web/src/state/types.ts` and the pack schema are frozen.
- No animations, theming, or micro-interactions beyond what the bar requires.
  Meeting the written bar is in scope; exceeding it is drift.
- No repointing of `SEED_DEMO`'s default pack (Muir stays the boot-gate and
  demo default).

If closing a bar gap appears to require a Non-Goal (a new state field, a schema
change, editing a voice), do **not** choose between the two: stop and report
`outcome: "blocked"` with the exact conflict.

---

## Technical design

### What this pass touches

There is **no server, no database, no runtime LLM, and no API.** The app is a
static React + Vite SPA that keeps all state locally in IndexedDB and bundles
each pack as JSON at build time. So "performance" and "security" here are
client-side facts, not endpoint behavior, and this pass changes **no data
model**: `web/src/state/types.ts`, `web/src/state/store.ts` migrations, and the
pack schema are all frozen.

The edits this pass may make are limited to:

- **Tests** (new and extended): the primary deliverable of a polish pass is
  proof. New/extended Vitest and Playwright specs that lock each criterion.
- **CSS** (`web/src/styles/app.css`): small, surgical fixes only where a real
  390px overflow, contrast miss, focus gap, or illegible multi-voice stack is
  found. No redesign, no new visual language.
- **Copy** (component strings, `web/src/copy.test.ts` sweep list and banned
  vocabulary, both pack JSON authored fields): fixes only where the sweep or a
  read-aloud finds a defect.
- **Demo data** (`web/src/state/seed.ts`): tune the seeded demo so the staging
  double journal shows a real facing pair. This is demo-content tuning, not a
  new feature or a schema change.
- **Small a11y attributes** on existing elements (e.g. an `aria-live` region,
  an explicit accessible name) where a real screen-reader gap is found.
- **README.md**: correctness fixes only.

### Files most likely in play

- `web/src/styles/app.css` — the single stylesheet (mobile-first base, one
  `min-width: 720px` layout query, `@media print`, `:focus-visible` ring, dark
  theme). Fix 390px overflow / contrast / multi-voice separation only if found.
- `web/src/state/seed.ts` — `buildSeededState`; add one seeded facing line
  (below) so the demo double journal is a filled pair.
- `web/src/copy.test.ts` — the mechanized sweep; extend the file list and the
  banned-vocabulary list to the full bar list if either is short.
- `web/src/packs/muir.json`, `web/src/packs/lewisclark.json` — authored fields
  only (`title`, `companion`, `framingNote`, every `approxNote`, every
  `approach`) if the sweep flags one. **Never** touch `voices[].text`.
- New e2e specs under `web/e2e/` and new/extended component tests under
  `web/src/` per the task list.
- `README.md` — verified against `docker-compose.staging.yml`, `Dockerfile`,
  `docker-entrypoint.sh`, and `web/package.json` scripts.

### Baseline the implementer inherits (do not rebuild these)

These already meet the bar; the tasks below **verify and lock** them, they do
not re-implement them:

- Designed empty/loading/error surfaces exist: `trail/states.tsx`
  (`EmptyState`, skeleton `LoadingState`, `ErrorState` with retry),
  `ErrorBoundary.tsx`, the Journal empty state, the Importer's choose/scanning/
  preview phases, and Backup notices. Loading is skeleton-based, never a blank
  screen or a dead spinner.
- Focus management is already strong: the Arrival is a full focus-trap dialog
  (`role="dialog"`, `aria-modal`, Escape saves + closes, focus restored to the
  trigger); the Journal and Importer move focus to their heading on open and
  close on Escape; the Trail restores focus to the control that opened a view.
- The check-in is optimistic: `logMiles` updates state synchronously before the
  async IndexedDB write, so the odometer and any Arrival appear immediately.
- A mechanized copy sweep already runs (`copy.test.ts` plus `muir.copy.test.ts`
  / `lewisclark.copy.test.ts`); this pass widens its coverage, it does not
  invent it.
- The diary source `.txt` files are read only by tests and are proven absent
  from `dist` by `bundle.e2e.ts`.

---

## Ordered task list

Each task states concrete, testable acceptance criteria (AC). "Verify" means
inspect the real surface and prove it with an automated test; "fix" means
correct only a proven shortfall against the bar.

### T1 — Signature moment on first load (differentiator + bar §4)

Prove that a stranger landing on staging (`SEED_DEMO=1`, Muir default) meets
the payoff within the first minute, and that the withholding and the double
journal read as the product, not as a game.

- **AC1.1** With `SEED_DEMO` on and an empty database, first load shows a
  populated Trail: the odometer with real miles, at least one reached-milepost
  row in "Mileposts reached", the next-milepost card, and a "Read your journal"
  affordance. Proven by an e2e that boots with `SEED_DEMO` on and asserts these
  are visible without any user input.
- **AC1.2 (earned words reachable)** From that first load, the earned verbatim
  entry is reachable in at most two taps: tapping a reached row opens the
  Arrival showing a `voices[].text` that is byte-identical to the seeded pack's
  earned milepost, and "Read your journal" opens the double journal showing that
  same earned entry. Proven by an e2e asserting the rendered text equals the
  pack voice for a reached milepost.
- **AC1.3 (withholding is legible and airtight)** The next (unearned) milepost's
  diary text is absent from the DOM on first load, while its `place` and its
  authored `approach` line are shown on the next-milepost card. An e2e asserts
  the withheld milepost's `voices[].text` string is nowhere in the page, and
  that its place + approach line are present. This confirms the withholding is
  *a diary entry not yet walked to*, shown as distance-to-the-next-words.
- **AC1.4 (not gamification)** No medal, badge, trophy, points, score, streak,
  or level surface exists anywhere in the product. A grep-style test over the
  rendered Trail/Journal/Arrival DOM and the component sources finds none of
  these. The existing next-milepost progress bar is retained and its accessible
  name states progress toward the next place/entry (it measures miles to the
  next words, not a score); confirm its `aria-label` names the destination
  place.
- **AC1.5 (double journal is a real pair)** `seed.ts` seeds one short walker
  facing line for the first reached milepost so the staging double journal shows
  a filled facing pair (traveler's verbatim entry beside the walker's own line),
  not a half-empty spread. The seeded line is authored copy: it passes the copy
  sweep (no dashes, no banned vocabulary, no negative phrasing) and reads as a
  real one-line walking note. An e2e asserts the seeded double journal shows both
  the traveler voice and the walker line for that milepost. This tunes demo
  content only; it adds no feature and no schema field (`personalLog` already
  exists).

### T2 — Performance verified (bar §1)

Prove fast first render, sub-100ms interaction feedback, and that the Trail and
Journal stay fast as daily entries accumulate over months.

- **AC2.1 (real content fast, never blank)** First meaningful render shows real
  content or a designed skeleton, never a blank page. The app fetches no pack or
  diary data at runtime (packs are bundled JSON; the source `.txt` is never
  imported by app code), so there is no network round-trip on the hot path. An
  e2e asserts that on first load the app shell (masthead heading) and either the
  seeded Trail or the designed empty/loading state are painted, and that no XHR/
  fetch for pack or diary data occurs.
- **AC2.2 (bundle stays lean)** The built client JS the browser must parse
  before first paint stays within a stated budget (assert the main entry
  chunk's gzipped size is under a fixed ceiling in a test, so a future accidental
  import of a large source file fails loudly). Keep the ceiling at roughly the
  current size plus headroom; the intent is a regression guard, not shrinking.
- **AC2.3 (interaction feedback under 100ms)** Logging miles updates the
  odometer synchronously in the same tick as submit (optimistic), before any
  async persistence. Proven by a component/e2e test that submits a mile value
  and asserts the odometer text updates without awaiting I/O, and that a crossing
  opens the Arrival immediately. Pressed/active feedback on the primary buttons
  is present.
- **AC2.4 (scales with months of walking)** Seed a walker with **several hundred
  daily log entries** (e.g. 400, one per day) and assert:
  - `recompute` and `buildJournal` complete quickly (well under a generous
    budget, e.g. a few milliseconds each) at that size.
  - The rendered Trail and Journal DOM node counts are bounded by the pack's
    **milepost count**, not by the number of daily entries: no surface renders
    one node per logged day. (The daily log is summed/scanned, never listed;
    `ReachedList` rows and `journal-spreads` are capped by reached mileposts.)
  This is the "no endpoint gets slower with every row" guarantee expressed for a
  local-first app: the hot paths are O(days) arithmetic and O(mileposts)
  rendering, and this test locks it.
- **AC2.5 (no unbounded or unindexed hot-path work)** Confirm no code path
  renders or sorts the full daily log per interaction. If `milesToNext` or a
  similar per-render scan is found to be a measurable cost at 400+ entries,
  memoize it; otherwise leave it. Do not optimize what the test above proves is
  already fast (that would be gold-plating).

### T3 — Mobile pass at 390px (bar §2, §7)

Every surface fully usable at a 390px viewport: no horizontal scroll, ~44px
touch targets, readable text. Extend the existing 390px coverage to the
surfaces that lack it.

- **AC3.1** Existing 390px coverage stays green: Start, Importer, Trail, and
  single-voice Arrival already assert no horizontal overflow and 44px+ tap
  targets in `mobile.e2e.ts`. Keep them passing.
- **AC3.2 (Journal at 390px)** Add a 390px e2e that opens the double Journal
  from a seeded/reached state and asserts: no horizontal scroll, the reading
  column wraps within the viewport, the back and "Print your journal" controls
  are 44px+ tap targets, and a spread's traveler side and walker side are both
  legible when stacked (below the 720px facing-page breakpoint they stack
  vertically).
- **AC3.3 (multi-voice Arrival at 390px)** Add a 390px e2e on the Lewis & Clark
  journey that reaches an early multi-voice milepost and asserts: no horizontal
  scroll, both voices render, each voice is visibly separated and attributed to
  its own keeper, and the reading column does not overflow. Fix `.arrival-voice`
  / `.spread-voice` separation only if two stacked voices are hard to tell apart;
  do not redesign.
- **AC3.4** The one layout breakpoint (`min-width: 720px`) and the print layout
  are unaffected by any 390px fix (assert the facing-page grid still applies
  above 720px).

### T4 — Accessibility pass (bar §6)

Contrast, visible focus, labeled inputs, semantic headings and landmarks, alt
text, and full keyboard reach across every surface. Extend automated coverage
beyond the Trail.

- **AC4.1 (automated audit on every surface)** Run the `axe-core` rule set
  already used on the Trail (`color-contrast`, `label`, `region`,
  `landmark-one-main`, `page-has-heading-one`) additionally on: the Start
  screen, the Importer (choose and preview phases), the Arrival dialog
  (single and multi-voice), and the double Journal. Each must return zero
  violations. Fix any violation found; do not suppress a rule.
- **AC4.2 (keyboard reach)** Every action a mouse can do is reachable by
  keyboard and the focus indicator is visible. The existing check-in keyboard
  test stays green; add keyboard-reach assertions for opening and closing the
  Journal (Escape returns to Trail and restores focus to the opener) and for
  advancing/closing the Arrival (the focus trap and Escape-to-save-and-close
  already exist; lock them).
- **AC4.3 (every input has an accessible name)** The mile input, the Arrival
  facing-line textarea, and every file input (Start restore, Backup restore,
  Importer) have a programmatic accessible name. Where an input relies only on a
  wrapping label's visible text, that is acceptable if axe's `label` rule passes;
  if any input lacks a name, add one. Confirm via the axe `label` rule on each
  surface (AC4.1).
- **AC4.4 (semantic structure)** Each screen has exactly one `<h1>` and uses
  real headings and landmarks (`<main>`, section `aria-label`s). Reached rows,
  journal spreads, and voices are programmatically attributed (place headings,
  per-voice author `<footer>`). Alt text: there are no meaningful `<img>`
  elements in the product (verify none was added); if any decorative glyph or
  separator conveys meaning, give it a text equivalent.
- **AC4.5 (milestone announced to screen readers)** Verify a screen-reader user
  gets feedback when a check-in crosses a milepost (the Arrival dialog opens and
  takes focus, which announces). For a check-in that does *not* cross a
  milepost, if review finds the new total changes silently, add a polite
  `aria-live` announcement of the updated cumulative miles on the odometer
  region. This is a bounded a11y attribute on an existing element, not a new
  feature; add it only if the silent-update gap is real.

### T5 — Designed states reviewed (bar §3)

Every empty, loading, and error surface is a designed surface with product-voice
copy and a way forward. Review each and lock it.

- **AC5.1 (empty states)** Verify and lock with tests: the Trail empty state
  ("Your road starts here") tells a first-time user what the screen is for and
  what to do; the Journal empty state ("Your journal fills as you walk...")
  does the same; the Importer's zero-adds preview ("These miles are already on
  your trail.") is positively framed. None is a blank region.
- **AC5.2 (loading states)** The boot/Trail loading state is a skeleton that
  holds the layout; the Importer scan shows in-place progress with a Cancel. No
  white screen, no dead spinner. Lock with tests. Review the Backup restore
  path: it reads a file synchronously-ish and shows a result notice; if a
  user-perceptible delay exists with no feedback, add an in-place pending state
  (only if the delay is real).
- **AC5.3 (error states)** Verify every error surface speaks in the product's
  voice with a next step and never shows a raw stack trace or code: the Trail
  `ErrorState` ("Your trail paused. Reload to pick it up...") with a retry
  button, the `ErrorBoundary` reusing it, the check-in field errors (concrete
  guidance like "Enter miles as a positive number."), the Backup restore errors
  ("Choose the .json backup this app saved..."), and the Importer validation
  errors. Lock each with a test. Confirm none matches the banned negative
  phrasing.

### T6 — Copy sweep across every string and both packs (bar §8, §7)

Mechanize and read-aloud sweep every user-visible string and both packs'
authored/framing copy. No em-dashes or dash-asides, no banned LLM vocabulary,
no negative empty-state phrasing.

- **AC6.1 (sweep coverage is complete)** `copy.test.ts` sweeps every source file
  that carries a user-visible string. Audit its `FILES` list against the actual
  components and confirm nothing with visible copy is missing (e.g. every file
  under `trail/`, `firstrun/`, `importer/`, `journal/`, plus `index.html`,
  `README.md`, `.env.example`). Add any missing file. Both packs' authored fields
  are swept by `muir.copy.test.ts` / `lewisclark.copy.test.ts` (title, companion,
  framingNote, every approxNote, every approach); confirm those cover every
  authored field and extend if one is missing.
- **AC6.2 (banned list matches the bar)** The banned-vocabulary list in the
  sweeps covers the full bar list: seamlessly, effortlessly, unlock, elevate,
  empower, leverage, robust, dive in, "in today's fast-paced world", "we've got
  you covered", and close kin. Widen the list where it is narrower than the bar
  (e.g. bare "unlock", "elevate", "empower" as whole words), keeping false
  positives out of primary-source-exempt text.
- **AC6.3 (dashes and negatives)** The sweeps assert no "—", no "–", and no
  " - " sentence break in any swept string, and none of the negative empty-state
  phrasings ("You don't have", "No ... yet", "Nothing ... here", "Unable to",
  "Something went wrong"). These already pass; keep them green after any copy
  edit.
- **AC6.4 (Importer strings read as guidance, not negation)** Review the
  Importer's validation and skip-line copy by hand: "This does not look like a
  date,miles CSV..." and "...were left out." are concrete and tell the user what
  to do, so they clear the bar; confirm each states the next step. Rewrite only a
  string that reads as a dead end. Do not manufacture churn.
- **AC6.5 (primary source is exempt and untouched)** `voices[].text`, `place`,
  and `date` are verbatim/factual and are **never** swept or edited; the keepers'
  1867/1804 spelling, punctuation, and em-dashes stay exactly as in the source.
  Confirm the pack copy tests keep this exemption explicit.
- **AC6.6 (read aloud)** Read every string touched in this pass aloud; if one
  sounds like marketing filler or a chatbot, rewrite it plainer. This is part of
  DONE for any copy edit.

### T7 — README verified against the real compose files (bar §9)

A stranger can understand, run, and contribute, with no factory internals, and
every command is correct against the actual files.

- **AC7.1 (understand)** The opening explains in plain language what the app is
  and why it exists: walk a real historic journey, earn the traveler's verbatim
  diary at each milepost, a deliberate daily check-in. Present and clear.
- **AC7.2 (run, verified)** Every command in the README matches the real files:
  local dev (`cd web && npm ci && npm run dev`), build (`npm run build` →
  `web/dist`), preview, and Docker
  (`docker compose -f docker-compose.staging.yml up --build`, serving the SPA via
  nginx and answering `GET /healthz`). Cross-check the four env vars
  (`SEED_DEMO`, `SENTRY_DSN`, `UMAMI_URL`, `UMAMI_WEBSITE_ID`) against
  `.env.example` and `docker-entrypoint.sh`. Fix any drift. The `copy.test.ts`
  sweep already covers `README.md`; keep it green.
- **AC7.3 (contribute)** The README states where the code lives (the `web/src`
  module map) and how to run the tests (`typecheck`, `test`, `validate:packs`,
  `test:e2e`) matching `web/package.json` scripts.
- **AC7.4 (no factory internals)** No mention of the App Factory, its paths,
  agents, task types, or internal services. Confirm the README reads as written
  for the world.

### T8 — Full suite green

- **AC8.1** `npm run typecheck`, `npm test`, `npm run validate:packs`, and the
  Playwright e2e suite (`npm run test:e2e` / `scripts/e2e.sh`) all pass,
  including every new and extended spec above and every pre-existing test
  unchanged in intent. No test is weakened to pass; a red verbatim/verify test
  means fix the data or the code, never the test.

---

## Test plan (each planner acceptance criterion, proven)

| Planner acceptance criterion | Proven by |
| --- | --- |
| Signature moment lands: earned verbatim entry reachable within the first minute on staging via `SEED_DEMO`; withholding and double journal are unmistakably the product, not gamification | T1 (AC1.1 populated first load, AC1.2 earned words reachable in ≤2 taps and byte-identical, AC1.3 withheld text absent while place+approach shown, AC1.4 no medal/points/streak surface + progress bar names the next place, AC1.5 double journal shows a filled facing pair) |
| Performance verified: first meaningful render under ~1s, interaction feedback under 100ms, journal and trail fast at hundreds of entries, no unbounded/unindexed work | T2 (AC2.1 real content, no runtime pack/diary fetch; AC2.2 bundle-size guard; AC2.3 optimistic sub-tick odometer update; AC2.4 400-entry recompute/buildJournal fast and DOM bounded by mileposts; AC2.5 no per-render full-log scan) |
| Full mobile pass at 390px; accessibility pass (contrast, focus, labeled inputs, semantic headings/landmarks, alt text, full keyboard reach) | T3 (390px on Start/Importer/Trail/Arrival kept green + Journal and multi-voice Arrival added) + T4 (axe on Start/Importer/Arrival/Journal, keyboard reach on Journal+Arrival, accessible names, one-`h1`/landmarks, milestone announcement) |
| Copy sweep across every user-visible string and every shipped pack framing note: no em-dashes/dash-asides, no banned vocabulary, no negative empty-state phrasing; every string reads as written by a person | T6 (AC6.1 complete sweep coverage incl. both packs' framing/authored fields, AC6.2 banned list matches the bar, AC6.3 dashes+negatives, AC6.4 Importer strings reviewed, AC6.5 primary source exempt, AC6.6 read aloud) |
| Every empty, loading, and error state reviewed and designed | T5 (AC5.1 empty, AC5.2 loading/skeleton/progress, AC5.3 error states in product voice with a next step) |
| README complete and verified against the actual compose files: understand, run, contribute, no factory internals | T7 (AC7.1 understand, AC7.2 run commands cross-checked against compose/Dockerfile/entrypoint/package.json + env vars, AC7.3 contribute/tests, AC7.4 no factory internals) |

### Full command gate

`npm run typecheck`, `npm test`, `npm run validate:packs`, and the Playwright
e2e suite must all pass (T8). New specs: a `SEED_DEMO` signature-moment e2e, a
performance/scale test at ~400 daily entries, a Journal-at-390px e2e, a
multi-voice-Arrival-at-390px e2e (Lewis & Clark), extended `axe` coverage on
Start/Importer/Arrival/Journal, and the widened `copy.test.ts` sweep. Every
pre-existing test stays green; a red verbatim or verify test means fix the data,
never the test.

---

## Quality bar notes specific to this EPIC

- **The bar is the spec.** Meeting each clause above is in scope and needs no
  permission. Exceeding it is drift: no animations nobody asked for, no design
  system for a handful of screens, no optimization beyond what T2's tests prove
  is needed, no rewriting copy that already clears the sweep and reads well.
- **Protect the payoff.** Every change is judged against the differentiator: it
  must keep the verbatim words legible, reachable, and honestly withheld. A
  polish change that dilutes the words (softens a voice, buries the entry under
  chrome, turns the reward into a score) is a defect even if it "looks nicer".
- **Local-first security reality.** There are no accounts, no server data, and
  no mutation/auth endpoints, so the bar's server-side authorization and rate
  limiting do not apply; the applicable security facts are boundary validation
  of the mile field and of a chosen backup/import file (already present) and no
  secrets in the bundle (config arrives at runtime via `/config.js`). The README
  security note states this; verify it stays accurate. Do not invent endpoints
  to "add" auth or rate limiting; that would be a new feature and a Non-Goal.
- **Don't manufacture churn.** Where a surface already clears the bar, the task
  is to lock it with a test, not to restyle or reword it. The smallest change
  that proves and holds the bar is the correct change.

---

## Notes and assumptions

- **No blocking questions.** The scope is a refinement of a delivered product
  and every criterion above is provable against the existing surfaces; the run
  should proceed without a human gate.
- **`SEED_DEMO` default pack.** Staging seeds the Muir pack (first in the
  registry), which crosses its first two real mileposts, leaving the third
  withheld. T1 targets that default; do not repoint it. The single seeded facing
  line (AC1.5) is added to whichever pack the seed builds, keyed to the first
  reached milepost, and is swept copy.
- **Frozen contracts.** `web/src/state/types.ts`, the store migrations, the pack
  `SCHEMA.md` and validator, and both packs' verbatim text and verification are
  not changed by this pass. Any apparent need to change one is a blocking
  conflict, not a silent edit.
- **Deliverable of a polish pass is proof.** The bulk of the diff is tests that
  lock the bar; source/CSS/copy/README edits are surgical fixes to proven
  shortfalls only.
