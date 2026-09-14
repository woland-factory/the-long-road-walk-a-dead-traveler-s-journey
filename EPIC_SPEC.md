# EPIC SPEC — The milepost unlock and between-milepost pacing (the signature)

*The Long Road: walk a dead traveler's journey, mile for mile, diary for diary.*

## Quality differentiator (this app must win here)

**The substance of the payoff.** Every rival virtual-journey product rewards
distance with medals, points, postcards, or cartoon scenery. This app rewards
distance with a real dead person's actual words, verbatim, keyed to the exact
ground you reached, and it withholds tomorrow's entry until your feet earn it.
We compete on the meaning of the reward, not on gamification, breadth, or
automation.

**What that demands of THIS epic.** This is the EPIC where the reward stops
being a line in a list and becomes the moment the whole product exists for.
EPIC 1 built the loop, EPIC 2 poured in Muir's verified words. This EPIC builds
the Arrival: the ceremony that hands the walker the words they just earned, set
to be read, not skimmed. Two promises carry the differentiator here and both are
provable. First, the ceremony must feel like arriving somewhere. The verbatim
entry gets a real reading surface with its dateline, its place, and its framing,
so the payoff reads like a page from a book and not a toast notification.
Second, the withholding must be airtight. A walker must never be able to read,
peek at, or skip to an entry the odometer has not reached. If the wall around
tomorrow's words has a single gap, the reward stops being earned and the
differentiator is a lie. Build the reveal so that unearned words are not merely
hidden in the UI, they are absent from the page.

---

## 1. Scope

### In scope
- **The Arrival ceremony**: a dedicated reading surface that opens when a
  check-in crosses one or more mileposts. It presents the reached milepost's
  verbatim diary entry in a readable typographic setting, with a dateline, the
  place, the milepost's `approxNote` ("near this ground"), the pack's framing
  note, and a field where the walker writes one line facing the entry.
- **Multi-voice rendering** in the Arrival surface: when a milepost carries more
  than one journalist's voice, each voice renders cleanly and distinctly
  (attributed, separated). Muir is single-voice, so this is proven with a small
  multi-voice test pack, and the surface must not assume exactly one voice.
- **Strict withholding, enforced at the render boundary**: an entry's verbatim
  text is present in the DOM only for mileposts whose ids are in
  `reachedMilepostIds`. There is no affordance, route, or parameter that reveals
  an unreached milepost's text or lets the walker skip ahead.
- **The walker's facing line**: writing one short line per reached milepost,
  stored locally so it survives reload. This adds a `personalLog` to the walker
  state by a forward-only migration. (Rendering the interleaved double journal is
  EPIC 4; this EPIC only writes and stores the line, and shows the walker their
  own saved line when they re-open an entry.)
- **The Trail's non-unlock-day payoff**: on a day that does not cross a milepost,
  the Trail shows current position, the exact distance to the next milepost in
  the walker's units, and one short authored "approach" line about the ground
  ahead that does not spoil the coming entry. This adds an authored `approach`
  field to each milepost (schema evolution, authored for the Muir pack).
- **Re-readability from the Trail**: every reached milepost is listed on the
  Trail as a compact, tappable row that re-opens its Arrival surface. The heavy
  verbatim text renders only inside the Arrival surface, one entry at a time.
- **All designed states, sub-100ms interaction feedback, mobile-first** on every
  surface this EPIC adds or changes, per the QUALITY BAR.

### Out of scope (Non-goals — binding, do not build)
- **No badges, medals, points, levels, confetti, or any celebratory
  gamification beyond the entry itself.** The earned words are the reward. The
  Arrival ceremony celebrates by handing over the words, nothing more.
- **No streak counters, no "days walked", no streak-shaming.** Do not add any
  count whose purpose is to reward consistency rather than distance.
- **No social sharing, share links, feeds, or export-to-social.** (Data/print
  export is EPIC 4 and is not built here.)
- **No double-journal screen and no export/import.** That is EPIC 4. This EPIC
  stores the facing line but does not render the interleaved journal or any
  export.
- **No journey picker, no onboarding walkthrough, no health-export import.** That
  is EPIC 5. The app still boots straight into the Muir Trail.
- **No second pack, no map/polyline, no runtime text generation, no accounts, no
  server state.** Unchanged from earlier EPICs.
- **No unit switching UI (miles/kilometres toggle).** See interpretation 1: "the
  walker's units" resolves to miles for this EPIC, because the product ships a
  single unit and no EPIC owns a unit preference yet. Do not build a toggle.

### Interpretations resolved (so the implementer never has to guess)
These are decisions the planner's criteria imply but do not spell out. They are
resolved here. Do not re-litigate them, and do not treat them as license to
expand scope.

1. **"The walker's units" means miles.** The product currently has exactly one
   unit (the odometer reads "miles walked", `mileMark`/`totalMiles` are miles)
   and `WalkerState` has no unit preference. The plan sketches a `unitPref` and a
   Settings screen, but no EPIC has built a unit toggle, and EPIC 2 listed unit
   switching as a non-goal. Building one now is drift under SCOPE DISCIPLINE §2
   and §4. So distances render in miles. A `requested_task` flags the unowned
   Settings/units gap for the orchestrator rather than absorbing it here.

2. **The Arrival is an in-app surface, not a URL route.** The app is a
   single-screen SPA with no router. Adding routing to satisfy "opens the Arrival
   screen" is speculative generality (SCOPE DISCIPLINE §2). The Arrival is a
   full-viewport overlay dialog driven by component state, opened by a fresh
   crossing or by tapping a reached row, and dismissed back to the Trail.
   Re-readability does not require deep-linking; it requires that tapping a
   reached row always re-opens the entry.

3. **The Trail's reached list becomes compact tappable rows, not inline entries.**
   EPIC 2 rendered each reached milepost's full verbatim text inline on the
   Trail. With 38 Muir mileposts of multi-sentence prose, that grows into a wall
   of text (QUALITY BAR §1 unbounded growth, §7 radical simplicity). This EPIC
   moves the reading into the Arrival surface and turns the Trail list into
   compact rows (place, dateline, mile mark) that re-open the ceremony. The heavy
   text is mounted one entry at a time, in the overlay. The row list is bounded
   by the pack's milepost count (a few dozen), so it is not user-growth
   unbounded; the full growing journal with pagination is EPIC 4's job.

4. **The "approach" line is a new authored pack field, not the `approxNote`.**
   `approxNote` is location framing shown *at* arrival ("near this ground …") and
   often references the entry's own ground, so reusing it before arrival would
   read wrong and risk spoiling. The planner asks for "one short approach line
   about the ground ahead without spoiling the entry", which is purpose-built
   pre-arrival copy. So `Milepost` gains an authored `approach: string`, written
   by us in present-day plain English, swept for LLM tells, and machine-proven
   to be our words (not a verbatim slice of Muir's source). See §2.4 and §2.7.

5. **One facing line per reached milepost, editable, empty allowed.** The field
   writes the walker's own single line for the entry they just reached, keyed by
   `milepostId`. Re-opening a reached entry shows the saved line, editable. An
   empty line is allowed (the walker may skip it) and clears any stored line for
   that milepost. This is the minimum that satisfies "a field to write one facing
   line" and gives EPIC 4 real data to interleave. No free-form daily journaling
   on non-arrival days is built (not in the planner's criteria).

6. **A single check-in may cross several mileposts.** A large mile figure (or a
   future health-export drop) can push the odometer past more than one milepost
   at once. The Arrival presents them as an ordered sequence (ascending
   `mileMark`), one at a time, each with its own facing-line field, so none is
   skipped and each earned entry is honored. This is not a badge or a streak, it
   is the honest consequence of the miles walked.

---

## 2. Technical design

### 2.1 Files and modules to touch

```
web/src/state/
  types.ts               # CHANGE: WalkerStateV2 adds personalLog; PersonalEntry; bump CURRENT_SCHEMA_VERSION to 2
  store.ts               # CHANGE: migrate() upgrades a v1 record to v2 (adds personalLog: []) instead of nulling it
  odometer.ts            # CHANGE: freshState builds v2 (personalLog: []); no other logic change
  personalLog.ts         # NEW: pure upsertFacingLine + facingLineFor helpers (no IndexedDB, no React)
  personalLog.test.ts    # NEW: unit tests for the pure helpers
  useWalker.ts           # CHANGE: logMiles records the newly reached ids; expose pendingArrival + clearPendingArrival + saveFacingLine
  store.test.ts          # CHANGE: add a v1 -> v2 upgrade case; keep round-trip green with personalLog

web/src/packs/
  types.ts               # CHANGE: Milepost gains `approach: string`
  SCHEMA.md              # CHANGE: document `approach` and its rules
  fixturePack.ts         # CHANGE: add an `approach` to each fixture milepost (authored sample copy, swept)
  muir.json              # CHANGE: add an authored `approach` to every one of the 38 mileposts
  validatePack.ts        # CHANGE: add S9 (approach is a non-empty string)
  validatePack.test.ts   # CHANGE: prove S9 bites (missing/empty approach -> violation)
  verifySource.ts        # CHANGE: export a helper to prove a string is NOT in the cleaned source (authored)
  muir.verify.test.ts    # CHANGE: add V8 (every approach is authored, not verbatim source; length bounded)
  muir.copy.test.ts      # CHANGE: sweep every `approach` line too (authored copy)

web/src/trail/
  Arrival.tsx            # NEW: the Arrival ceremony overlay (the signature surface)
  Arrival.test.tsx       # NEW: multi-voice, withhold guard, facing-line save/re-open, focus/escape
  ReachedList.tsx        # CHANGE: compact tappable rows that open Arrival; no inline verbatim text
  NextMilepost.tsx       # CHANGE: current position line + the approach line
  NextMilepost.test.tsx  # NEW: position + distance + approach, and no-spoiler assertion
  Trail.tsx              # CHANGE: own the arrival queue; render Arrival; remove the inline framing card (moves into Arrival)
  Trail.test.tsx         # CHANGE: SEED_DEMO/withhold assertions move to the Arrival flow
  Trail.muir.test.tsx    # CHANGE: same, against the real pack
  facingLine.ts          # NEW: parseFacingLine boundary validator (cap length, collapse whitespace)
  facingLine.test.ts     # NEW: validator tests

web/src/
  copy.test.ts           # CHANGE: add Arrival.tsx and facingLine.ts to the swept FILES list

web/src/styles/app.css   # CHANGE: Arrival overlay + reading typography, position/approach lines, tappable rows

web/e2e/
  persistence.e2e.ts     # CHANGE: reveal + re-read via the Arrival flow, still survives reload
  arrival.e2e.ts         # NEW: cross a milepost, read the entry, write a line, return, re-open it

README.md                # CHANGE (light): keep the "Where the code lives" map accurate if new files warrant it
```

The pack loading model is unchanged: `muir.json` is a bundled typed import, no
runtime fetch. The source file (`sources/gutenberg-60749.txt`) stays test-only.

### 2.2 Data model (forward-only migration to schemaVersion 2)

Add the walker's facing lines. This is the only schema change.

```ts
// state/types.ts
export interface DailyLogEntry {
  date: string;   // YYYY-MM-DD
  miles: number;
}

export interface PersonalEntry {
  date: string;        // YYYY-MM-DD the line was written (local time)
  milepostId: string;  // the reached milepost this line faces
  text: string;        // the walker's one facing line, plain text, trimmed and whitespace-collapsed
}

export interface WalkerStateV1 {   // kept for the migration only
  schemaVersion: 1;
  activePackId: string;
  createdAt: string;
  dailyLog: DailyLogEntry[];
  cumulativeMiles: number;
  reachedMilepostIds: string[];
}

export interface WalkerStateV2 {
  schemaVersion: 2;
  activePackId: string;
  createdAt: string;
  dailyLog: DailyLogEntry[];
  cumulativeMiles: number;
  reachedMilepostIds: string[];
  personalLog: PersonalEntry[];   // NEW
}

export type WalkerState = WalkerStateV2;
export const CURRENT_SCHEMA_VERSION = 2 as const;
```

**Migration (`state/store.ts::migrate`).** Forward-only and non-destructive. A
returning walker keeps every mile they walked (north star: "you keep the miles
you walked and the words you earned"), so a v1 record is UPGRADED, never nulled:

```ts
switch (version) {
  case 1: {
    const v1 = raw as WalkerStateV1;
    return { ...v1, schemaVersion: 2, personalLog: [] };
  }
  case 2:
    return raw as WalkerState;
  default:
    return null;   // unknown/absent version stays "fresh", never throws
}
```

`DB_NAME`/`DB_VERSION`/the object store are unchanged: the whole walker record
lives under one key, so there is no IndexedDB structural upgrade. Only the stored
value's shape grows. `recompute` and `addMiles` already spread `...state`, so
`personalLog` is preserved across every odometer recompute. `freshState` now
returns a v2 record with `personalLog: []`.

### 2.3 Pack schema change: the `approach` field

```ts
// packs/types.ts  (add to Milepost)
export interface Milepost {
  id: string;
  mileMark: number;
  date: string;
  place: string;
  approxNote: string;
  approach: string;   // NEW: one short authored line about the ground AHEAD toward this milepost.
                      // Present-day plain English, our words (not the traveler's), never spoils the
                      // entry, swept for LLM tells. Shown on the Trail before arrival, never at arrival.
  voices: Voice[];
}
```

`SCHEMA.md` documents `approach` with its four binding rules: (a) authored by us
in present-day English, never a quote or paraphrase of the diary; (b) one short
sentence, roughly 15 to 120 characters; (c) describes terrain/direction/geography
ahead, never what happens in the coming entry; (d) subject to the copy sweep.

### 2.4 Authoring the Muir approach lines

Every one of the 38 Muir mileposts gets an `approach` line, authored to the rules
above. It is the pre-arrival teaser the walker reads while still on the road to
that milepost. Guidance for the author:
- Name the ground the walker is heading into (river, ridge, town, forest,
  swamp, coast), drawn from the route's real geography, in the present tense of
  "the road ahead".
- Never reveal an event, encounter, or line from the milepost's diary entry.
  The reward is the entry; the approach only points at the ground.
- Keep it one short sentence. Two clean examples (already swept, safe to ship):
  > The road climbs south into the Kentucky oak woods.
  > Ahead the trail follows the river toward the salt country.
- It must pass the copy sweep and the "authored, not verbatim source" check
  (V8): the line must not be a slice of Muir's Gutenberg text.

The fixture pack also gets short `approach` lines so its unit tests compile and
the sweep covers them.

### 2.5 The Arrival ceremony (`trail/Arrival.tsx`)

A full-viewport overlay dialog. Component contract:

```ts
interface ArrivalProps {
  pack: JourneyPack;
  state: WalkerState;              // read reachedMilepostIds and personalLog
  queue: string[];                 // milepost ids to present, ascending mileMark (>= 1)
  onSaveFacingLine: (milepostId: string, text: string) => void;
  onClose: () => void;             // back to the Trail; clears the queue
}
```

Behavior:
- **Withhold guard (load-bearing).** On render, filter `queue` to ids that are in
  `state.reachedMilepostIds`. If nothing remains, render nothing and call
  `onClose`. An id that is not reached MUST never render its milepost's voices.
  This is the second line of defense behind the caller only ever queueing reached
  ids.
- **Sequence.** Present `queue[index]` starting at 0. The primary action advances:
  "Next entry" while more remain, "Back to the trail" on the last, which calls
  `onClose`. Advancing or closing first saves the current facing line.
- **Reading surface.** For the active milepost render, in this order:
  1. A dateline (reuse the `dateline(iso)` formatter currently in
     `ReachedList.tsx`; extract it to a shared helper, e.g.
     `trail/dateline.ts`, so both surfaces use one implementation) and the
     `place`, as the dialog's labelled heading.
  2. Each entry in `voices[]` as an attributed passage. For a single voice this
     is one passage; for multiple voices each renders with its own author label
     and clear visual separation. Do not collapse or merge voices.
  3. The milepost's `approxNote` ("near this ground …") as a quiet caption.
  4. The pack `framingNote`, so period content is never read unframed. This is
     where the framing note now lives (removed from the Trail body, see §2.6).
  5. The facing-line field (see below).
- **Facing line.** A labelled single-line-oriented input, prefilled with
  `facingLineFor(state, milepostId)`. Placeholder models a real one-liner, for
  example: `Rain most of the way. Legs tired, mind clear.` The line is validated
  by `parseFacingLine` (trim, collapse internal whitespace to single spaces, cap
  length, empty allowed). It saves on blur and when the primary action advances
  or closes. Saving is optimistic (mirrors `logMiles`): update UI immediately,
  persist in the background, `reportError` on failure without a scary surface.
- **One primary action.** The advance/return button is the single primary action
  (QUALITY BAR §7). A close control (labelled "Close", >= 44px) is visibly
  subordinate. The facing-line field is secondary.
- **Accessibility.** `role="dialog"`, `aria-modal="true"`, labelled by the
  place/dateline heading. Move focus into the dialog on open, return focus to the
  triggering control on close, close on `Escape`, keep focus within the dialog.
  Long entries scroll inside the dialog with no horizontal scroll at 390px.
- **States.** No loading or error surface: the data is already in memory and
  saves are optimistic, matching the established pattern. There is no empty state
  because the dialog only opens with a non-empty reached queue.

Copy in this component (labels, buttons, placeholder) is swept. The `voices[]`
text, `place`, `approxNote`, and `dateline` are pack data and are NOT swept.

### 2.6 Trail wiring (`trail/Trail.tsx`) and the reached list

- `useWalker` (see §2.8) exposes `pendingArrival: string[]` (ids newly reached by
  the most recent `logMiles`) and `clearPendingArrival()`, plus `saveFacingLine`.
- Trail holds a local `manualOpen: string[] | null` for re-reads. The Arrival
  queue is `pendingArrival` when non-empty, else `manualOpen`. Render `<Arrival>`
  when the queue is non-empty. `onClose` clears both.
- **Auto-open on crossing.** After a check-in that crosses one or more mileposts,
  `pendingArrival` becomes those ids and the Arrival opens automatically. This is
  the signature moment: log the miles, the diary opens. The open is a synchronous
  state update (< 100ms).
- **Remove the inline framing card** from the Trail body. The framing note now
  renders inside the Arrival surface where the period text is actually read. The
  Trail no longer shows verbatim text, so it no longer needs the framing card.
- **`ReachedList.tsx` becomes compact tappable rows.** For each reached milepost
  (newest first), render a button row showing `place`, the dateline, and
  `mile {mileMark}`. Tapping sets `manualOpen = [id]` (via an `onOpen(id)` prop),
  which opens the Arrival to re-read that entry. No `voices[].text` renders here.
  The withhold boundary is unchanged: only ids in `reachedMilepostIds` produce a
  row, so unreached entries have no row and no text anywhere in the DOM. Rows are
  >= 44px tall, keyboard-focusable buttons with visible focus.
- The empty, loading, and error states of the Trail are unchanged.

### 2.7 Validators and verifier changes

- **`validatePack.ts` S9 (structural, all packs).** Every milepost `approach` is
  a non-empty trimmed string. Add to the existing rule list; `validatePack`
  returns a naming violation when it is missing or blank.
- **`verifySource.ts` / `muir.verify.test.ts` V8 (Muir source-backed).** For
  every milepost: `!cleanSource.includes(normalizeExcerpt(approach))` (the
  approach is OUR words, never a verbatim slice of Muir's source, which both
  proves it is authored and guarantees it cannot leak the entry verbatim), and
  the approach length is within roughly 15 to 120 characters. This is the
  machine-checkable half of "without spoiling the entry"; the editorial half
  (it names ground, not events) is enforced by the authoring rules and review.
  V1 through V7 from EPIC 2 remain and must still pass unchanged.
- **`muir.copy.test.ts`.** Extend the swept authored fields to include every
  milepost `approach`, alongside `title`, `framingNote`, and `approxNote`. The
  primary-source exemption is unchanged: `voices[].text`, `place`, and `date` are
  never swept, and the comment explaining why stays.
- **`copy.test.ts`.** Add `src/trail/Arrival.tsx` and `src/trail/facingLine.ts`
  to `FILES`. Do NOT add `muir.json`. `NextMilepost.tsx` and `ReachedList.tsx`
  are already in the list and stay.

### 2.8 State helpers and `useWalker`

- **`state/personalLog.ts` (pure).**
  ```ts
  export function upsertFacingLine(state, milepostId, text, date): WalkerState;
  // text is already validated/collapsed by the caller. Empty text removes any
  // existing entry for that milepost; non-empty replaces or appends one.
  export function facingLineFor(state, milepostId): string; // "" when none
  ```
- **`trail/facingLine.ts`.** `parseFacingLine(input): { ok: true; text: string }`
  where `text` is trimmed, internal whitespace collapsed to single spaces, and
  truncated to `MAX_FACING_LINE_CHARS` (280). Empty input yields `{ ok: true,
  text: "" }` (allowed, means "no line"). Newlines collapse to spaces so it stays
  one line. No `ok: false` path is required; the field never blocks the walker.
- **`state/useWalker.ts`.**
  - `logMiles(miles)` computes `next` as today, sets state, and sets
    `pendingArrival` to `newlyReached(base, next)` (already implemented in
    `odometer.ts`, and already returned in ascending `mileMark` order because
    `computeReached` iterates `pack.mileposts`). CheckIn keeps calling
    `onLog(miles)` and does not need the return value.
  - `saveFacingLine(milepostId, text)` runs `parseFacingLine`, then
    `setState(prev => upsertFacingLine(prev, milepostId, parsed.text, todayISO()))`
    and persists optimistically (`void saveState(next).catch(reportError)`).
    Guarded: only callable when `state` is non-null (the walker has reached a
    milepost, so state exists).
  - Expose `{ status, state, logMiles, saveFacingLine, pendingArrival,
    clearPendingArrival }`.

### 2.9 Styling (`styles/app.css`)

- Arrival overlay: fixed, full viewport, above the Trail, `--paper` background,
  a constrained reading column (comfortable measure, generous line-height,
  larger body size than the Trail) for the verbatim text. Mobile-first at 390px,
  no horizontal scroll, content scrolls within the dialog.
- Multi-voice: each voice visually separated (spacing or a rule) with its author
  label subordinate.
- Position line and approach line on the Trail: quiet, subordinate to the
  distance figure and the check-in.
- Tappable reached rows: full-width buttons, >= 44px, `place` prominent, dateline
  and mile mark subordinate, pressed state on `:active`, visible `:focus-visible`
  (the global focus ring already applies).
- Honor `prefers-reduced-motion` for any transition added (matching the existing
  pattern).

### 2.10 API contracts

Unchanged. No application API. Static assets plus `GET /healthz`. All new state
is local (IndexedDB). No new endpoint, no network call, no LLM, no secrets.

---

## 3. Ordered task list (each with acceptance criteria)

### T1 — Pack schema: add the `approach` field
Evolve `Milepost` in `packs/types.ts`; document it in `SCHEMA.md`; add `approach`
to every `fixturePack` milepost; add S9 to `validatePack.ts` and prove it.
- **AC1.1** `Milepost` has `approach: string`; `npm run typecheck` passes with
  `strict`.
- **AC1.2** `SCHEMA.md` documents `approach` and its four rules (authored, short,
  ground-not-events, swept).
- **AC1.3** `validatePack` S9 returns a naming violation for a milepost whose
  `approach` is missing or blank, and returns `[]` for the (updated) fixture and
  Muir packs. `validatePack.test.ts` proves both.

### T2 — Author the Muir approach lines and verify them
Add an authored `approach` to all 38 Muir mileposts; add V8 to the source
verifier; sweep the approach lines.
- **AC2.1** Every Muir milepost has an `approach` line following §2.4.
- **AC2.2** V8 passes: for every milepost, the `approach` is not found in the
  cleaned Gutenberg source and is roughly 15 to 120 characters. The test names
  the offending milepost id on any miss.
- **AC2.3** V1 through V7 (EPIC 2) still pass unchanged: voices verbatim, no
  apparatus, dates ordered, miles monotonic, count and spread intact.
- **AC2.4** `muir.copy.test.ts` sweeps every `approach` (plus `title`,
  `framingNote`, `approxNote`) and finds zero hits. `voices[].text`, `place`, and
  `date` remain unswept, with the exemption comment intact.

### T3 — Walker state v2: the facing line, stored
Add `PersonalEntry`/`personalLog` and the v2 schema; upgrade the migration;
add the pure helpers and `parseFacingLine`; wire `useWalker`.
- **AC3.1** `state/types.ts` matches §2.2; `CURRENT_SCHEMA_VERSION` is `2`;
  `freshState` returns a v2 record with `personalLog: []`; typecheck passes.
- **AC3.2** `migrate` upgrades a literal v1 record (`schemaVersion: 1`, no
  `personalLog`) to a v2 record with `personalLog: []`, preserving `dailyLog`,
  `cumulativeMiles`, and `reachedMilepostIds`. An unknown/absent version still
  returns `null`. `store.test.ts` proves the v1 -> v2 upgrade and the round-trip
  with `personalLog`.
- **AC3.3** `upsertFacingLine` and `facingLineFor` behave per §2.8 (upsert by
  milepostId, empty text removes the entry), proven by `personalLog.test.ts`.
- **AC3.4** `parseFacingLine` trims, collapses whitespace to single spaces,
  caps at 280 chars, and allows empty, proven by `facingLine.test.ts`.
- **AC3.5** `useWalker` exposes `saveFacingLine`, `pendingArrival`, and
  `clearPendingArrival`; `logMiles` sets `pendingArrival` to the newly reached
  ids in ascending mile order.

### T4 — The Arrival ceremony
Build `trail/Arrival.tsx` and its styles per §2.5 and §2.9; extract the shared
`dateline` helper.
- **AC4.1** Given a reached milepost, the Arrival renders the dateline, the
  place, every voice's verbatim text with its author, the `approxNote`, and the
  pack `framingNote`, in a readable typographic setting, usable at 390px with no
  horizontal scroll.
- **AC4.2** Multi-voice: given a milepost with two voices, both render, each
  attributed and visually separated, neither dropped nor merged. Proven with a
  small inline two-voice test pack in `Arrival.test.tsx` (do not alter the Muir
  pack, which is single-voice).
- **AC4.3** The facing-line field is prefilled from `personalLog`, saves the
  walker's line (optimistic), and shows the saved line when the same milepost is
  re-opened. Empty input clears the stored line.
- **AC4.4** Accessibility: `role="dialog"`, `aria-modal`, labelled heading, focus
  moves in on open and returns on close, `Escape` closes, focus stays within the
  dialog, one clear primary action, the close control is >= 44px.
- **AC4.5** For a multi-milepost queue, "Next entry" advances in ascending mile
  order and saves the current line first; the last step reads "Back to the trail"
  and closes.

### T5 — Strict withholding and no skipping ahead
Guard the reveal at the render boundary and wire auto-open on crossing.
- **AC5.1** The Arrival filters its queue to ids in `reachedMilepostIds` and
  renders nothing (and closes) for an unreached id: a component test that passes
  an unreached id asserts that milepost's voice text is absent from the DOM.
- **AC5.2** Crossing a milepost auto-opens the Arrival for exactly the newly
  reached id(s): a Trail test logs miles past the first Muir milepost and asserts
  its verbatim first line appears in the opened Arrival, while the next
  milepost's text stays absent from the DOM.
- **AC5.3** There is no affordance to open an unreached milepost: the Trail shows
  no row, no button, and no text for any milepost whose id is not in
  `reachedMilepostIds`. Proven against the real Muir pack below a given mileMark.

### T6 — The Trail's non-unlock-day payoff
Enhance `NextMilepost.tsx` with current position and the approach line.
- **AC6.1** On a non-unlock day the Trail shows: the odometer (current miles), a
  current-position line naming the last milepost passed (or a start line before
  any milepost), the exact distance to the next milepost in miles, and the next
  milepost's authored `approach` line.
- **AC6.2** The approach line does not spoil the entry: `NextMilepost.test.tsx`
  asserts the next milepost's `voices[].text` is absent from the Trail while its
  `approach` line is present, for a pack state short of that milepost.
- **AC6.3** When every milepost is reached, the existing completion note shows and
  no next-distance or approach line is rendered.

### T7 — Re-readable reached list and the Trail rewire
Turn `ReachedList.tsx` into tappable rows; rewire `Trail.tsx`; move framing into
Arrival; update the Trail tests to the new flow.
- **AC7.1** Each reached milepost is a compact, tappable, keyboard-focusable row
  (place, dateline, mile mark, >= 44px). Tapping re-opens that entry's Arrival
  with its verbatim text and the walker's saved line. No `voices[].text` renders
  in the row list.
- **AC7.2** Re-readability survives a reload: `persistence.e2e.ts` crosses the
  first Muir milepost, sees the entry in the Arrival, returns to the Trail,
  reloads, and re-opens the reached row to read the same verbatim entry again,
  with the odometer restored.
- **AC7.3** The framing note renders in the Arrival surface (not in the Trail
  body); the Trail no longer renders any milepost verbatim text.
- **AC7.4** `Trail.test.tsx` and `Trail.muir.test.tsx` are updated so their
  withhold and SEED_DEMO assertions exercise the Arrival flow (reached rows
  present on load; verbatim text present only after the row is opened or after a
  fresh crossing). The SEED_DEMO odometer totals (14 for the fixture, 32 for
  Muir) are unchanged.

### T8 — Sweep, e2e, and definition of done
Wire the copy sweep, add the Arrival e2e, and confirm the whole gate.
- **AC8.1** `copy.test.ts` includes `Arrival.tsx` and `facingLine.ts` and passes;
  a manual sweep of every string this EPIC adds (labels, buttons, placeholder,
  position line, approach lines, fixture approach copy) finds no em/en dashes, no
  " - " breaks, no banned vocabulary, and no negative empty-state phrasing.
- **AC8.2** `arrival.e2e.ts` passes: from a fresh app, log enough miles to cross
  the first Muir milepost, read the verbatim entry in the Arrival, write a facing
  line, return to the Trail, confirm the reached row is present, re-open it and
  see the same entry with the saved line.
- **AC8.3** `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run validate:packs`, and `npm run test:e2e` all pass.
- **AC8.4** The Non-Goals held: no badge, medal, point, level, streak counter,
  social/share affordance, journal screen, export, picker, walkthrough, second
  pack, map, unit toggle, or runtime generation was added. `README.md`'s code map
  stays accurate and carries no factory internals.

---

## 4. Test plan (which automated test proves each criterion)

Every criterion is proven by an automated test under `web/`, run by `npm test`,
`npm run validate:packs` (pack tests), and `npm run test:e2e` (Playwright).

### Planner acceptance criterion → tests
- **Crossing opens Arrival with entry, dateline, place, near-this-ground note,
  and a facing-line field** → `Arrival.test.tsx` (AC4.1, AC4.3),
  `Trail.muir.test.tsx` auto-open (AC5.2), `arrival.e2e.ts` (AC8.2).
- **Entries strictly withheld; no reading ahead; no skipping** →
  `Arrival.test.tsx` unreached-id guard (AC5.1), `Trail.muir.test.tsx` withhold
  (AC5.2), Trail no-affordance test (AC5.3), `NextMilepost.test.tsx` no-spoiler
  (AC6.2).
- **Multi-voice renders cleanly** → `Arrival.test.tsx` with the inline two-voice
  test pack (AC4.2).
- **Trail non-unlock day: position, exact distance in units, approach line
  without spoiling** → `NextMilepost.test.tsx` (AC6.1, AC6.2), `muir.verify.test.ts`
  V8 authored-not-verbatim (AC2.2).
- **Reached entry re-readable from the Trail** → `ReachedList`/`Trail` re-open
  test (AC7.1), `persistence.e2e.ts` (AC7.2), `arrival.e2e.ts` (AC8.2).
- **All states designed; feedback < 100ms; mobile-first** → existing Trail state
  tests stay green; `Arrival.test.tsx` accessibility and 390px assertions
  (AC4.4); optimistic save mirrors the established `logMiles` pattern;
  `mobile.e2e.ts` continues to prove no horizontal scroll at 390px (extend it to
  open the Arrival if practical).

### Schema, validator, verifier
- **validatePack.test.ts** → AC1.3 (S9 bites; both packs valid).
- **muir.verify.test.ts** → AC2.2 (V8), AC2.3 (V1 through V7 unchanged).
- **muir.copy.test.ts** → AC2.4 (approach swept; primary text exempt).
- **typecheck** → AC1.1, AC3.1.

### State and helpers
- **store.test.ts** → AC3.2 (v1 -> v2 upgrade; round-trip with personalLog).
- **personalLog.test.ts** → AC3.3 (upsert/read; empty removes).
- **facingLine.test.ts** → AC3.4 (trim, collapse, cap, empty allowed).

### Copy and e2e
- **copy.test.ts** → AC8.1 (new files swept).
- **arrival.e2e.ts / persistence.e2e.ts / mobile.e2e.ts** → AC7.2, AC8.2, and the
  mobile pass.

---

## 5. Definition of done
- Crossing a milepost opens the Arrival ceremony: the verbatim entry in a
  readable setting, with dateline, place, the "near this ground" note, the
  framing note, and a facing-line field. Multi-voice mileposts render every voice
  cleanly.
- Withholding is airtight: an unreached milepost's verbatim text is absent from
  the DOM, there is no affordance to open it or skip to it, and the render
  boundary is guarded in both the Trail and the Arrival.
- The facing line is written, validated at the boundary, stored via a
  non-destructive v1 -> v2 migration, and shown again when the entry is re-opened.
- The Trail's non-unlock day shows current position, the exact distance to the
  next milepost in miles, and one authored, non-spoiling approach line proven
  authored (not verbatim source) by the verifier.
- Every reached entry is re-readable from the Trail and survives a reload.
- All designed states hold; interaction feedback is synchronous (< 100ms);
  every new surface is usable at 390px with visible focus and full keyboard reach.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run validate:packs`, and
  `npm run test:e2e` all pass. The copy sweep is clean across every authored
  string, and Muir's verbatim text stays exempt and unedited.
- No non-goal was built (no gamification, streaks, sharing, journal/export,
  picker, walkthrough, second pack, map, unit toggle, or runtime generation).
```