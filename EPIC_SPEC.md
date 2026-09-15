# EPIC SPEC — The double journal and export / import (the durable artifact)

*The Long Road: walk a dead traveler's journey, mile for mile, diary for diary.*

## Quality differentiator (this app must win here)

**The substance of the payoff.** Every rival virtual-journey product rewards
distance with medals, points, postcards, or cartoon scenery. This app rewards
distance with a real dead person's actual words, verbatim, keyed to the exact
ground you reached, and it withholds tomorrow's entry until your feet earn it.
We compete on the meaning of the reward, not on gamification, breadth, or
automation.

**What that demands of THIS epic.** Earlier EPICs built the loop, poured in
Muir's verified words, and built the Arrival ceremony that hands over each
earned entry one at a time. This EPIC turns that stream of earned moments into
the thing the product exists to leave behind: the double journal, a facing-page
keepsake of the traveler's words beside the walker's own, and the export/import
that lets it survive a browser that clears its storage or a phone the walker
replaces. Two promises carry the differentiator here and both are provable.
First, the keepsake must be **earned-only and honest**: the journal, its print
output, and its data export contain the words the walker actually earned and
nothing they have not. An unreached milepost's verbatim text must never appear
in the journal, the print, or the exported file. Second, the keepsake must be
**genuinely ownable**: export writes the complete walker state to a single file
and import restores it losslessly on a fresh device, so a walker who stops for a
week or for good keeps every mile they walked and every word they earned (the
north star's exact promise). A keepsake you can lose to a cleared cache is not a
keepsake. This EPIC makes it durable.

---

## 1. Scope

### In scope
- **The Journal surface**: a dedicated full-viewport reading view, reachable
  from the Trail, that renders the walker's earned entries as a **double
  journal**. It reads in journey order, one facing-page spread per reached
  milepost: the traveler's verbatim entry (its dateline, place, and voices) set
  beside the walker's own facing line for that milepost and the real date they
  reached it. Correct from the first earned milepost onward, so a walker who
  stops at mile 120 owns exactly the spreads for every milepost at or below mile
  120.
- **A pure interleave** (`journal/buildJournal.ts`) that turns walker state plus
  the pack into an ordered list of spreads. This is the load-bearing correctness
  seam and is tested exhaustively without React.
- **Printable facing-page export via a browser print path**: a "Print your
  journal" action that calls `window.print()`, backed by a print stylesheet
  (`@media print` / `@page`) that lays the double journal out as a clean,
  legible, page-broken facing-page artifact. No external PDF service and no PDF
  library (see non-goals and interpretation 4).
- **Data export**: a "Save a backup" action that writes the complete walker
  state to a single downloaded JSON file (a small versioned envelope around the
  `WalkerState` record).
- **Data import**: a "Restore from a backup" action that reads a chosen JSON
  file, validates it at the boundary, migrates an older-schema backup forward,
  restores it as the walker's state, and re-renders the trail and journal from
  it. Round-trips losslessly on a fresh browser or device.
- **A gentle, positive backup reminder**: one quiet, dismissible line that
  appears once the walker has earned at least one entry, points at "Save a
  backup", and never nags (it goes away for good once dismissed or once a backup
  is saved).
- **All designed states, sub-100ms interaction feedback, mobile-first, legible
  print** on every surface this EPIC adds, per the QUALITY BAR.

### Out of scope (Non-goals — binding, do not build)
- **No cloud sync.** No server persistence, no background upload, no remote
  store. Everything stays local; the file the walker downloads is the only copy
  that leaves the device, and only because the walker chose to save it.
- **No accounts, no login, no identity.** Import restores a device's state from
  a file the walker holds; it is not a sign-in.
- **No sharing links, feeds, social export, or "share my journal" surface.** The
  keepsake is for the walker. A downloaded file and a printed artifact are the
  only outputs.
- **No external PDF service dependency, and no PDF/print library**, because the
  browser print path suffices (interpretation 4). Do not add `jspdf`,
  `pdfmake`, `puppeteer`, `react-to-print`, or any print/PDF package.
- **No new journey, no journey picker, no onboarding walkthrough, no
  health-export import.** Those belong to EPIC 5. The app still boots straight
  into the Muir Trail.
- **No changes to the Arrival ceremony's reveal or the withholding rules.** This
  EPIC reads the same earned state; it does not loosen or re-implement the
  withholding.
- **No map/polyline, no runtime text generation, no LLM, no analytics of the
  journal's contents.** Unchanged from earlier EPICs.
- **No unit switching UI (miles/kilometres).** Distances render in miles, as in
  every prior EPIC. The unowned Settings/units gap stays a `requested_task`, not
  work absorbed here.

### Interpretations resolved (so the implementer never has to guess)
These are decisions the planner's criteria imply but do not spell out. They are
resolved here. Do not re-litigate them, and do not treat them as license to
expand scope.

1. **"Interleaved date-by-date" resolves to journey-order facing spreads, not a
   literal calendar merge.** The product carries two date systems that cannot be
   sorted into one axis: the traveler's diary dates (1867) and the walker's real
   check-in dates (2026 and later). A literal date sort across them is
   meaningless. The faithful reading of "interleaved date-by-date with the
   walker's one-line log" is the **double journal**: one facing-page spread per
   reached milepost, ordered by the walk's own progression (ascending
   `mileMark`, which equals traveler-date order because pack dates are
   non-decreasing). Each spread shows BOTH datelines: the traveler's diary date
   on their side, and the real date the walker reached that ground on the
   walker's side. This is exactly the north star's "verbatim words beside their
   own daily lines, page after page." "The walker's one-line log" is the facing
   line the walker wrote for that milepost (`personalLog`), which is the only
   prose the walker authors in this product.

2. **No data-model change.** The journal is fully derived from existing v2 state
   (`dailyLog`, `personalLog`, `reachedMilepostIds`, `cumulativeMiles`) and the
   pack. Export serializes the existing `WalkerState`; import restores it. The
   backup-reminder's dismiss/exported flags live in `localStorage`, not in the
   walker record, so they never bloat the keepsake, never need a migration, and
   correctly stay device-local (they describe THIS device's backup habit, not
   the journey). Therefore `schemaVersion` stays 2 and no new migration branch is
   added. This is the smallest change that satisfies the criteria (SCOPE
   DISCIPLINE §2).

3. **No router. The Journal is an in-app view toggled by Trail state**, exactly
   as the Arrival is an overlay driven by component state (the app is a
   single-screen SPA with no router; adding routing is speculative generality).
   The Trail owns a `view: "trail" | "journal"` state. A subordinate "Read your
   journal" control opens the Journal view; a "Back to the trail" control
   returns. The Trail's one primary action stays the check-in.

4. **Print is a browser print stylesheet plus `window.print()`, with no
   library.** The planner's non-goal is explicit: "No external PDF service
   dependency if the browser print path suffices." It suffices. A "Print your
   journal" button calls `window.print()`; an `@media print` / `@page`
   stylesheet lays the mounted journal out as a page-broken facing-page artifact
   and hides interactive chrome (`.no-print`). Print fidelity beyond structure
   (exact pagination in a given browser) is inherently environment-dependent and
   is verified by structure and the `window.print()` call, not by pixel
   assertions.

5. **Import replaces the single walker record, and confirms first when it would
   overwrite real progress.** There is one walker record and one journey.
   Importing a backup restores it wholesale. If the device already has logged
   miles, import first asks the walker to confirm the replacement (a
   hard-to-reverse action), with positive copy and a way to keep the current
   state. On a fresh device (no logged miles) import proceeds without a confirm
   prompt. An older-schema backup is run through `migrate()` and upgraded; an
   unknown-version, malformed, oversized, or wrong-shape file is rejected at the
   boundary with a designed, plain-voice error and changes no state.

6. **The reached date for a spread is the real date the crossing happened.** A
   milepost's walker-side dateline is the date of the first `dailyLog` entry
   whose running cumulative total reaches that milepost's `mileMark`. This is
   computed by a single pass over `dailyLog` and is deterministic. It is the
   honest answer to "when did I reach this ground."

7. **An empty facing line is allowed and is not an error.** A walker may reach a
   milepost and write no line. The spread still renders the earned traveler
   entry; the walker's side shows the reached dateline and a quiet prompt to add
   a line on screen, and simply omits the line in print. Blank walker sides are
   normal in a real double journal.

---

## 2. Technical design

### 2.1 Files and modules to touch

```
web/src/journal/
  buildJournal.ts        # NEW: pure interleave -> ordered JournalSpread[] (reached-only)
  buildJournal.test.ts   # NEW: correctness from mile one, ordering, reached-date, withhold
  Journal.tsx            # NEW: the double-journal reading + print surface
  Journal.test.tsx       # NEW: renders spreads, empty state, withhold guard, a11y, header
  Backup.tsx             # NEW: Save a backup / Restore from a backup / reminder controls
  Backup.test.tsx        # NEW: export download, import validate + confirm + restore, reminder
  reminder.ts            # NEW: pure shouldShowBackupReminder + thin localStorage flag helpers
  reminder.test.ts       # NEW: show/suppress logic; dismiss and exported suppress permanently

web/src/state/
  backup.ts              # NEW: serializeBackup / parseBackup (envelope, shape-validate, migrate)
  backup.test.ts         # NEW: lossless round-trip; rejects malformed/oversized/wrong-shape; migrates v1
  useWalker.ts           # CHANGE: add restoreState(state) that recomputes, persists, and sets state
  useWalker.test.ts      # CHANGE (or NEW): restoreState replaces state and clears pendingArrival

web/src/trail/
  Trail.tsx              # CHANGE: view state trail|journal; render Journal; render Backup card; wire restore

web/src/
  copy.test.ts           # CHANGE: add Journal.tsx, Backup.tsx, reminder.ts, backup.ts to FILES

web/src/styles/app.css   # CHANGE: journal reading layout, facing-page spreads, print stylesheet,
                         #         backup card + reminder, all mobile-first

web/e2e/
  journal.e2e.ts         # NEW: open the journal, read a spread, the print button exists, 390px no h-scroll
  backup.e2e.ts          # NEW: save a backup, wipe IndexedDB, restore from the file, state comes back

README.md                # CHANGE (light): code map + one line on the journal, print, and export/import
```

The pack loading model is unchanged (`muir.json` bundled, source test-only). No
new dependency is added to `package.json`.

### 2.2 Data model

**No schema change.** `schemaVersion` stays `2`. The journal derives entirely
from the existing record. See interpretation 2. `migrate()` gains no new branch;
it is reused as-is by import so that a backup written by any schema version the
app understands is upgraded on the way in.

### 2.3 The interleave (`journal/buildJournal.ts`, pure)

```ts
import type { JourneyPack, Voice } from "../packs/types";
import type { WalkerState } from "../state/types";

export interface JournalSpread {
  milepostId: string;
  mileMark: number;
  place: string;
  travelerDate: string;      // milepost.date, raw ISO (1867-...)
  travelerDateline: string;  // formatted via dateline()
  approxNote: string;
  voices: Voice[];           // verbatim, earned; never mutated
  walkerLine: string;        // personalLog text for this milepost, "" if none
  reachedDate: string;       // real YYYY-MM-DD the crossing happened (see interp 6)
  reachedDateline: string;   // formatted via dateline()
}

// Ordered ascending by mileMark. Includes ONLY mileposts in
// state.reachedMilepostIds (the withhold boundary; unearned mileposts never
// appear). reachedDate is the date of the first dailyLog entry whose running
// cumulative total reaches the milepost's mileMark.
export function buildJournal(state: WalkerState, pack: JourneyPack): JournalSpread[];
```

Rules, all provable:
- **Reached-only.** A milepost id not in `state.reachedMilepostIds` produces no
  spread and its `voices` text is never read. This is the journal's half of the
  withholding boundary.
- **Correct from the first milepost.** With the fixture pack (mileposts at
  `mileMark` 5 and 12): a state at cumulative 5 yields exactly one spread
  (`fx-1`); at cumulative 12, exactly two (`fx-1`, then `fx-2`); the count and
  order never drift from `reachedMilepostIds`.
- **Ordering** is ascending `mileMark`.
- **reachedDate attribution** walks `dailyLog` in stored order accumulating
  miles; the first entry whose running total is `>= mileMark` supplies the date.
  Two mileposts crossed by the same check-in share that date and stay ordered by
  `mileMark`. (Because `cumulativeMiles = sum(dailyLog)` and reached ids are
  exactly those with `mileMark <= cumulativeMiles`, every reached milepost is
  attributable; the last entry is the safe fallback.)
- **walkerLine** is `facingLineFor(state, milepostId)` (reuse the existing pure
  helper), `""` when the walker wrote none.
- Pure: no IndexedDB, no React, no `Date`. Cheap to test exhaustively.

### 2.4 The Journal surface (`journal/Journal.tsx`)

A full-viewport reading view (not an overlay; it replaces the Trail body when
`view === "journal"`). Component contract:

```ts
interface JournalProps {
  pack: JourneyPack;
  state: WalkerState;
  onClose: () => void;   // back to the Trail
}
```

Behavior:
- Build spreads with `buildJournal(state, pack)`.
- **Front matter (once, at the top).** A quiet header: the journey title and
  traveler, one factual line of scale ("{N} miles walked. {M} entries earned."),
  and the pack `framingNote`, so the period content is never read unframed.
  Factual scale is not a medal or a streak; it is the size of the keepsake.
- **Spreads.** For each `JournalSpread`, render one facing-page unit with two
  clearly distinguished sides:
  - Traveler side: the `place` and `travelerDateline` as the spread's labelled
    heading, then each `voices[]` entry as an attributed verbatim passage
    (single voice for Muir; multiple voices render attributed and separated,
    never merged), then the `approxNote` as a quiet caption.
  - Walker side: the `reachedDateline` ("You reached this on ...") and the
    `walkerLine`. When the line is empty, show a quiet prompt on screen ("Add
    your line for this milepost from the Trail.") rather than a blank gap. The
    facing line is authored in the Arrival; the Journal displays it and does not
    duplicate the editor.
- **Layout.** Mobile-first at 390px: the two sides stack vertically (traveler
  above walker) with clear separation and no horizontal scroll. Wider viewports
  and print place them as true facing columns. A comfortable reading measure and
  generous line height for the verbatim text, matching the paper aesthetic
  (`--paper`, serif).
- **One primary action.** "Print your journal" (calls `window.print()`) is the
  surface's primary action. "Back to the trail" is a visibly subordinate close
  control (>= 44px). Both carry `.no-print` so they never appear in the printed
  artifact.
- **Designed empty state.** If opened with zero spreads (no milepost reached
  yet), show a designed empty surface: what the journal is and the first step
  ("Your journal fills as you walk. Each milepost you reach adds the traveler's
  words beside your own. Log your first miles to earn the first page."), plus
  "Back to the trail". Never a blank region.
- **No loading or error state** on this surface: the data is already in memory.
- **Accessibility.** A single `<h1>`/labelled top heading for the view, a real
  heading per spread, `<article>`/`<section>` structure, meaningful order,
  focus moved to the view heading on open and returned to the trigger on close,
  `Escape` returns to the Trail, full keyboard reach, visible focus.

Copy in this component (headings, labels, buttons, empty state, the empty-line
prompt) is swept. The `voices[]` text, `place`, `approxNote`, `framingNote`, and
datelines are pack/derived data and are not swept.

### 2.5 The print stylesheet (`styles/app.css`, `@media print`)

- `@page { margin: 18mm; }` and a legible print type scale.
- `.no-print { display: none; }` hides the Trail chrome, the buttons, and the
  backup controls in print.
- Each spread prints on its own page: `.journal-spread { break-inside: avoid; }`
  and a page break between spreads (`break-after: page` on all but the last, or
  `break-before: page` on all but the first).
- In print, the two sides sit as facing columns with clear rules/spacing; text
  is dark ink on white regardless of the screen color scheme (print defaults to
  paper). The front matter (title, scale line, framing note) prints once as a
  title block on the first page.
- Honor `prefers-reduced-motion` for any screen transition; print has none.

### 2.6 Export and import (`state/backup.ts`, pure core)

```ts
import type { WalkerState } from "./types";

export const BACKUP_FORMAT = "the-long-road/walker-state";
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024; // reject anything larger at the boundary

export interface BackupEnvelope {
  format: string;   // BACKUP_FORMAT
  version: number;  // state.schemaVersion at export time
  exportedAt: string; // ISO timestamp (passed in by the caller)
  state: WalkerState;
}

// Pretty (2-space) JSON so the file is human-inspectable: owning your data
// includes being able to read it.
export function serializeBackup(state: WalkerState, exportedAt: string): string;

export type ImportResult =
  | { ok: true; state: WalkerState }   // migrated forward; caller recomputes against the pack
  | { ok: false; message: string };    // designed, plain-voice reason

// Guarded end to end: JSON.parse in a try/catch, envelope shape checked,
// state shape validated field-by-field, then migrate(). Any failure returns
// { ok: false } with a friendly message and never throws.
export function parseBackup(text: string): ImportResult;
```

`parseBackup` boundary validation (this is the app's one real input boundary,
so it is the QUALITY BAR §5 "validate input at the boundary" surface):
- `text.length` within `MAX_BACKUP_BYTES`; parseable JSON; a plain object.
- `format === BACKUP_FORMAT`; `state` is a plain object.
- `state` shape: `schemaVersion` a number; `activePackId` a string; `createdAt`
  a string; `dailyLog` an array of `{ date: string, miles: number }`;
  `cumulativeMiles` a number; `reachedMilepostIds` an array of strings;
  `personalLog` an array of `{ date: string, milepostId: string, text: string }`.
- Run the validated object through `migrate()`. `null` (unknown/absent version)
  is rejected with the friendly message. A `v1` backup migrates to `v2` and
  succeeds.
- On success return the migrated state. The caller (`restoreState`) recomputes
  derived fields against the active pack and persists, so a backup's stale
  derived fields can never poison the restored state.
- Never log file contents (no PII in logs). The error message names the fix, not
  the internals.

**Export UI** (in `Backup.tsx`): "Save a backup" builds `serializeBackup(state,
new Date().toISOString())`, wraps it in a `Blob({ type: "application/json" })`,
and downloads it via an object URL on a temporary `<a download>` element (file
name e.g. `the-long-road-<activePackId>-backup.json`). Revoke the URL after.
Show a 100ms pressed state and a brief "Saved." confirmation. Mark the reminder
as satisfied (see 2.7).

**Import UI** (in `Backup.tsx`): "Restore from a backup" opens a labelled
`<input type="file" accept="application/json,.json">`. On selection: reject
`file.size > MAX_BACKUP_BYTES` up front; read with `file.text()`; run
`parseBackup`. On `ok: false`, show the designed error inline and change no
state. On `ok: true`: if the current device has logged miles, ask the walker to
confirm the replacement (positive copy, keep-current option); otherwise proceed.
On confirm, call `onRestore(result.state)` and show "Your journal is restored."
Keep the input labelled and keyboard-reachable.

### 2.7 The backup reminder (`journal/reminder.ts`)

```ts
// Pure decision, tested directly. No localStorage, no Date inside.
export function shouldShowBackupReminder(args: {
  hasEarnedEntry: boolean; // state has >= 1 reached milepost
  dismissed: boolean;      // walker dismissed the reminder before
  exported: boolean;       // walker has saved a backup before
}): boolean {
  return args.hasEarnedEntry && !args.dismissed && !args.exported;
}

// Thin device-local flags (localStorage), kept out of the exported keepsake.
export function readReminderFlags(): { dismissed: boolean; exported: boolean };
export function markReminderDismissed(): void;
export function markBackupExported(): void;
```

UI: when `shouldShowBackupReminder` is true, render one quiet line above or
beside the Save-a-backup control: "Keep a backup so your journal travels with
you." with the "Save a backup" action and a subordinate "Dismiss" (>= 44px,
labelled). Dismiss sets the flag; saving a backup sets the exported flag. Either
one hides the reminder permanently (no nagging, ever). It never appears before
the first earned entry (nothing to back up), and is never a modal or a blocking
banner.

### 2.8 `useWalker` change

Add a restore path that mirrors the existing optimistic-persist pattern:

```ts
// state/useWalker.ts
const restoreState = useCallback((incoming: WalkerState) => {
  const next = recompute(incoming, pack); // derived fields consistent with the active pack
  setState(next);
  setPendingArrival([]); // a restore is not a fresh crossing; do not auto-open the Arrival
  void saveState(next).catch((err) => reportError(err));
}, [pack]);
```

Expose `restoreState` alongside the existing surface. No other `useWalker`
behavior changes.

### 2.9 Trail wiring (`trail/Trail.tsx`)

- Add `view: "trail" | "journal"` local state. When `journal`, render
  `<Journal pack={pack} state={state} onClose={() => setView("trail")} />` in
  place of the trail body (the Arrival overlay logic is untouched).
- Render a subordinate **keepsake card** (only when `status === "ready"`) that
  holds the `<Backup>` controls and, when the walker has at least one earned
  entry, the "Read your journal" control that sets `view = "journal"`. The card
  is visibly subordinate to the check-in (QUALITY BAR §7): the check-in stays the
  one primary action on the Trail.
- **Import must be reachable when empty.** `<Backup>` renders "Restore from a
  backup" whenever the Trail is ready, including the empty state, so a walker on
  a brand-new device can restore before they have any journal. "Save a backup"
  and "Read your journal" appear only once there is state/earned entries.
- Wire `onRestore={restoreState}` from `useWalker` into `<Backup>`.
- The Trail's existing empty, loading, and error states are unchanged.

### 2.10 API contracts

Unchanged. No application API, no server persistence, no network call, no LLM,
no secrets. All new state is local (IndexedDB for the record; `localStorage`
for the two reminder flags). The exported file leaves the device only when the
walker saves it, and carries no traveler verbatim text (it is walker state
only; the pack's text is never copied into the export). Server-side authorization
and rate limiting remain not applicable (no endpoints); the one input boundary,
import-file validation, is specified in 2.6.

---

## 3. Ordered task list (each with acceptance criteria)

### T1 — The interleave (`journal/buildJournal.ts`, pure)
Build the pure spread builder and prove it.
- **AC1.1** `buildJournal(state, pack)` returns `JournalSpread[]` per §2.3;
  `npm run typecheck` passes with `strict`.
- **AC1.2** Reached-only: given a state that reached `fx-1` but not `fx-2`, the
  result contains a spread for `fx-1` and none for `fx-2`, and `fx-2`'s
  `voices[].text` never appears in any returned spread. Proven in
  `buildJournal.test.ts`.
- **AC1.3** Correct from the first milepost and in order: with the fixture pack,
  cumulative 5 yields one spread (`fx-1`); cumulative 12 yields two, ordered
  `fx-1` then `fx-2`. The count equals `state.reachedMilepostIds.length`.
- **AC1.4** `reachedDate` is the date of the first `dailyLog` entry whose running
  cumulative reaches each milepost's `mileMark`; two mileposts crossed by one
  check-in share that date and stay `mileMark`-ordered. Proven with a crafted
  multi-day and a single-large-day log.
- **AC1.5** `walkerLine` is the walker's saved facing line for the milepost, and
  `""` when none. Proven with and without a `personalLog` entry.

### T2 — The Journal reading surface (`journal/Journal.tsx`)
Build the double-journal view and its styles per §2.4 and §2.5 (screen half).
- **AC2.1** Given a reached milepost, the Journal renders a spread with the
  place, the traveler dateline, every voice's verbatim text attributed, the
  `approxNote`, the walker's `reachedDateline`, and the walker's facing line,
  usable at 390px with no horizontal scroll.
- **AC2.2** The front matter renders once: title, traveler, a factual scale line
  ("{N} miles walked. {M} entries earned."), and the pack `framingNote`.
- **AC2.3** Withhold guard: a state short of a milepost renders no spread and no
  verbatim text for it anywhere in the Journal DOM. Proven against the fixture
  and confirmed against the real Muir pack below a given `mileMark`.
- **AC2.4** Designed empty state: opened with zero reached mileposts, the Journal
  shows the what-and-first-step surface and "Back to the trail", never a blank
  region.
- **AC2.5** Accessibility: labelled view heading, a heading per spread, semantic
  structure, focus moves in on open and returns on close, `Escape` returns to the
  Trail, full keyboard reach, visible focus, the close control is >= 44px.
- **AC2.6** An empty facing line shows the quiet on-screen prompt, not a blank
  gap; a present line shows verbatim.

### T3 — The print path (print stylesheet + `window.print()`)
Wire the primary "Print your journal" action and the print stylesheet per §2.5.
- **AC3.1** "Print your journal" calls `window.print()`, proven by a spy in
  `Journal.test.tsx`.
- **AC3.2** The print stylesheet exists in `app.css`: an `@media print` block
  with `@page` margins, `.no-print { display: none }`, and per-spread page
  breaks with `break-inside: avoid`. Proven by asserting the compiled CSS
  contains these rules (read the stylesheet in a unit test) and/or a structural
  test that the buttons carry `.no-print`.
- **AC3.3** The printed artifact contains only earned entries: because print
  renders the same mounted journal, the withhold guard (AC2.3) covers it; a test
  asserts an unreached milepost's text is absent from the Journal DOM that print
  reflows.

### T4 — Data export (`state/backup.ts` serialize + Save-a-backup UI)
- **AC4.1** `serializeBackup(state, iso)` returns pretty JSON of a
  `BackupEnvelope` with `format === BACKUP_FORMAT`, `version === state.schemaVersion`,
  the given `exportedAt`, and the full `state`. Proven in `backup.test.ts`.
- **AC4.2** The export carries no traveler verbatim text: the serialized string
  for a reached-milepost state does not contain that milepost's `voices[].text`
  (the export is walker state only). Proven in `backup.test.ts`.
- **AC4.3** "Save a backup" triggers a download of a JSON blob (proven by
  stubbing the anchor/URL and asserting a `download` with a `.json` name and the
  serialized content), shows a pressed state and a "Saved." confirmation, and
  marks the reminder exported. Proven in `Backup.test.tsx`.

### T5 — Data import (`state/backup.ts` parse + Restore UI + `restoreState`)
- **AC5.1** Lossless round-trip (unit): for a non-trivial state (multi-day log,
  a personal line), `parseBackup(serializeBackup(state, iso))` returns
  `{ ok: true, state }` deep-equal to the original state. Proven in
  `backup.test.ts`.
- **AC5.2** `parseBackup` rejects, with `{ ok: false }` and a designed message
  and no throw: non-JSON text, a wrong `format`, a missing/wrong-typed `state`
  field, and text larger than `MAX_BACKUP_BYTES`. A `v1`-schema envelope is
  accepted and migrated to `v2`.
- **AC5.3** `useWalker.restoreState(state)` recomputes derived fields against the
  pack, persists, sets state, and clears `pendingArrival` (no Arrival auto-opens
  on restore). Proven in `useWalker.test.ts`.
- **AC5.4** Restore UI: choosing a valid file on a device with existing logged
  miles asks for confirmation before replacing and offers to keep the current
  state; choosing it on a fresh device restores without a prompt; an invalid file
  shows the inline designed error and changes no state. Proven in
  `Backup.test.tsx`.

### T6 — The gentle backup reminder (`journal/reminder.ts` + UI)
- **AC6.1** `shouldShowBackupReminder` returns true only when there is an earned
  entry and neither dismissed nor exported; false in every other combination.
  Proven exhaustively in `reminder.test.ts`.
- **AC6.2** The reminder renders its positive line and "Save a backup" only when
  the decision is true; dismissing it (sets the flag) and saving a backup (sets
  exported) each hide it, and it stays hidden on re-render. It never renders
  before the first earned entry. Proven in `Backup.test.tsx`.

### T7 — Trail wiring, navigation, and designed states
Wire the view toggle, the keepsake card, and restore per §2.9.
- **AC7.1** A subordinate "Read your journal" control on the Trail (shown once at
  least one entry is earned) opens the Journal view; "Back to the trail" returns.
  The check-in remains the Trail's single primary action.
- **AC7.2** "Restore from a backup" is reachable from the Trail's ready state
  including the empty state (fresh-device restore); "Save a backup" and "Read
  your journal" appear only once there is state/earned entries.
- **AC7.3** Restoring from the Trail replaces the walker state and re-renders the
  odometer, reached rows, and journal from the imported data. Proven by a Trail
  component test and the e2e in T8.

### T8 — Sweep, e2e, and definition of done
- **AC8.1** `copy.test.ts` includes `src/journal/Journal.tsx`,
  `src/journal/Backup.tsx`, `src/journal/reminder.ts`, and `src/state/backup.ts`,
  and passes. A manual sweep of every string this EPIC adds (journal headings,
  empty state, empty-line prompt, buttons, reminder line, confirm and error and
  success copy, file name) finds no em/en dashes, no " - " breaks, no banned
  vocabulary, and no negative empty-state phrasing.
- **AC8.2** `journal.e2e.ts` passes: from the seeded (or freshly crossed) app,
  open the journal, see a spread with the traveler's verbatim entry and the
  walker's reached line, see the "Print your journal" button, and confirm no
  horizontal scroll at a 390px viewport.
- **AC8.3** `backup.e2e.ts` passes: cross the first Muir milepost, "Save a
  backup" (capture the download), delete the IndexedDB database and reload to the
  empty state, "Restore from a backup" with the saved file, and confirm the
  odometer and the reached row come back with the same entry.
- **AC8.4** `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run validate:packs`, and `npm run test:e2e` all pass.
- **AC8.5** The non-goals held: no cloud sync, account, share link, PDF/print
  library or external PDF service, journey picker, walkthrough, health-export
  import, map, unit toggle, runtime generation, or schema migration was added.
  `README.md`'s code map stays accurate and carries no factory internals.

---

## 4. Test plan (which automated test proves each criterion)

Every criterion is proven by an automated test under `web/`, run by `npm test`
and `npm run test:e2e`.

### Planner acceptance criterion → tests
- **Journal interleaves earned entries with the walker's line, correct from mile
  one, 120 miles owns 120 miles of journal** → `buildJournal.test.ts` (AC1.2,
  AC1.3, AC1.4, AC1.5), `Journal.test.tsx` (AC2.1, AC2.2), `journal.e2e.ts`
  (AC8.2).
- **Printable facing-page artifact suitable for keeping** → `Journal.test.tsx`
  print spy and structure (AC3.1, AC3.3), the stylesheet assertion (AC3.2),
  `journal.e2e.ts` (print button present, AC8.2).
- **Data export writes complete state as one JSON file; import validates and
  restores, round-tripping losslessly on a fresh browser or device** →
  `backup.test.ts` (AC4.1, AC4.2, AC5.1, AC5.2), `Backup.test.tsx` (AC4.3,
  AC5.4), `useWalker.test.ts` (AC5.3), `backup.e2e.ts` full wipe-and-restore
  round trip (AC8.3).
- **A gentle positive reminder to keep a backup, without nagging** →
  `reminder.test.ts` (AC6.1), `Backup.test.tsx` (AC6.2).
- **Print and export legible; all states designed; mobile-first** →
  `Journal.test.tsx` empty state and a11y and 390px (AC2.4, AC2.5),
  `journal.e2e.ts` no horizontal scroll at 390px (AC8.2), the print stylesheet
  (AC3.2), designed import error and restore confirm (AC5.4).

### Withholding integrity (the differentiator)
- **Earned-only journal / print / export** → `buildJournal.test.ts` reached-only
  (AC1.2), `Journal.test.tsx` withhold guard (AC2.3), print reflow of the same
  guarded DOM (AC3.3), export carries no verbatim text (AC4.2).

### Copy and gate
- **copy.test.ts** → AC8.1 (new files swept).
- **typecheck / lint / test / validate:packs / test:e2e** → AC8.4.

---

## 5. Definition of done
- The Journal renders the double journal: one facing-page spread per reached
  milepost in journey order, the traveler's verbatim entry (dateline, place,
  voices, framing) beside the walker's reached date and facing line, correct
  from the first earned milepost, so a walker who stops at mile 120 owns exactly
  those spreads.
- The keepsake is earned-only: no unreached milepost's verbatim text appears in
  the journal, the print output, or the exported file, and this is proven at the
  interleave, the render, and the export.
- "Print your journal" produces a legible, page-broken facing-page artifact
  through a browser print stylesheet and `window.print()`, with no PDF library
  and no external service.
- Export writes the complete walker state to one JSON file; import validates it
  at the boundary, migrates an older schema forward, restores it, and round-trips
  losslessly on a fresh browser or device, proven by a wipe-and-restore e2e.
- A quiet, positive backup reminder appears once an entry is earned, points at
  "Save a backup", and disappears for good once dismissed or once a backup is
  saved. It never nags and never blocks.
- All new surfaces have designed empty and error states, interaction feedback is
  synchronous (< 100ms), and every surface is usable and legible at 390px with
  visible focus and full keyboard reach.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run validate:packs`, and
  `npm run test:e2e` all pass. The copy sweep is clean across every new string.
- No non-goal was built (no cloud sync, account, share link, PDF library or
  external PDF service, picker, walkthrough, health-export import, map, unit
  toggle, runtime generation, or schema migration).
```