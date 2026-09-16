# EPIC SPEC — First run: picker, guided walkthrough, and health-export import

*The Long Road: walk a dead traveler's journey, mile for mile, diary for diary.*

## Quality differentiator (this app must win here)

**The substance of the payoff.** Every rival virtual-journey product rewards
distance with medals, points, postcards, or cartoon scenery. This app rewards
distance with a real dead person's actual words, verbatim, keyed to the exact
ground you reached, and it withholds tomorrow's entry until your feet earn it.
We compete on the meaning of the reward, not on gamification, breadth, or
automation.

**What that demands of THIS epic.** This EPIC is the front door, and the front
door must sell the differentiator honestly. Three obligations follow. First,
the Start screen and picker frame the product as what it is: a deliberate
daily check-in ritual whose reward is a real traveler's own words, stated
plainly BEFORE the walker commits, with a one-line "who you walk with" that
makes the companion a person, never a route on a map. Second, the guided first
run walks a brand-new user to the differentiator itself, logging real miles
once and reaching or previewing the first verbatim entry, in 2 to 4 short
imperative steps anchored to the real controls, so the first minute delivers
the product and never a lecture about it. Third, the second input path
(health-export import) must keep the earning honest: files are parsed entirely
on device, validated hard at the boundary, and merged under rules that can
never double count a day or fabricate miles, because an entry unlocked by
inflated miles is a broken promise. Imported miles that legitimately cross
mileposts pay off exactly like typed miles: the Arrival ceremony opens and the
words are earned.

---

## 1. Scope

### In scope
- **The Start screen** (`firstrun/Start.tsx`): shown only when no walker
  record exists. States plainly what the product does and that it needs a
  daily check-in, in short positive copy, before the walker commits. Hosts the
  journey picker and a subordinate restore-a-backup path for a returning
  walker on a fresh device.
- **The journey picker**: one card per registered journey pack, each showing
  the journey title, years, scale, and a one-line authored "who you walk
  with" (a new required `companion` field on the pack schema). Choosing a
  journey creates and persists the walker record and lands on the Trail.
  Today the registry holds one pack (Muir); the picker renders from the
  registry so EPIC 6's second pack drops in with no picker change.
- **A pack registry** (`packs/index.ts`): the list of shipped packs and a
  `packById` lookup, so `App.tsx` resolves the active pack from
  `state.activePackId` instead of hardcoding Muir.
- **The boot gate** (`App.tsx`): loading state -> existing record -> Trail
  with the record's pack; fresh database with `SEED_DEMO` -> Trail (the
  existing seed path, Start never shows); fresh database otherwise -> Start.
- **The guided first run** (`firstrun/walkthrough.ts` + `Walkthrough.tsx`):
  2 to 4 steps anchored to the real Trail controls, each one short imperative
  sentence, walking a brand-new user through logging miles once and reaching
  (Arrival opens) or previewing (the next-milepost card) their first entry.
  Skippable at every step. Appears only until first success. Never again for
  a returning walker, a seeded demo, or a restored backup.
- **Health-export import** (`importer/`): a second input path reachable from
  the Trail. Two supported formats, both parsed entirely on device:
  a `date,miles` CSV and an Apple Health `export.xml` (walking + running
  distance records). Validated at the boundary for type, size, and shape
  before parsing; a clear list of supported formats; designed errors for
  unsupported or malformed files; a preview-and-confirm step before any
  state changes; merge rules that never double count; crossings unlocked by
  an import open the Arrival exactly like typed miles.
- **All designed states, sub-100ms feedback, mobile-first at 390px, no PII
  leaving the device** on every surface this EPIC adds, per the QUALITY BAR.
- **E2E migration**: existing e2e specs boot at `/` and today land on the
  Trail; with the Start gate in front they need a shared helper that begins
  the Muir journey (and pre-marks the walkthrough done for flows that are not
  about the walkthrough). This is maintenance of existing passing criteria,
  in scope.

### Out of scope (Non-goals — binding, do not build)
- **No account creation.** No sign-up, no login, no identity of any kind. The
  Start screen creates a local record, nothing else.
- **No multiple concurrent journeys.** One walker record, one active journey.
  The picker chooses the single journey; it is not a journey switcher, and no
  "switch journey" or "start over" control is added to the Trail or anywhere
  else this EPIC.
- **No fitness-format zoo.** Exactly two supported inputs: the `date,miles`
  CSV and Apple Health `export.xml`. No GPX, FIT, TCX, Google Fit, Garmin,
  Strava, or any third format, no matter how small it seems.
- **No background sync.** Import is a manual, user-initiated file drop. No
  polling, no file-system watching, no health-API integration, no service
  worker sync.
- **No new journey content.** The Lewis & Clark pack is EPIC 6. The picker
  shows the packs that exist (today: one). Do not add a placeholder,
  coming-soon, or disabled second card.
- **No settings screen.** The plan's Settings surface is not this EPIC. The
  import entry point lives on the Trail; units stay miles-only as in every
  prior EPIC.
- **No changes to the withholding rules, the Arrival ceremony's reveal, the
  Journal, or the backup envelope.** This EPIC feeds the same state machine
  through a second input; it does not touch the reward logic.
- **No new runtime dependency.** No CSV library, no XML/SAX library, no
  coach-mark or tour library, no zip library. The parsers and the walkthrough
  are small hand-rolled modules.

### Interpretations resolved (so the implementer never has to guess)
Decisions the planner's criteria imply but do not spell out. Resolved here.
Do not re-litigate them, and do not treat them as license to expand scope.

1. **Choosing a journey creates the walker record.** `beginJourney(packId)`
   persists `freshState(packId, now)` (the existing helper) and enters the
   Trail. This is why a returning walker never sees Start or the picker
   again: the gate checks for a record, and the record exists from the moment
   of choice. The record with an empty `dailyLog` renders the Trail's
   existing designed empty state, which the walkthrough's first step sits
   beside. No schema change: `firstSuccessDone` from the plan sketch is
   realized as a device-local `localStorage` flag (interpretation 4), exactly
   like the EPIC 4 backup-reminder flags, so the keepsake stays clean and no
   migration is added.

2. **The picker renders the registry, and the registry has one pack.** The
   planner's criterion says "for each" journey; with one shipped pack the
   picker shows one card. The card's button is the Start screen's single
   primary action. The `companion` line is a new REQUIRED pack-schema field
   (authored, swept for tone), because "who you walk with" is the product's
   promise and deserves an authored sentence, not a string concatenated from
   title and years. The validator, SCHEMA.md, `muir.json`, and the fixture
   pack gain the field; EPIC 6's pack will be held to it automatically.

3. **`SEED_DEMO` bypasses Start.** On a fresh database with the flag set, the
   boot gate renders the Trail and the existing `useWalker` seeding runs
   unchanged. The staging promise (the differentiator within a minute) does
   not gain a picker step. The seeded walker has miles, so the walkthrough
   never shows (interpretation 4).

4. **Walkthrough state is a device-local flag plus a tiny in-session
   machine.** A `localStorage` flag (same naming pattern as the reminder
   flags in `journal/reminder.ts`) records that the walkthrough is done. The
   pure decision lives in `firstrun/walkthrough.ts`. At Trail mount, when the
   flag is unset but the record already has miles (a returning walker from
   before this EPIC, a seeded demo, or a restored backup), the flag is set
   silently and nothing shows: a returning user never sees it. The flag is
   set by finishing the last step, by Skip at any step, or by a first success
   arriving through the import path. A reload mid-walkthrough after the first
   log lands in the has-miles rule and shows nothing further; that is
   accepted and honest (the walker has logged and seen the trail).

5. **Walkthrough anchoring is by placement, not by a positioning engine.**
   Each step renders as a small callout inside or directly beside the card it
   points at (the check-in card, the next-milepost card), so there is no
   floating-position math and no library. One step is visible at a time; each
   shows its one imperative sentence and a Skip control (>= 44px); the final
   step shows Done. The callout never traps focus, never blocks the control
   it points at, and never overlays the Arrival dialog (steps advance only
   after the Arrival closes).

6. **The two walkthrough paths.** Step 1 (fresh record, zero miles): anchored
   to the check-in. The first log decides the branch. If it crossed the first
   milepost, the Arrival opens and IS the first success; when it closes, a
   final step anchored to the reached list says one sentence and finishes
   (2 steps total). If it did not cross, a step anchored to the next-milepost
   card frames the preview, then a final step closes the loop (3 steps
   total). Both branches sit inside the planner's 2-to-4 window.

7. **The import entry point is a subordinate control on the Trail's check-in
   card**, opening an in-app `import` view exactly as the Journal replaces
   the Trail body (`view: "trail" | "journal" | "import"`). The check-in
   stays the Trail's single primary action; the plan's Settings home for this
   feature does not exist yet and building Settings for it would be drift.

8. **Merge rules keep the earning honest and idempotent.** Parsed files
   reduce to per-day totals. A day is added only when `dailyLog` has no entry
   for that date (the walker's own log always wins; re-importing the same
   file adds nothing). Days with totals above `MAX_MILES_PER_CHECKIN` (200,
   the existing manual bound), days dated after today, and days totaling zero
   or less are left out and counted in the preview. The merged `dailyLog` is
   sorted ascending by date (stable), so the Journal's reached-date
   attribution stays chronological when past days arrive after manual
   entries. After confirm, derived fields are recomputed with the existing
   `recompute`, and newly crossed mileposts feed `pendingArrival` so the
   Arrival queue opens exactly as for typed miles.

9. **Apple Health double counting is resolved per day by source.** A raw
   `export.xml` carries walking/running distance records from every source
   (watch AND phone), which overlap; summing them would inflate miles and
   unlock unearned entries. Rule: group each day's records by `sourceName`,
   sum each source, and take the largest single source's total as the day's
   miles. Deterministic, one sentence, and it can only under-count, never
   over-count. The day key is the date part (first 10 characters) of the
   record's `startDate`, which carries the exporting device's local offset.
   Units `mi`, `km` (x 0.621371), and `m` (/ 1609.344) are converted;
   records with any other unit or an unparseable value are skipped and
   counted. Day totals round to hundredths, matching the odometer.

10. **The Apple export is read in bounded chunks, because real exports are
    huge.** A typical `export.xml` runs hundreds of megabytes; reading it
    whole would crash the tab and a small size cap would reject most real
    users. The parser reads the `File` via `Blob.slice` in 8 MiB chunks
    decoded with a streaming `TextDecoder`, scans each chunk for
    `<Record ... />` elements of type
    `HKQuantityTypeIdentifierDistanceWalkingRunning` (attributes parsed by
    name, never by position), carries a bounded tail (64 KiB) across chunk
    boundaries for split tags, yields to the event loop between chunks, and
    reports progress by bytes. Hard cap `MAX_HEALTH_XML_BYTES` = 1 GiB,
    rejected before reading. The CSV cap is 1 MiB (years of daily rows fit
    in a few KiB).

11. **Boundary validation happens before parsing, in this order.** File name
    extension decides the format (`.csv` or `.xml`); a `.zip` gets its own
    designed error telling the walker to unzip and choose `export.xml`; any
    other extension gets the supported-formats error. Size caps are checked
    on `file.size` before any read. Shape is sniffed cheaply: the CSV's first
    non-empty line must be the `date,miles` header (case-insensitive,
    whitespace tolerant) or a valid data row; the XML's first chunk must
    contain `<?xml` or `<HealthData`. Only then does full parsing run. Any
    failure shows a designed inline error and changes no state.

12. **A malformed CSV is rejected whole; a valid XML with no walking records
    is an error, not an empty success.** A hand-made CSV with a bad row is
    rejected with the first bad line's number and the expected form, because
    silently dropping rows from a file the walker typed hides their mistake.
    The Apple scan ignores the millions of non-distance elements by design,
    but zero matching records means the wrong file, and says so. An import
    whose every day is skipped (all already logged, all out of range) shows
    the preview with its counts and a disabled-free path back, never a
    confirm that adds nothing silently: the confirm control only renders
    when at least one day would be added.

13. **Start offers restore, preserving EPIC 4's fresh-device promise.**
    EPIC 4 made "Restore from a backup" reachable on a fresh device's empty
    Trail. With Start now gating a fresh device, a returning walker with a
    backup file would have to re-pick a journey to reach it. Start therefore
    carries a subordinate restore control reusing `parseBackup` and its
    designed messages; success persists the restored state and enters the
    Trail with the pack resolved from `activePackId`. No confirm is needed
    (a fresh device has nothing to lose, matching EPIC 4's rule). This is
    maintenance of an existing shipped criterion across the new gate, not
    new scope.

14. **No PII leaves the device, provably.** All parsing is local; the app
    makes no network calls of its own beyond loading its static assets (and
    optional Sentry/Umami, which are disabled when env is absent, as in e2e).
    File contents, file names, row values, and parse errors are NEVER sent to
    Sentry or Umami and never logged; designed error strings are constants,
    not interpolations of file content (the CSV error carries a line NUMBER
    only). The import e2e asserts zero non-static network requests during
    the whole import flow.

---

## 2. Technical design

### 2.1 Files and modules to touch

```
web/src/packs/
  index.ts                NEW: journeyPacks registry + packById(id)
  types.ts                CHANGE: required `companion: string` on JourneyPack
  validatePack.ts         CHANGE: S10 companion non-empty
  validatePack.test.ts    CHANGE: companion rule cases
  SCHEMA.md               CHANGE: document `companion`
  muir.json               CHANGE: add the authored companion line
  fixturePack.ts          CHANGE: add a sample companion line
  muir.copy.test.ts       CHANGE: sweep `companion` with the other authored fields

web/src/firstrun/
  Start.tsx               NEW: Start screen (framing copy, picker, restore)
  Start.test.tsx          NEW
  walkthrough.ts          NEW: pure step decision + localStorage flag helpers
  walkthrough.test.ts     NEW
  Walkthrough.tsx         NEW: the one-step callout (sentence + Skip/Done)

web/src/importer/
  csv.ts                  NEW: pure date,miles CSV parser -> DayTotal[] | error
  csv.test.ts             NEW
  appleHealth.ts          NEW: chunked export.xml scanner -> DayTotal[] | error
  appleHealth.test.ts     NEW
  mergeDays.ts            NEW: pure merge plan (adds, skips by reason) + apply
  mergeDays.test.ts       NEW
  Importer.tsx            NEW: the import view (formats, input, progress,
                          preview, confirm, errors)
  Importer.test.tsx       NEW

web/src/
  App.tsx                 CHANGE: boot gate (loading | start | trail), pack
                          resolution via packById, begin/restore wiring
  App.test.tsx            NEW: gate decisions incl. SEED_DEMO bypass
  copy.test.ts            CHANGE: add Start.tsx, Walkthrough.tsx, walkthrough.ts,
                          Importer.tsx, csv.ts, appleHealth.ts, mergeDays.ts

web/src/state/
  useWalker.ts            CHANGE: add importDays(entries) (append, sort,
                          recompute, pendingArrival, persist)
  useWalker.test.ts       CHANGE: importDays behavior

web/src/trail/
  Trail.tsx               CHANGE: view union gains "import"; the check-in card
                          gains the subordinate import control; walkthrough
                          callouts render beside their anchor cards
  Trail.test.tsx          CHANGE: walkthrough integration, import entry

web/src/styles/app.css    CHANGE: Start layout, picker card, walkthrough
                          callout, importer view; all mobile-first; walkthrough
                          and importer chrome carries .no-print

web/e2e/
  helpers.ts              NEW: beginMuirJourney(page), markWalkthroughDone(page)
  firstrun.e2e.ts         NEW: Start copy, picker, walkthrough both branches,
                          returning-user suppression
  import.e2e.ts           NEW: CSV and XML fixture imports, designed errors,
                          no-network assertion
  fixtures/               NEW: walks.csv, walks-malformed.csv, export-small.xml,
                          export-empty.xml, notes.txt
  arrival.e2e.ts          CHANGE: begin via helper
  journal.e2e.ts          CHANGE: begin via helper
  backup.e2e.ts           CHANGE: begin via helper; Start-restore path
  persistence.e2e.ts      CHANGE: begin via helper
  mobile.e2e.ts           CHANGE: Start and importer at 390px

README.md                 CHANGE (light): the first-run flow, the two import
                          formats, code map additions
```

No new dependency is added to `package.json`. No change to the walker schema,
`migrate()`, the backup envelope, `buildJournal`, or the Arrival.

### 2.2 Data model

**Walker state: unchanged.** `schemaVersion` stays 2; no migration branch is
added. The walkthrough flag lives in `localStorage` (device-local habit, kept
out of the keepsake, same reasoning as the EPIC 4 reminder flags).

**Pack schema: one new required field** (build-time data, no runtime
migration):

```ts
export interface JourneyPack {
  // ...existing fields...
  companion: string; // one authored line on who you walk with, shown in the
  // picker. Our words, present-day plain English, swept for tone.
}
```

`muir.json` gains, for example:
`"companion": "John Muir, a young botanist walking a thousand miles from
Kentucky to the Gulf in 1867, writing in his journal nearly every night."`
(The implementer may refine the sentence; it must stay one line, factual,
and pass the copy sweep.)

Validator rule S10: `companion` must be a non-empty string. `SCHEMA.md`
documents the field. `muir.copy.test.ts` sweeps it with the other authored
fields. The fixture pack gains an obviously-sample line.

### 2.3 The pack registry (`packs/index.ts`)

```ts
import { muirPack } from "./muir";
import type { JourneyPack } from "./types";

export const journeyPacks: JourneyPack[] = [muirPack];

export function packById(id: string): JourneyPack | undefined;
```

EPIC 6 adds its pack to this array and the picker, the boot gate, and the
restore path pick it up with no further change.

### 2.4 The boot gate (`App.tsx`)

App owns a small boot status: `"loading" | "start" | "trail"`, plus the
resolved active pack.

- On mount, call the existing `loadState()` once.
  - Record found: resolve `packById(state.activePackId) ?? muirPack`, render
    `<Trail pack={pack} />`. (Trail's `useWalker` re-reads the record; the
    double read is idempotent and cheap.)
  - No record and `env.seedDemo`: render `<Trail pack={muirPack} />`; the
    existing seed path inside `useWalker` runs unchanged. Start never shows.
  - No record otherwise: render `<Start ... />`.
- While loading, render a held-layout loading surface (reuse the existing
  skeleton pattern), never a white screen.
- `beginJourney(packId)`: `await saveState(freshState(packId, new Date().toISOString()))`,
  then flip to `trail` with that pack. Feedback within 100ms (pressed state on
  the card's button; the persist is fast and awaited).
- `restoreOnStart(state)`: `await saveState(state)`, resolve the pack from
  `state.activePackId`, flip to `trail`. `useWalker` recomputes derived
  fields on load as it always does.
- The `ErrorBoundary` continues to wrap everything; a boot-load failure
  renders the existing designed error surface with a reload action.

### 2.5 The Start screen (`firstrun/Start.tsx`)

```ts
interface StartProps {
  packs: JourneyPack[];
  onBegin: (packId: string) => void;
  onRestore: (state: WalkerState) => void;
}
```

Layout, top to bottom, mobile-first:

- **Masthead**: the app title and one line of what it is. Example copy (all
  Start copy is swept): "Walk a real historic journey, mile for mile. Each
  milepost you reach hands you what the traveler wrote on that ground."
- **The honest ritual line**, stated before any commitment, positive and
  plain: "You count your own miles and log them here once a day. It takes
  about ten seconds." No hedging, no essay: two short sentences.
- **The picker**: one card per pack in `packs`. Each card shows the journey
  title, the years and scale in one quiet line ("1867. About 1,000 miles."),
  and the pack's `companion` line as the human heart of the card. The card's
  button ("Begin this journey", >= 44px) is the screen's single primary
  action and calls `onBegin(pack.id)` with a pressed state.
- **Restore, subordinate**: one quiet line ("Walked before? Restore your
  backup.") with a labelled file input (`accept="application/json,.json"`),
  visually subordinate to the picker. Selection: enforce `MAX_BACKUP_BYTES`
  up front, read, `parseBackup`; on `ok` call `onRestore(result.state)`; on
  failure show the designed message inline (`role="alert"`) and change
  nothing. Reuse `BACKUP_MESSAGES` and the file-reading helper pattern from
  `journal/Backup.tsx` (extract the small `readFileText` helper to a shared
  module rather than duplicating it).
- **Accessibility**: real `<h1>`, the picker as a labelled region, every
  control labelled and keyboard reachable, visible focus, no horizontal
  scroll at 390px.
- **No loading or error state of its own** beyond the restore error: the
  screen renders from bundled data.

### 2.6 The walkthrough (`firstrun/walkthrough.ts` + `Walkthrough.tsx`)

Pure decision plus thin flag helpers, mirroring `journal/reminder.ts`:

```ts
export type WalkthroughStep = "log" | "preview" | "finish" | null;

// Pure. `done` is the persisted flag; `hasMiles`/`hasEarned` come from state;
// `arrivalOpen` suppresses callouts under the ceremony; `previewSeen` is the
// in-session record that the walker acknowledged the preview step.
export function walkthroughStep(args: {
  done: boolean;
  hasMiles: boolean;
  hasEarned: boolean;
  arrivalOpen: boolean;
  previewSeen: boolean;
}): WalkthroughStep;

export function readWalkthroughDone(): boolean;
export function markWalkthroughDone(): void;
```

Decision table (exhaustively tested):
- `done` -> `null`, always.
- `arrivalOpen` -> `null` (the ceremony is never overlaid).
- No miles -> `"log"` (anchored to the check-in card).
- Miles and earned (the first log crossed) -> `"finish"` (anchored to the
  reached list; one sentence, Done).
- Miles, not earned, preview not yet acknowledged -> `"preview"` (anchored to
  the next-milepost card).
- Miles, not earned, preview acknowledged -> `"finish"` (anchored to the
  check-in card).

Step copy (each step is ONE short imperative sentence plus its controls; all
swept):
- `log`: "Log the miles you walked today."
- `preview`: "Walk this distance to earn {traveler}'s first entry." with a
  Next control (>= 44px) that acknowledges the preview.
- `finish` (earned branch): "Return each day to earn the next entry." with
  Done.
- `finish` (preview branch): "Come back tomorrow and log your walk again."
  with Done.
- Every step also shows Skip (>= 44px). Skip and Done both call
  `markWalkthroughDone()`.

Trail integration:
- At mount (status ready), when the flag is unset and the record has miles,
  call `markWalkthroughDone()` and show nothing (returning walker, seeded
  demo, restored backup).
- `Walkthrough.tsx` renders the current step's callout inside/beside its
  anchor card: a visually distinct `role="status"` callout with the sentence
  and its buttons. It never traps or steals focus, never covers the anchored
  control, and is fully usable at 390px.
- A first success via the import path (an import that adds the first miles)
  also calls `markWalkthroughDone()`.

### 2.7 The CSV parser (`importer/csv.ts`, pure)

```ts
export interface DayTotal { date: string; miles: number } // YYYY-MM-DD, > 0

export const MAX_CSV_BYTES = 1 * 1024 * 1024;

export type CsvResult =
  | { ok: true; days: DayTotal[] }
  | { ok: false; message: string }; // designed, plain-voice; carries a line
                                    // NUMBER at most, never file content

export function parseWalksCsv(text: string): CsvResult;
```

Rules:
- Lines split on `\r?\n`; blank lines (including trailing) are ignored.
- An optional first header line `date,miles` (case-insensitive, surrounding
  whitespace tolerated) is skipped.
- Every other line must be `YYYY-MM-DD,<number>` where the number passes the
  same shape as the manual check-in (digits, at most two decimals, positive).
  The first bad line rejects the whole file:
  "Line {n} needs the form 2026-06-01,3.5."
- Duplicate dates within the file sum into one `DayTotal`.
- Totals round to hundredths. Range rules (over 200, future, zero) are NOT
  applied here; they are merge-plan skips (2.9) so both formats share them.

### 2.8 The Apple Health scanner (`importer/appleHealth.ts`)

```ts
export const MAX_HEALTH_XML_BYTES = 1024 * 1024 * 1024; // 1 GiB
export const XML_CHUNK_BYTES = 8 * 1024 * 1024;
export const XML_CARRY_BYTES = 64 * 1024;

export type XmlResult =
  | { ok: true; days: DayTotal[]; skippedRecords: number }
  | { ok: false; message: string };

// Pure core: feed decoded text chunks, accumulate per-day per-source sums.
export function createRecordScanner(): {
  push(chunk: string): void;
  finish(): XmlResult;
};

// Async driver over the File: slice, decode (streaming TextDecoder), push,
// yield between chunks, report progress in bytes. Respects an abort flag.
export function scanHealthExport(
  file: File,
  onProgress: (bytesRead: number, totalBytes: number) => void,
  signal: { aborted: boolean },
): Promise<XmlResult>;
```

Rules (all in the pure core, unit-testable with strings):
- Only `<Record ... />` elements whose `type` attribute is
  `HKQuantityTypeIdentifierDistanceWalkingRunning` count. Attributes
  (`type`, `sourceName`, `unit`, `startDate`, `value`) are parsed by name
  within the tag text; order never matters.
- Day key: the first 10 characters of `startDate`.
- Units: `mi` as-is, `km` x 0.621371, `m` / 1609.344; any other unit, an
  unparseable value, or a malformed date increments `skippedRecords` and
  moves on.
- Per day: sum per `sourceName`; the day's total is the LARGEST single
  source's sum (interpretation 9), rounded to hundredths.
- Tags split across chunk boundaries are handled by carrying the tail from
  the last unterminated `<Record` (bounded at `XML_CARRY_BYTES`).
- `finish()` with zero matching records returns the designed error:
  "This file holds no walking distance. In the Health app, export your data,
  unzip export.zip, and choose the export.xml inside."

### 2.9 The merge plan (`importer/mergeDays.ts`, pure)

```ts
export interface MergePlan {
  adds: DayTotal[];          // days that will be added, ascending by date
  addedMiles: number;        // rounded sum of adds
  skippedExisting: number;   // date already present in dailyLog
  skippedFuture: number;     // date after `today`
  skippedOverMax: number;    // total > MAX_MILES_PER_CHECKIN
  skippedEmpty: number;      // total <= 0
}

export function planMerge(
  days: DayTotal[],
  dailyLog: DailyLogEntry[],
  today: string,
): MergePlan;

// The merged log: existing entries plus adds, sorted ascending by date
// (stable, so same-date manual entries keep their order).
export function applyMerge(dailyLog: DailyLogEntry[], adds: DayTotal[]): DailyLogEntry[];
```

`useWalker` gains:

```ts
importDays: (adds: DayTotal[]) => void;
// Builds the merged log via applyMerge (creating a fresh record first when
// state is null), recomputes against the pack, sets pendingArrival to
// newlyReached(before, after), persists optimistically like logMiles.
```

Crossings from an import open the Arrival queue exactly like typed miles:
the earned words are the payoff for the walking the file proves, and the
existing multi-crossing queue (EPIC 3) already handles many at once.

### 2.10 The Importer view (`importer/Importer.tsx`)

Opened from a subordinate control on the Trail's check-in card ("Add miles
from a file", >= 44px), rendered in place of the Trail body via
`view === "import"` (the Journal pattern). Component contract:

```ts
interface ImporterProps {
  dailyLog: DailyLogEntry[];       // for planMerge
  onImport: (adds: DayTotal[]) => void;
  onClose: () => void;             // back to the trail
}
```

Surface, top to bottom:
- A labelled heading and ONE line listing the supported formats: "Drop a
  date,miles CSV or an Apple Health export.xml. Everything is read on this
  device." That second sentence is the privacy promise, stated where the
  file is chosen.
- A labelled file input (`accept=".csv,.xml,text/csv,text/xml,application/xml"`),
  keyboard reachable.
- **Boundary checks in order** (interpretation 11): `.zip` -> "Unzip
  export.zip first, then choose the export.xml inside." Other unsupported
  extension -> "Choose a date,miles CSV or an Apple Health export.xml."
  Size over the format's cap -> a designed too-large message naming the cap.
  Shape sniff failure -> the format's malformed message. All inline,
  `role="alert"`, nothing applied.
- **Progress** while scanning a large XML: an in-place progress line driven
  by `onProgress` ("Reading your export. {n} of {m} MB.") with a Cancel
  control (sets the abort flag; returns to the chooser). Never a spinner
  with no way out; the chunk loop yields so the UI stays live.
- **Preview and confirm** from the `MergePlan`, before any state changes:
  the adds in one factual line ("Add {n} days, {miles} miles, from {first}
  to {last}."), then one quiet line per non-zero skip reason ("{n} days you
  already logged stay as you logged them." / "{n} days were after today and
  were left out." / "{n} days were above 200 miles and were left out."), and
  for XML any `skippedRecords` ("{n} records were in a form this app does
  not read."). The confirm button ("Add these miles", the view's primary
  action) renders only when `adds.length > 0`; otherwise the preview stands
  with its counts and "Back to the trail". Confirm calls `onImport(adds)`
  and closes; a crossing opens the Arrival on the Trail.
- **Designed empty state** is the initial chooser itself: the formats line
  tells the walker what this screen is for and what to do first.
- **Accessibility and layout**: labelled view heading, focus moves to it on
  open and returns to the trigger on close, Escape closes (aborting any
  scan), full keyboard reach, visible focus, usable at 390px with no
  horizontal scroll, controls >= 44px.
- **Privacy**: no fetch, no Sentry breadcrumb, no Umami event carries file
  names or contents anywhere in this flow (interpretation 14).

### 2.11 API contracts

Unchanged. Static SPA assets and `/healthz` only; no server state, no auth
endpoints, no mutation endpoints, no LLM. Rate limiting and server-side
authorization remain not applicable. The app's real input boundaries are now
three local files (backup JSON since EPIC 4; the CSV and the Apple XML from
this EPIC), each validated for type, size, and shape before parsing, per
QUALITY BAR §5.

---

## 3. Ordered task list (each with concrete acceptance criteria)

### T1 — Pack registry and the companion line
- **AC1.1** `packs/index.ts` exports `journeyPacks` (containing the Muir
  pack) and `packById`; `packById("muir-thousand-mile-walk")` returns the
  pack and an unknown id returns `undefined`. Unit-tested.
- **AC1.2** `JourneyPack.companion` is a required non-empty string: the
  validator emits an S10 violation when it is missing or blank (proven in
  `validatePack.test.ts`), `SCHEMA.md` documents it, and `muir.json` and the
  fixture pack carry authored lines that validate.
- **AC1.3** `muir.copy.test.ts` sweeps `companion` alongside the other
  authored fields, and the Muir line passes (no dashes, no banned words, no
  negative phrasing).
- **AC1.4** `npm run validate:packs` passes.

### T2 — The boot gate and the Start screen
- **AC2.1** Fresh database, no `SEED_DEMO`: the app renders Start (what it
  is, the daily ritual line, the picker) and no Trail. Proven in
  `App.test.tsx`.
- **AC2.2** Existing record: the app renders the Trail for
  `packById(activePackId)` and Start never mounts. An unknown `activePackId`
  falls back to the Muir pack. Proven in `App.test.tsx`.
- **AC2.3** Fresh database with `SEED_DEMO`: the app renders the Trail and
  the existing seed runs; Start never mounts. Proven in `App.test.tsx`.
- **AC2.4** The Start screen states the product and the daily check-in need
  before commitment: the ritual copy ("once a day", the ten-second framing)
  is asserted present in `Start.test.tsx`.
- **AC2.5** The picker shows one card per registry pack with the title, the
  years-and-scale line, and the pack's `companion` line; the card's button
  calls `onBegin` with the pack id and shows a pressed state within 100ms.
- **AC2.6** Choosing a journey creates and persists the walker record: after
  `beginJourney`, a reload boots straight to the Trail (no Start). Proven in
  `App.test.tsx` (record in fake IndexedDB) and `firstrun.e2e.ts`.
- **AC2.7** Start's restore control accepts a valid backup file, calls
  `onRestore` with the parsed state, and the app lands on the Trail with the
  restored miles; an invalid or oversized file shows the designed
  `BACKUP_MESSAGES` error inline and changes nothing. Proven in
  `Start.test.tsx` and `backup.e2e.ts`.
- **AC2.8** Accessibility and layout: a real `<h1>`, labelled controls,
  keyboard reach, visible focus, no horizontal scroll at 390px, primary
  button >= 44px. Proven in `Start.test.tsx` plus `mobile.e2e.ts`.

### T3 — The guided walkthrough
- **AC3.1** `walkthroughStep` implements the decision table in §2.6 exactly,
  proven exhaustively over all input combinations in `walkthrough.test.ts`.
- **AC3.2** Brand-new walker (fresh record, flag unset): the `log` step's
  callout renders beside the check-in with its one imperative sentence and a
  Skip control. Proven in `Trail.test.tsx`.
- **AC3.3** Preview branch: a first log that crosses nothing advances to the
  `preview` step anchored to the next-milepost card, then Next leads to the
  `finish` step, and Done sets the flag; no callout renders afterwards, and
  none renders after a remount. Proven in `Trail.test.tsx`.
- **AC3.4** Reached branch: a first log that crosses the first milepost
  shows no callout while the Arrival is open; after it closes, the `finish`
  step renders once, and Done ends the walkthrough. Proven in
  `Trail.test.tsx`.
- **AC3.5** Skippable at any step: Skip at the `log`, `preview`, and
  `finish` steps each sets the flag and removes the callout for good.
  Proven in `Trail.test.tsx`.
- **AC3.6** Returning users never see it: flag unset but the record has
  miles at mount (covers pre-EPIC walkers, `SEED_DEMO`, and a restored
  backup) marks the flag silently and renders no callout. Proven in
  `Trail.test.tsx`.
- **AC3.7** Every step's copy is one short imperative sentence; Skip, Next,
  and Done are >= 44px, keyboard reachable, with visible focus; the callout
  never overlays the Arrival dialog or the control it points at. Proven in
  `Trail.test.tsx` plus the copy sweep.

### T4 — The CSV parser and the merge plan (pure)
- **AC4.1** `parseWalksCsv` accepts a file with and without the header,
  tolerates blank and trailing lines, sums duplicate dates, rounds to
  hundredths, and returns days in the file's date order. Proven in
  `csv.test.ts`.
- **AC4.2** `parseWalksCsv` rejects the whole file on the first malformed
  line with the designed message carrying that line's number, for: a bad
  date, a non-numeric value, a negative value, more than two decimals, and
  a wrong column count. The message never contains file content. Proven in
  `csv.test.ts`.
- **AC4.3** `planMerge` skips (with correct counts) days already in the
  dailyLog, days after `today`, days over `MAX_MILES_PER_CHECKIN`, and days
  totaling zero or less; `adds` is ascending by date and `addedMiles` is the
  rounded sum. Re-planning the same file against the merged log yields zero
  adds (idempotence). Proven in `mergeDays.test.ts`.
- **AC4.4** `applyMerge` returns the union sorted ascending by date, stable
  for same-date entries. `useWalker.importDays` recomputes, persists, and
  sets `pendingArrival` to exactly the newly crossed ids (a multi-milepost
  import queues them ascending). Proven in `mergeDays.test.ts` and
  `useWalker.test.ts`.

### T5 — The Apple Health scanner
- **AC5.1** The scanner counts only `DistanceWalkingRunning` records,
  parses attributes regardless of order, keys days by the `startDate` date
  part, and converts `mi`, `km`, and `m` correctly. Proven in
  `appleHealth.test.ts` with realistic record snippets.
- **AC5.2** Per-day source rule: a day with watch and phone records yields
  the largest single source's sum, never the sum of sources. Proven with a
  crafted two-source day.
- **AC5.3** A record split across two pushed chunks is parsed exactly once
  (the carry works); unknown units and malformed values increment
  `skippedRecords` without failing the scan. Proven in
  `appleHealth.test.ts`.
- **AC5.4** `finish()` with zero matching records returns the designed
  wrong-file error; `scanHealthExport` reports monotonic byte progress and
  stops promptly when the abort flag is set. Proven in
  `appleHealth.test.ts` (driver run against a small in-memory File).

### T6 — The Importer view and Trail wiring
- **AC6.1** The Trail's check-in card carries the subordinate "Add miles
  from a file" control (>= 44px); it opens the Importer view in place of
  the Trail body and the check-in remains the Trail's single primary
  action. Closing returns focus to the trigger. Proven in `Trail.test.tsx`.
- **AC6.2** The Importer states the two supported formats and the on-device
  promise in its opening line, with a labelled file input. Proven in
  `Importer.test.tsx`.
- **AC6.3** Boundary rejections each show their designed inline error and
  change no state: a `.zip` (the unzip message), an unsupported extension
  (the formats message), an over-cap CSV and an over-cap XML (the size
  messages), a CSV failing the shape sniff, and an XML whose first chunk
  lacks `<?xml`/`<HealthData`. Proven in `Importer.test.tsx`.
- **AC6.4** A valid CSV produces the preview with the adds line and correct
  per-reason skip counts; "Add these miles" renders only when at least one
  day would be added; confirming calls `onImport` with the plan's adds and
  closes. Proven in `Importer.test.tsx`.
- **AC6.5** An import that crosses mileposts opens the Arrival queue on the
  Trail, and the earned entries render exactly as if the miles were typed.
  Proven in `Trail.test.tsx` (integration) and `import.e2e.ts`.
- **AC6.6** A large-XML scan shows byte progress with a working Cancel;
  Escape closes the view and aborts a running scan. Proven in
  `Importer.test.tsx`.
- **AC6.7** An import that adds the walker's first miles marks the
  walkthrough done. Proven in `Trail.test.tsx`.
- **AC6.8** The view is usable at 390px with no horizontal scroll, labelled
  heading, focus in on open and back on close, full keyboard reach, visible
  focus. Proven in `Importer.test.tsx` and `mobile.e2e.ts`.

### T7 — E2E migration and the new journeys
- **AC7.1** `e2e/helpers.ts` provides `beginMuirJourney(page)` (navigate,
  choose Muir on Start) and `markWalkthroughDone(page)` (init-script flag);
  the existing arrival, journal, backup, and persistence specs use them and
  pass unchanged in substance.
- **AC7.2** `firstrun.e2e.ts` passes: a fresh context sees Start (the
  product line, the ritual line, the Muir card with its companion line);
  beginning the journey lands on the Trail with the `log` callout; logging
  6 miles opens the Arrival; closing it shows the `finish` step; Done ends
  the walkthrough; a reload boots straight to the Trail with no Start and
  no callout.
- **AC7.3** `firstrun.e2e.ts` also proves the preview branch and skip: in a
  fresh context, logging 2 miles shows the `preview` step against the
  next-milepost card, and Skip removes the walkthrough permanently across a
  reload.
- **AC7.4** `import.e2e.ts` passes: from a begun journey, import
  `fixtures/walks.csv` (a multi-day file whose total crosses the first
  milepost), see the preview counts, confirm, and the Arrival opens with
  the verbatim entry; import `fixtures/export-small.xml` and see its days
  added with correct totals (including a km-unit record and a two-source
  day proving the conversion and the source rule); `walks-malformed.csv`,
  `export-empty.xml`, and `notes.txt` each show their designed error and
  change nothing; a re-import of `walks.csv` yields a zero-add preview with
  the already-logged count and no confirm control.
- **AC7.5** `import.e2e.ts` asserts no non-static network request occurs
  during the whole import flow (the on-device promise, interpretation 14).
- **AC7.6** `mobile.e2e.ts` extends to Start and the Importer at 390px: no
  horizontal scroll, and the begin button, Skip control, and file inputs
  are tappable (>= 44px).
- **AC7.7** `backup.e2e.ts` gains the Start-restore path: save a backup from
  a walked state, clear storage, and restore it from the Start screen's
  restore control, landing on the Trail with the odometer and reached rows
  intact and no walkthrough.

### T8 — Sweep, README, and the gate
- **AC8.1** `copy.test.ts` includes `firstrun/Start.tsx`,
  `firstrun/Walkthrough.tsx`, `firstrun/walkthrough.ts`,
  `importer/Importer.tsx`, `importer/csv.ts`, `importer/appleHealth.ts`,
  and `importer/mergeDays.ts`, and passes. A manual sweep of every string
  this EPIC adds (Start copy, the companion lines, walkthrough steps,
  importer formats line, progress, preview, skip-reason lines, every error
  message, e2e fixture prose) finds no em/en dashes, no " - " breaks, no
  banned vocabulary, and no negative empty-state phrasing.
- **AC8.2** `README.md` gains the first-run flow (choose a journey, the
  walkthrough) and the two import formats in stranger-facing words, and the
  code map covers `firstrun/` and `importer/`. No factory internals.
- **AC8.3** `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run validate:packs`, and `npm run test:e2e` all pass.
- **AC8.4** The non-goals held: no account surface, no journey switcher or
  second concurrent journey, no third import format, no background sync, no
  placeholder journey card, no settings screen, no new dependency, no
  walker-schema migration, and no change to the withholding, Arrival,
  Journal, or backup-envelope logic beyond the wiring named in §2.1.

---

## 4. Test plan (which automated tests prove each planner criterion)

All tests run under `web/` via `npm test` and `npm run test:e2e`.

- **"The Start screen states plainly what the product does and that it
  needs a daily check-in, before the walker commits, in short positive
  copy"** -> `Start.test.tsx` (AC2.4), `App.test.tsx` gate (AC2.1),
  `firstrun.e2e.ts` (AC7.2), the copy sweep (AC8.1).
- **"The journey picker lets the walker choose a journey and shows a
  one-line 'who you walk with' for each"** -> `Start.test.tsx` (AC2.5),
  registry and companion validation (AC1.1 to AC1.3), persistence of the
  choice (AC2.6), `firstrun.e2e.ts` (AC7.2).
- **"A guided first run of 2 to 4 steps anchored to the real controls ...
  skippable at any step, appears only until first success, and never again
  for a returning user"** -> `walkthrough.test.ts` decision table (AC3.1),
  `Trail.test.tsx` both branches, skip, and returning suppression (AC3.2 to
  AC3.7), import-path completion (AC6.7), `firstrun.e2e.ts` both branches
  plus reload suppression (AC7.2, AC7.3).
- **"Health-export import: a date,miles CSV and Apple Health export.xml
  walking/running distance, parsed entirely on device, validated at the
  boundary for type, size, and shape before parsing, with a clear list of
  supported formats and a designed error for a malformed or unsupported
  file"** -> `csv.test.ts` (AC4.1, AC4.2), `appleHealth.test.ts` (AC5.1 to
  AC5.4), `mergeDays.test.ts` and `useWalker.test.ts` honest-merge rules
  (AC4.3, AC4.4), `Importer.test.tsx` formats line, boundary rejections,
  preview/confirm, progress and cancel (AC6.2 to AC6.6), `import.e2e.ts`
  end to end including designed errors, idempotent re-import, and the
  no-network assertion (AC7.4, AC7.5).
- **"All states designed; mobile-first; no PII leaves the device"** ->
  designed states across `Start.test.tsx`, `Trail.test.tsx`,
  `Importer.test.tsx` (errors, progress, previews, callouts);
  `mobile.e2e.ts` at 390px (AC7.6); the no-network assertion (AC7.5); the
  boot loading surface (§2.4); the copy sweep (AC8.1).

### Differentiator integrity (honest earning through the second path)
- Per-day source rule and unit conversion -> AC5.1, AC5.2, and the
  two-source day in `export-small.xml` (AC7.4).
- Never double count: already-logged days skipped, idempotent re-import ->
  AC4.3, AC7.4.
- Bounds shared with the manual path (200-mile day cap, no future days) ->
  AC4.3.
- Imported crossings pay off through the real Arrival ceremony -> AC6.5,
  AC7.4.

---

## 5. Definition of done

- A fresh visitor lands on a Start screen that says what the product is and
  that it asks for a once-a-day check-in, in short positive copy, before any
  commitment; choosing the journey (with its authored companion line)
  creates the local record, and every later visit boots straight to the
  Trail.
- A brand-new walker is walked to the differentiator by 2 to 4 anchored
  imperative steps: log once, then reach the first verbatim entry through
  the Arrival or preview it on the next-milepost card. The walkthrough is
  skippable at every step, ends at first success, and never appears for a
  returning, seeded, or restored walker.
- The walker can add miles from a `date,miles` CSV or an Apple Health
  `export.xml`, parsed entirely on this device in bounded memory, validated
  for type, size, and shape before parsing, with the supported formats
  listed where the file is chosen, designed errors for every rejection, a
  preview with per-reason skip counts before anything changes, and merge
  rules that never double count a day, never accept an implausible or
  future day, and re-import idempotently. Crossings earned by an import
  open the Arrival exactly like typed miles.
- `SEED_DEMO` still shows the differentiator within a minute with Start
  bypassed; the existing arrival, journal, backup, and persistence e2e
  journeys pass through the new front door via the shared helper; restore
  is reachable from Start on a fresh device.
- Every new surface has designed states, sub-100ms feedback, full keyboard
  reach, visible focus, and is usable at 390px with no horizontal scroll
  and >= 44px touch targets. No file name or content reaches the network,
  Sentry, or Umami.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run validate:packs`,
  and `npm run test:e2e` all pass, and the copy sweep is clean across every
  string this EPIC adds.
- No non-goal was built: no accounts, no second concurrent journey or
  journey switcher, no third import format, no background sync, no settings
  screen, no new dependency, no walker-schema change.
