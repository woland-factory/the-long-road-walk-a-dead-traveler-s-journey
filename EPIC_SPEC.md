# EPIC SPEC — Journey pack format and the Muir pack (the content engine)

*The Long Road: walk a dead traveler's journey, mile for mile, diary for diary.*

## Quality differentiator (this app must win here)

**The substance of the payoff.** Every rival virtual-journey product rewards
distance with medals, points, postcards, or cartoon scenery. This app rewards
distance with a real dead person's actual words, verbatim, keyed to the exact
ground you reached, and it withholds tomorrow's entry until your feet earn it.
We compete on the meaning of the reward, not on gamification, breadth, or
automation.

**What that demands of THIS epic.** This is the EPIC where the reward stops
being a placeholder and becomes real. EPIC 1 proved the withhold-then-reveal
loop with invented fixture lines. This EPIC pours the actual verbatim words of a
real dead traveler into that exact loop. The whole differentiator now rests on
one promise: the words the walker earns are John Muir's own, unedited, keyed to
real ground he actually reached. That promise is only worth anything if it is
machine-proven, not hand-checked. So the heart of this EPIC is not UI, it is a
build-time verifier that fails the build unless every earned line is byte-for-byte
Muir. If a single word is paraphrased, softened, or borrowed from a copyrighted
editor, the differentiator is a lie. Build the verifier as if a historian will
audit the output, because the product's one claim to meaning is exactly this.

---

## 1. Scope

### In scope
- **A documented journey-pack schema**, defined once, as the contract every pack
  (this one and future ones) must satisfy: TypeScript types plus a prose schema
  document.
- **A pack validator** (structural + intra-pack semantic rules) that runs as part
  of the test suite and fails the build on any violation.
- **A committed public-domain source** for John Muir's *A Thousand-Mile Walk to
  the Gulf* (Project Gutenberg #60749), used only at test time as the ground
  truth for verification.
- **A build-time source verifier** that machine-checks the Muir pack against that
  committed source: entry dates ordered, cumulative `mileMark` strictly
  increasing, every `voices[].text` verbatim (byte-identical after a defined
  whitespace normalization, apparatus excluded), at least 30 mileposts spread
  across the route, and no editorial apparatus in any voice text.
- **The real Muir pack** (`muir.json`): at least 30 verified mileposts, each with
  a real place, a real date, an `approxNote` phrased as "near this ground", and
  Muir's verbatim words. Plus a short, plain framing note for the period content.
- **Wiring the Muir pack into the existing EPIC 1 loop in place of the fixture**:
  the running app drives its odometer, reveal, and reached-list against the Muir
  pack. This includes the small render and seed changes the new schema requires
  (the reached list renders `voices`; the `SEED_DEMO` seed crosses a real Muir
  milepost; the framing note is shown where real period text can be read).
- **Surfacing the framing note** in the loop so real 1867 period content is never
  presented without its frame.

### Out of scope (Non-goals — binding, do not build)
- **No second pack.** Only Muir. Do not add Lewis & Clark or any other journey
  (that is EPIC 6).
- **No user-submitted or user-editable packs.** Packs are curated and shipped in
  the repo. No upload surface, no pack editor.
- **No map polyline.** Coarse `mileMark` positioning is sufficient. The `route`
  field stays optional and is left unpopulated this EPIC. Do not render a map.
- **No runtime text generation.** No LLM, no BYOK surface, no paraphrase engine.
  The corpus is curated and verified at build time and served verbatim.
- **No Arrival ceremony and no double-journal screen.** The reached entries stay
  shown inline on the Trail exactly as EPIC 1 shows them (EPIC 3 owns the reveal
  ceremony; EPIC 4 owns the journal). This EPIC changes *what* text the loop
  reveals (real Muir), not the ceremony around it.
- **No unit switching, no accounts, no server state.** Unchanged from EPIC 1.

### Interpretations resolved (so the implementer never has to guess)
These are decisions the planner's criteria imply but do not spell out. They are
resolved here; do not re-litigate them, and do not treat them as license to
expand scope.

1. **"Byte-identical" means verbatim after a defined whitespace normalization,
   with editorial apparatus excluded.** The Gutenberg plain text is
   machine-wrapped at ~70 columns, marks italics with `_underscores_`, and
   carries the editor's bracketed insertions (`[rolling Fork]`), footnote markers
   (`[1]`), and `[Illustration]` tags. Reproducing hard-wrap newlines or `_`
   markers in the app would render badly, and the bracketed matter is the
   editor's, not Muir's. So "byte-identical" is enforced as: after removing `_`
   markers and any `[...]` bracketed spans from the source, and collapsing every
   run of whitespace to a single space on both sides, each `voices[].text` MUST
   be an exact substring of the source's narrative body. This preserves every one
   of Muir's words and their order exactly, with zero paraphrase, and is the only
   workable reading of the criterion. Section 2.5 gives the exact algorithm.

2. **"Entry dates strictly ordered" means non-decreasing; `mileMark` is strictly
   increasing.** A real one-way walk can pass two mileposts on one long day, so
   dates may repeat, but the walk never goes backward: `date[i] >= date[i-1]`.
   `mileMark` is strictly increasing (`mileMark[i] > mileMark[i-1]`), which alone
   guarantees every milepost is a distinct position on the route.

3. **The primary text is exempt from the copy sweep; the framing note is not.**
   QUALITY BAR §8 bans em-dashes and period phrasing in user-visible strings.
   Muir's 1867 prose is full of both, and the criterion says the text is "framed,
   never edited." Editing Muir to pass the sweep would break the verbatim promise
   this whole product is built on. Resolution, backed by the plan's own EPIC 7
   scope ("copy sweep across every user-visible string and every shipped pack
   framing note"): the sweep covers our authored copy (the `framingNote`, each
   `approxNote`, the pack `title`, and all UI strings) and MUST NOT be run over
   `voices[].text` or `place` (real toponyms drawn from the source). The framing
   note is where the human, present-day voice lives and must clear the sweep. See
   §2.7 and T6.

---

## 2. Technical design

### 2.1 Files and modules to touch

```
web/src/packs/
  types.ts               # CHANGE: evolve Milepost + JourneyPack to the real schema (2.2)
  SCHEMA.md              # NEW: the documented pack schema (the contract)
  fixturePack.ts         # CHANGE: update to the new schema (keeps EPIC 1 unit tests green)
  muir.json              # NEW: the real, verified Muir pack (bundled via a typed import)
  muir.ts                # NEW: typed re-export -> `export const muirPack: JourneyPack`
  validatePack.ts        # NEW: structural + intra-pack semantic validator (pure, no fs)
  verifySource.ts        # NEW: normalization + source-window helpers used by the verifier test
  sources/
    gutenberg-60749.txt  # NEW: committed public-domain source, read only by tests (never imported)
  validatePack.test.ts   # NEW: runs validatePack over muir + fixture; asserts zero violations
  muir.verify.test.ts    # NEW: source verification against gutenberg-60749.txt
  muir.copy.test.ts      # NEW: copy sweep over Muir's AUTHORED fields only (not voices/place)

web/src/
  App.tsx                # CHANGE: mount the Trail against muirPack (replaces fixturePack)
  trail/ReachedList.tsx  # CHANGE: render voices[] (author + text) and the dateline
  state/seed.ts          # CHANGE: make the SEED_DEMO seed pack-aware (cross a real milepost)
  copy.test.ts           # CHANGE: keep scanning fixturePack.ts; do NOT add muir.json's voices

web/                     # docs
README.md                # CHANGE: add a short "The journeys" / provenance section
```

The existing `web/src/trail/validate.ts` (mile-input validation) is a different
concern. Name the pack validator `packs/validatePack.ts` to avoid confusion.

### 2.2 Data model (forward-only; the schema defined once)

Evolve the placeholder `Milepost` from EPIC 1 (a single `text` field) into the
real schema from the product plan's data-model sketch:

```ts
// packs/types.ts
export interface Voice {
  author: string;   // e.g. "John Muir"
  text: string;     // verbatim public-domain source. Framed, never edited.
                    // EXEMPT from the copy sweep (see 2.7).
}

export interface Milepost {
  id: string;         // unique within the pack, a stable slug (e.g. "muir-03-munfordville")
  mileMark: number;   // cumulative miles reached; strictly increasing across mileposts
  date: string;       // YYYY-MM-DD of the entry; non-decreasing across mileposts
  place: string;      // a real place on the route (drawn from Muir's text/geography)
  approxNote: string; // approximate-location framing; contains "near this ground"; never coordinates
  voices: Voice[];    // >= 1 entry. For Muir, exactly one (a single traveler).
}

export interface PackSource {
  name: string;        // "A Thousand-Mile Walk to the Gulf"
  author: string;      // "John Muir"
  gutenbergId: number; // 60749
  url: string;         // canonical source URL used to fetch the committed text
  license: string;     // "Public domain (Project Gutenberg)"
}

export interface JourneyPack {
  id: string;                    // e.g. "muir-thousand-mile-walk"
  title: string;                 // "A Thousand-Mile Walk to the Gulf"
  traveler: string;              // "John Muir"
  years: string;                 // "1867"
  totalMiles: number;            // ~1000
  source: PackSource;            // provenance for verification and the README
  framingNote: string;           // authored, plain period-content note (swept)
  route?: [number, number][];    // optional coarse polyline; NOT populated this EPIC
  mileposts: Milepost[];         // ordered ascending by mileMark
}
```

**Migration note (no WalkerState change).** `WalkerState` is unchanged;
`schemaVersion` stays `1`. The pack a walker is on is data (`activePackId`), not
schema, so no IndexedDB migration is needed. The odometer already recomputes
`cumulativeMiles` and `reachedMilepostIds` from the daily log against whatever
pack is active (`state/odometer.ts::recompute`), so any stale fixture-era state
in a developer's browser self-heals against the Muir pack on load. This is safe
because the product is pre-launch and EPIC 1 shipped only a throwaway fixture.

### 2.3 Where the pack lives and how it "loads"

Ship `muir.json` as a committed JSON file, imported at build through a typed
re-export (`muir.ts`: `import data from "./muir.json"; export const muirPack =
data as JourneyPack`). Vite bundles JSON imports, so the pack "loads and drives
the loop" with no runtime fetch and no new loading/error surface. This is the
smallest change that satisfies the criterion.

Do NOT build a `/packs/<id>.json` runtime fetch layer this EPIC. The plan's
static-endpoint serving model becomes useful once there is a journey picker with
more than one pack (EPIC 5/6); building it now is speculative generality against
SCOPE DISCIPLINE §2. Keep the source-of-truth as data (JSON) validated by the
verifier; keep loading as a build-time import.

`muir.json` (bundled) is expected to be a few tens of KB, which is fine for first
render. `sources/gutenberg-60749.txt` (~hundreds of KB) MUST NOT be imported by
any app module. It is read only via `fs` in the verifier test, so it never enters
the client bundle.

### 2.4 Obtaining and committing the source

- Download the Project Gutenberg #60749 plain-text ebook from
  `https://www.gutenberg.org/files/60749/60749-0.txt` (record this exact URL in
  `source.url`).
- Commit it verbatim at `web/src/packs/sources/gutenberg-60749.txt`. Normalize
  line endings to `\n` on commit for a deterministic repo; content is otherwise
  untouched. (The verifier's whitespace normalization makes line endings
  irrelevant to the comparison, but a consistent file keeps diffs clean.)
- If the source cannot be obtained in the build environment, do NOT fabricate or
  paraphrase text. Set `outcome: "blocked"` and say so: the pack cannot be
  verified without its ground truth.

The file is public domain (US, 1916 edition, copyright expired) and is safe to
commit and publish.

### 2.5 The source verifier (the heart of this EPIC)

Implement pure helpers in `verifySource.ts` and drive them from
`muir.verify.test.ts`. The verifier reads the committed source with `fs` and
proves every claim below. Any failure fails the test, which fails the build.

**Normalization / cleaning algorithm (define exactly, use on both sides):**

```
cleanSource(raw):
  1. Take the narrative window: the substring from the first occurrence of
     NARRATIVE_START to the first occurrence of GUTENBERG_END_MARKER.
       NARRATIVE_START     = "I had long been looking from the wildwoods and gardens of the Northern States"
       GUTENBERG_END_MARKER = "*** END OF THE PROJECT GUTENBERG EBOOK"
     Starting at the narrative excludes the editor's (Badè's) introduction, so a
     paraphrase living only in the introduction can never match.
  2. Remove all "_" characters (Gutenberg italic markers).
  3. Remove every "[...]" span (editor insertions, footnote markers like "[1]",
     and "[Illustration]" tags). Use a non-greedy bracket match.
  4. Collapse every run of whitespace (spaces, tabs, CR, LF) to a single space.
  5. Trim.

normalizeExcerpt(text):
  Collapse every run of whitespace to a single space; trim. (No "_" or "[...]"
  stripping here: the pack text must already be clean; see the guards below.)
```

**Checks (all machine-verified in `muir.verify.test.ts`):**

- **V1 Verbatim.** For every milepost, for every voice,
  `cleanSource(raw).includes(normalizeExcerpt(voice.text))` is true. A single
  miss fails the build and names the offending milepost id.
- **V2 No apparatus in the pack.** No `voice.text` contains `[` or `]` or `_`.
  This guarantees the pack itself carries none of the editor's brackets, footnote
  markers, or italic markup. (V1 removes them from the source; V2 forbids them in
  the pack.)
- **V3 Non-trivial excerpts.** Every `voice.text` is at least ~40 characters and
  contains at least one sentence-ending period, so a milepost cannot "pass" on a
  meaningless three-word fragment. (The reward must be a real diary passage.)
- **V4 Dates ordered.** `mileposts[i].date >= mileposts[i-1].date` for all i
  (string compare on `YYYY-MM-DD` is chronological). Each `date` matches
  `^\d{4}-\d{2}-\d{2}$`, is a real calendar date, and its year equals the
  documented journey year (1867).
- **V5 Miles strictly monotonic.** `mileposts[i].mileMark > mileposts[i-1].mileMark`
  for all i. Every `mileMark` is a finite number in `(0, totalMiles]`.
- **V6 Count.** `mileposts.length >= 30`.
- **V7 Spread across the route.** The first milepost's `mileMark <= 50`; the last
  milepost's `mileMark >= 0.9 * totalMiles`; and no gap between consecutive
  `mileMark` values exceeds 50 miles. This makes "spread across the route so the
  ritual pays off at casual pace" (~one reward every ≤2 to 3 weeks at a casual
  ~3 mi/day) a testable property, not a vibe.

`NARRATIVE_START` and `GUTENBERG_END_MARKER` are stored as named constants in
`verifySource.ts` with a comment tying them to the committed source. If the
committed file's exact wording differs, the implementer sets these constants to
match the actual bytes (the report used to write this spec confirms the opening
sentence and the standard Gutenberg end marker).

### 2.6 The structural validator (applies to every pack)

`validatePack(pack): string[]` in `validatePack.ts` returns a list of human
-readable violations (empty = valid). Pure, no `fs`, no source access, so it runs
on the fixture and the Muir pack alike. `validatePack.test.ts` asserts it returns
`[]` for both packs. Rules:

- **S1** `id`, `title`, `traveler`, `years` are non-empty strings; `totalMiles`
  is a finite number > 0.
- **S2** `source` is present: `name`, `author`, `license` non-empty strings;
  `gutenbergId` a number; `url` a string.
- **S3** `framingNote` is a non-empty string.
- **S4** `mileposts` is a non-empty array; every milepost `id` is a non-empty
  string and unique within the pack.
- **S5** Every milepost: `mileMark` finite number > 0; `date` matches
  `^\d{4}-\d{2}-\d{2}$`; `place` non-empty string; `voices` an array with >= 1
  entry, each with non-empty `author` and non-empty `text`.
- **S6** `mileMark` strictly increasing across mileposts (structural echo of V5,
  so any pack is caught even without a source file).
- **S7** `date` non-decreasing across mileposts (structural echo of V4).
- **S8 approxNote framing.** Every `approxNote` is a non-empty string that
  contains the phrase `near this ground` (case-insensitive) and contains NO
  false GPS precision: it must not match a decimal-degrees coordinate pattern
  (e.g. `\d+\.\d+\s*[,°]`), and must not contain the tokens `lat`, `lng`, `lon`,
  or `gps` (case-insensitive). This enforces "a real place, framed as near this
  ground, never false GPS precision."

The Muir-only properties (V1, V3, V6, V7, and the year check) live in the source
verifier (§2.5), not in `validatePack`, because the fixture legitimately has 3
mileposts and invented text.

### 2.7 Copy sweep and the primary-source exemption

- The existing `web/src/copy.test.ts` keeps scanning `fixturePack.ts` (our sample
  copy). Do NOT add `muir.json` to that file's whole-file scan: it would read
  Muir's verbatim text and fail on his em-dashes and period phrasing, which we
  are forbidden to edit.
- Add `muir.copy.test.ts` that loads `muir.json` and sweeps ONLY the authored
  fields: `pack.title`, `pack.framingNote`, and every `milepost.approxNote`. It
  applies the same three sweeps as `copy.test.ts` (no `—`/`–`/`" - "`; no banned
  vocabulary; no negative empty-state phrasing) and asserts zero hits.
- `voices[].text`, `place`, and `date` are the primary source / factual data and
  are explicitly NOT swept. Add a one-line comment in `muir.copy.test.ts` stating
  this exemption and why, so a later reviewer does not "fix" Muir's punctuation.

### 2.8 Wiring the pack into the loop

- **App.tsx**: `import { muirPack } from "./packs/muir"` and render
  `<Trail pack={muirPack} />`. The fixture stays in the repo for the EPIC 1 unit
  tests only; nothing user-facing imports it.
- **ReachedList.tsx**: the new schema replaces `milepost.text` with
  `milepost.voices[]`. Render each reached milepost's `voices` (author label plus
  the verbatim text) and add a dateline from `milepost.date`. For Muir this is a
  single voice. Keep it minimal: this is not the Arrival ceremony (EPIC 3). The
  withhold-then-reveal boundary is unchanged: text renders only for ids in
  `reachedMilepostIds`.
- **NextMilepost.tsx / odometer.ts / store.ts**: no logic change. They already
  read `mileMark`, `place`, and `id` generically.
- **state/seed.ts (`buildSeededState`)**: make the `SEED_DEMO` seed pack-aware so
  the demo crosses real Muir mileposts. Seed two dated entries whose cumulative
  total lands just past the pack's SECOND milepost, so a stranger sees two earned
  real entries and one still withheld (the same shape EPIC 1 demoed). Concretely:
  `entry1 = pack.mileposts[0].mileMark + 1`, then
  `entry2 = (pack.mileposts[1].mileMark + 2) - entry1`, logged on two fixed dates.
  For the fixture (first mark 5, second 12) this yields 6 then 8 (total 14), so
  EPIC 1's existing `SEED_DEMO` test is unaffected. For Muir it crosses Muir's
  first two real mileposts. Guard for packs with fewer than two mileposts by
  falling back to crossing the first milepost only (not reachable for Muir or the
  fixture, but keep the function total).
- **Framing display**: surface `pack.framingNote` on the Trail so real 1867
  period content is never shown unframed. Minimal: a short `<section>` near the
  top of the Trail (or immediately above the reached list) that renders the
  framing note under a short heading. No new screen. This is authored copy and is
  swept (§2.7).

### 2.9 CI / build gate

The validator and verifier are Vitest tests under `web/src/packs/`, so
`npm test` (the suite the factory already runs as the gate, per EPIC 1's DoD)
fails the build on any violation. Add a focused script for humans and CI clarity:
`"validate:packs": "vitest run src/packs/"` in `web/package.json`. Note that
`npm run build` (`tsc --noEmit && vite build`) does not run tests, so the gate
that enforces "fails the build on any violation" is `npm test` / `validate:packs`;
state this in the README's contributing/test section.

### 2.10 API contracts

Unchanged from EPIC 1. No application API; static assets plus `GET /healthz`.
The pack is bundled data, not an endpoint, this EPIC.

---

## 3. Ordered task list (each with acceptance criteria)

### T1 — Define the schema once (types + docs) and update the fixture
Evolve `packs/types.ts` to the schema in §2.2; write `packs/SCHEMA.md` documenting
every field, its rules, and the verbatim/framing promises; update
`packs/fixturePack.ts` to the new schema so existing tests still compile.
- **AC1.1** `packs/types.ts` exports `Voice`, `Milepost`, `PackSource`, and
  `JourneyPack` exactly as in §2.2; `npm run typecheck` passes with `strict`.
- **AC1.2** `SCHEMA.md` documents every field and states the three binding rules
  in plain language: dates non-decreasing, `mileMark` strictly increasing, and
  `voices[].text` verbatim and never edited.
- **AC1.3** The updated `fixturePack.ts` satisfies the new types (each milepost
  has a `date` and a `voices` array; the pack has `source`, `years`, and a
  `framingNote`) and keeps the substrings the EPIC 1 Trail tests assert on
  ("We crossed the river at dawn", "We rested on the ridge", "We reached the
  meadow by evening") inside its voice text. All EPIC 1 unit tests still pass.

### T2 — Structural validator + test
Implement `validatePack.ts` (§2.6) and `validatePack.test.ts`.
- **AC2.1** `validatePack(muirPack)` and `validatePack(fixturePack)` both return
  `[]`.
- **AC2.2** The test proves each rule bites: for representative broken inputs
  (a repeated `mileMark`, a backward `date`, an `approxNote` missing "near this
  ground", an `approxNote` carrying a `lat`/coordinate token, a milepost with an
  empty `voices` array, a duplicate milepost id) `validatePack` returns a
  non-empty list naming the violation.
- **AC2.3** `npm run validate:packs` exists and runs the pack tests; a violation
  makes it exit non-zero.

### T3 — Commit the source and build the source verifier
Commit `sources/gutenberg-60749.txt` (§2.4); implement `verifySource.ts` and
`muir.verify.test.ts` (§2.5).
- **AC3.1** The committed source contains `NARRATIVE_START` and
  `GUTENBERG_END_MARKER`; `cleanSource` returns a non-empty narrative body.
- **AC3.2** V1 passes: every `voices[].text` in the Muir pack is found verbatim in
  the cleaned source. The test reports the offending milepost id on any miss.
- **AC3.3** V2 and V3 pass: no voice text contains `[`, `]`, or `_`; every voice
  text is a substantial passage (≥ ~40 chars, at least one sentence).
- **AC3.4** V4 and V5 pass: dates non-decreasing, all `YYYY-MM-DD`, year 1867;
  `mileMark` strictly increasing within `(0, totalMiles]`.
- **AC3.5** V6 and V7 pass: at least 30 mileposts; first `mileMark <= 50`; last
  `>= 0.9 * totalMiles`; no consecutive gap > 50 miles.
- **AC3.6** The source file is read only via `fs` in the test and is not imported
  by any app module (grep the bundle: `dist/**` after build contains none of a
  sentinel sentence unique to the source outside of the packed mileposts' own
  text).

### T4 — Author the Muir pack
Produce `muir.json` (and the typed `muir.ts` re-export): ≥30 mileposts along the
~1000-mile 1867 walk, each with a real place, a real 1867 date, an `approxNote`
using "near this ground", and Muir's verbatim words selected to pass T2 and T3.
- **AC4.1** `muir.json` passes `validatePack` (T2) and the full source verifier
  (T3) with zero violations.
- **AC4.2** `source` records `name`, `author`, `gutenbergId: 60749`, the exact
  download `url`, and `license: "Public domain (Project Gutenberg)"`.
- **AC4.3** Places and dates are real: each milepost names a place Muir actually
  passed and a date consistent with the source's dated entries; mile marks
  approximate the cumulative distance along his route (no false precision).
- **AC4.4** `muir.ts` exports `muirPack: JourneyPack` and `App.tsx` imports it.

### T5 — Drive the EPIC 1 loop with the Muir pack
Wire `App.tsx` to `muirPack`; update `ReachedList.tsx` to render `voices` + the
dateline; make `state/seed.ts` pack-aware (§2.8).
- **AC5.1** The running app renders the Trail against the Muir pack: the odometer,
  next-milepost distance, and reached list all read from `muirPack`.
- **AC5.2** Withhold-then-reveal still holds: a Muir milepost's verbatim text is
  absent from the DOM until the odometer reaches its `mileMark`, and present after
  crossing. Proven by a component test using the real pack (log miles past the
  first milepost; assert its first line appears and the second milepost's text
  does not).
- **AC5.3** With `SEED_DEMO` on and a fresh database, first load shows the
  odometer past Muir's second milepost with the first two real entries revealed
  and the third withheld. With `SEED_DEMO` off, the empty Trail shows (unchanged).
- **AC5.4** The EPIC 1 `SEED_DEMO` fixture test (14 miles, fx-1 and fx-2 reached,
  fx-3 withheld) still passes unchanged, confirming the pack-aware seed is
  backward-compatible with the fixture.

### T6 — Framing note: author it, surface it, protect the primary text
Author `framingNote`; render it on the Trail; add `muir.copy.test.ts`; keep the
primary-source exemption (§2.7).
- **AC6.1** `pack.framingNote` is a short, plain note that names the period
  (Muir walked the Reconstruction South in 1867), says the words are his exact,
  unedited words, and reads as a present-day human wrote it. Suggested copy (sweep
  before shipping; adjust freely as long as it stays swept and honest):
  > John Muir wrote these pages in 1867, walking through the American South just
  > after the Civil War. He carries the views and language of his time, including
  > remarks about the people he met that many readers today will find wrong and
  > hurtful. You are reading his exact words, kept as he wrote them. We do not
  > soften or edit them. This is a primary source from history, not a voice from
  > now.
- **AC6.2** The framing note is visible on the Trail where real entries can be
  read (a short framed section, not a separate screen).
- **AC6.3** `muir.copy.test.ts` sweeps `title`, `framingNote`, and every
  `approxNote` and finds zero hits (no dashes, no banned vocabulary, no negative
  empty-state phrasing). `voices[].text` and `place` are not swept, and a comment
  in the test records why.
- **AC6.4** The existing `copy.test.ts` still passes and still does not scan
  `muir.json`'s verbatim text.

### T7 — README provenance + definition of done
Add a short "The journeys" / provenance section to `README.md` and confirm the
whole gate.
- **AC7.1** `README.md` names the Muir journey, its Project Gutenberg source
  (#60749) and public-domain status, and states plainly that the diary text is
  the traveler's own words, verbatim, framed but never edited.
- **AC7.2** `README.md` documents how to run the pack validation
  (`npm run validate:packs` / `npm test`) in its test/contributing section, and
  where packs and their sources live.
- **AC7.3** README additions clear the copy sweep (no dashes, no banned vocab, no
  negative phrasing) and contain no factory internals.

---

## 4. Test plan (which automated test proves each criterion)

Every criterion is proven by an automated test under `web/src/packs/` (run by
`npm test` and `npm run validate:packs`), plus the existing EPIC 1 suites which
must stay green.

### Pack schema and validator
- **validatePack.test.ts** → AC2.1, AC2.2, AC1.3. Asserts `validatePack` returns
  `[]` for both the Muir pack and the fixture, and returns a naming violation for
  each seeded broken input (duplicate/repeated `mileMark`, backward `date`,
  `approxNote` without "near this ground", `approxNote` with a coordinate/`lat`
  token, empty `voices`, duplicate id).
- **typecheck** → AC1.1. `npm run typecheck` passes with the new types.

### Source verification (the differentiator's proof)
- **muir.verify.test.ts** → AC3.1–AC3.6, AC4.1, AC4.3. Reads
  `sources/gutenberg-60749.txt` via `fs`, builds `cleanSource`, and runs V1–V7.
  Reports the offending milepost id on any verbatim miss. Also asserts the source
  file is not importable app code (a build-output grep for a sentinel source
  sentence that is not one of the packed excerpts).

### Loop integration
- **ReachedList / Trail component test (real pack)** → AC5.1, AC5.2. Renders the
  Trail against `muirPack`, logs miles across the first two mileposts, asserts the
  first milepost's verbatim line appears only after its `mileMark` is crossed and
  the next milepost's text stays absent (withhold-then-reveal with real text).
- **SEED_DEMO test (real pack)** → AC5.3. Mocks `SEED_DEMO=true` and a fresh DB;
  asserts the odometer is past Muir's second milepost and the first two real
  entries are revealed, the third withheld.
- **Existing EPIC 1 suites** → AC5.4, AC1.3. `odometer.test.ts`, `store.test.ts`,
  `Trail.test.tsx` (including its `SEED_DEMO` 14-mile fixture case) and the
  Playwright e2e suite all still pass against the updated fixture and pack-aware
  seed.

### Copy and framing
- **muir.copy.test.ts** → AC6.1, AC6.3. Sweeps only `title`, `framingNote`, and
  `approxNote`s for dashes, banned vocabulary, and negative phrasing.
- **copy.test.ts** → AC6.4. Still green; still limited to authored EPIC 1 copy
  and the fixture (never Muir's verbatim text).
- **Framing render assertion** (in the Trail component test) → AC6.2. Asserts the
  framing note text is present on the Trail.

### README
- **Manual/scripted check** → AC7.1–AC7.3. README names the journey, its source
  and license, the verbatim-but-framed promise, and the validation commands, with
  no factory internals. The copy sweep over README is already enforced by
  `copy.test.ts` (README is in its file list).

---

## 5. Definition of done
- The schema is defined once in `packs/types.ts` and documented in
  `packs/SCHEMA.md`; the fixture conforms and every EPIC 1 test still passes.
- `validatePack` and the source verifier run under `npm test` /
  `npm run validate:packs` and fail the build on any violation.
- `muir.json` has at least 30 mileposts, spread across the route, and passes both
  the structural validator and the full source verifier: dates ordered, `mileMark`
  strictly increasing, every `voices[].text` verbatim against the committed
  Gutenberg #60749 source, no editorial apparatus, each milepost carrying a real
  place, a real 1867 date, and an "near this ground" `approxNote`.
- The Muir pack drives the running EPIC 1 loop in place of the fixture; withhold
  -then-reveal holds with real text; `SEED_DEMO` crosses real Muir mileposts.
- The framing note is authored, surfaced on the Trail, and clears the copy sweep;
  Muir's verbatim text is exempt from the sweep and unedited.
- `npm run typecheck`, `npm run lint`, `npm test`, and the Playwright e2e suite
  all pass. `README.md` records the journey's provenance and the validation
  commands with no factory internals.
- No second pack, no upload surface, no map polyline, no runtime generation was
  built (non-goals held).
