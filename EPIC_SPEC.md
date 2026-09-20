# EPIC_SPEC: The Lewis & Clark pack (the second journey)

## Quality differentiator (this app must win here)

The one dimension this product wins on: **the substance of the payoff.**
Every other virtual-journey product rewards distance with medals, points,
postcards, or cartoon scenery. This app rewards distance with a real dead
person's actual words, verbatim, keyed to the exact ground you reached, and
withholds tomorrow's entry until your feet earn it. We compete on the meaning
of the reward, not on gamification, breadth, or automation.

**What it demands of THIS EPIC:** the second pack is not filler for a picker.
It is where the differentiator gets *deeper*. St. Louis to Fort Mandan is the
best-documented stretch of the expedition, and on many days more than one man
of the Corps wrote about the same ground. This pack proves the reward can be a
*conversation across a campfire* rather than a single voice: at a shared
milepost the walker earns Clark's terse log beside Ordway's plainer one for the
same day, on the same bend of the Missouri. Every earned line here must still be
byte-identical public-domain text. The multi-voice mileposts are the signature
moment of the pack, so they must be real, plural, and legible, never a token
second quote bolted on.

---

## Scope

### In scope

A second **verified journey pack** for The Long Road: the first chapter of the
Lewis and Clark expedition, **St. Louis (Camp River Dubois) up the Missouri to
Fort Mandan, May to late 1804, about 1,600 miles.** It drops into the existing
pack machinery (schema in `web/src/packs/SCHEMA.md`, structural validator in
`validatePack.ts`, source verifier pattern in `verifySource.ts` +
`muir.verify.test.ts`) and appears as a second card in the first-run picker, so
a brand-new user has a real choice of journey.

The pack must:

1. Be built from a clean public-domain edition: **Project Gutenberg ebook
   #8419, "The Journals of Lewis and Clark, 1804-1806."** The UNL/Moulton
   (Nebraska) edition may be consulted **only** as a route-and-date
   cross-reference; not one byte of its editorial apparatus may enter the pack.
2. Pass the **same automated verification** the Muir pack passes: dates ordered
   (non-decreasing), cumulative miles strictly monotonic, and every earned line
   byte-identical to the committed public-domain source after the defined
   whitespace/apparatus normalization.
3. Carry **at least 40 verified mileposts** across the segment, **several of
   which carry more than one journalist's voice** (Clark, Lewis, Ordway; more if
   present in #8419) so the multi-voice rendering earns its place.
4. Be **clearly presented as a chapter** of the wider expedition with a real end
   waypoint, **Fort Mandan**, so the user is never misled that this is the whole
   3,700-mile journey. It is labeled the first chapter and is extensible later.
5. Carry a **plain framing note** for the period content, specifically the 1804
   voice on encounters with Native nations. The words are framed, never edited.

### Out of scope (non-goals, binding)

- **No geocoding** of the full 3,700-mile route. No coordinates anywhere in the
  pack (the `approxNote` framing and its coordinate ban still hold). No map.
- **No later expedition legs** (Fort Mandan to the Pacific, the return). Those
  are separate future packs, not this one.
- **No user-submitted extensions** or any editing UI for packs.
- No new pack *schema* features beyond what already exists, no redesign of the
  Trail/Arrival/Journal beyond what the multi-voice case legibly needs, and no
  change to the Muir pack or its verification behavior.

### Signature moment (ambition check)

The one thing a user would describe to a friend: *"I walked past the mouth of
the Platte, and the app handed me what Clark wrote there in 1804 and what
Sergeant Ordway wrote the same day, side by side, and I'd earned both by walking
the miles."* That is a mechanic (two earned primary voices on one milepost),
not an adjective. It already has a home in the rendering; this EPIC makes it
real by shipping the data and confirming it reads well.

---

## Technical design

### Data model

Packs are static, bundled JSON validated at build time. **There is no database
and no migration.** A pack is added purely by committing files and registering
the pack object. The existing `JourneyPack` / `Milepost` / `Voice` /
`PackSource` types in `web/src/packs/types.ts` already support everything this
EPIC needs, including `voices: Voice[]` with more than one entry per milepost.
**Do not change the types or `SCHEMA.md`'s binding rules.**

The one honest note about `voices`: `SCHEMA.md` currently says "For a single
traveler, exactly one." That describes Muir, not a hard cap. The `Milepost`
rule is "at least one entry," and multi-voice mileposts are explicitly in scope
here. You may update the *prose* in `SCHEMA.md` to record that a milepost may
carry more than one journalist's voice (a milepost is a place on the ground, and
more than one keeper of the Corps could write about it). Do not weaken any
binding numeric rule.

### Files to add

- `web/src/packs/sources/gutenberg-8419.txt` — the exact, unmodified bytes of
  Project Gutenberg #8419 (`https://www.gutenberg.org/cache/epub/8419/pg8419.txt`
  or the equivalent `8419-0.txt`). Committed to the repo, **read only via `fs`
  in the verify test, never `import`ed by app code** (mirrors
  `gutenberg-60749.txt`).
- `web/src/packs/lewisclark.json` — the authored pack data.
- `web/src/packs/lewisclark.ts` — the typed re-export (mirror `muir.ts`:
  `import data from "./lewisclark.json"; export const lewisClarkPack = data as JourneyPack;`).
- `web/src/packs/lewisclark.verify.test.ts` — the source-verification test, the
  heart of this EPIC (mirror `muir.verify.test.ts`).
- `web/src/packs/lewisclark.copy.test.ts` — the authored-copy sweep (mirror
  `muir.copy.test.ts`).

### Files to touch

- `web/src/packs/index.ts` — add `lewisClarkPack` to the `journeyPacks` array.
  This is the only wiring the picker, boot gate, and restore path need (they
  already read the registry). Keep Muir first so it stays the default the boot
  gate and `SEED_DEMO` fall back to.
- `web/src/packs/verifySource.ts` — generalize `cleanSource` so it can clean a
  second source **without changing Muir's behavior.** Give it an optional
  start-anchor parameter (default = `NARRATIVE_START`, so the Muir call is
  byte-identical to today); `GUTENBERG_END_MARKER` is already generic and can be
  reused as-is. Add a `#8419` start anchor constant (see the extraction recipe
  below). `normalizeExcerpt` is source-agnostic and needs no change.
- `web/src/packs/validatePack.test.ts` — add a case asserting
  `validatePack(lewisClarkPack)` returns `[]`.
- `web/src/packs/index.test.ts` — assert the registry contains the pack and
  `packById(<its id>)` resolves it.
- `web/src/firstrun/Start.tsx` — the picker already renders one card per pack.
  With two cards there are now two "Begin this journey" buttons with **identical
  accessible names**, which is both an accessibility defect (§6) and breaks the
  e2e selectors. Give each Begin button a **distinct accessible name that names
  its journey** (e.g. via `aria-label={`Begin ${pack.title}`}`), keeping the
  visible label short. One primary action per card is preserved.
- `web/e2e/helpers.ts` and `web/e2e/mobile.e2e.ts` — `beginMuirJourney` and the
  mobile spec select `getByRole("button", { name: "Begin this journey" })`,
  which now matches two buttons (Playwright strict-mode failure). Scope both to
  the Muir card via the new distinct accessible name. Add a helper to begin the
  Lewis & Clark journey the same way.
- `web/e2e/bundle.e2e.ts` — add a **#8419 source sentinel** (a line from #8419's
  editorial front matter that sits outside every packed excerpt) to the
  out-of-bundle grep, proving the second source also stays out of `dist`.
- `README.md` — extend the "The journeys" section (around lines 40-53) to
  describe the Lewis & Clark chapter, its #8419 source, its multi-voice nature,
  and its honest chapter framing. Update the `packs/` directory blurb if the
  wording implies a single pack.

### API contracts

None. No server, no endpoints, no runtime LLM. This EPIC is content plus a small
amount of integration glue. The BYOK/gateway and internal-services contracts in
CLAUDE.md are not touched.

### The withholding boundary is unchanged

`buildJournal.ts` and `Arrival.tsx` only ever read `voices` for mileposts in
`reachedMilepostIds`. Multiple voices on a milepost ride that same boundary for
free: an unearned multi-voice milepost's text is never mounted. Do not add any
code path that reads an unearned milepost's `voices`.

---

## Editorial extraction recipe (how to produce byte-identical voices)

This is the delicate part. Follow it exactly or the verify test fails.

1. **Entry structure in #8419.** Each daily entry is headed with a bracketed
   attribution, e.g. `[Clark, May 14, 1804]`, `[Lewis, May 15, 1804]`,
   `[Ordway, May 17, 1804]`, followed by the keeper's own words. The same date
   frequently carries entries from more than one keeper. This is exactly what
   makes multi-voice mileposts possible.

2. **The bracketed header is apparatus, not the traveler's words.** The source
   cleaner strips every `[...]` span and every `_` italic marker, then collapses
   all whitespace to single spaces. So the header disappears during cleaning,
   which is correct: the header is the compiler's label, not Clark's or Ordway's
   sentence. Your `voices[].text` is the **entry body only**, with the same
   apparatus removed and whitespace collapsed to single spaces.

3. **To build one `voices[].text`:**
   - Pick a contiguous passage **within a single entry body** (never spanning a
     header into the next entry).
   - Remove every `_` and every `[...]` span from it.
   - Collapse all runs of whitespace (including the source's ~70-column hard
     wraps) to single spaces; trim.
   - Preserve **exact spelling, punctuation, and characters**, including the
     keepers' idiosyncratic spelling ("Set out from Camp River a Dubois") and
     the source's exact quote/apostrophe characters (straight vs. curly must
     match the file's bytes). Do not modernize, correct, or normalize the prose.
   - The result must be a substantial passage: at least 40 characters and
     containing at least one sentence-ending `.`/`!`/`?`.
   The verify test then asserts `cleanSource(#8419).includes(normalizeExcerpt(text))`.

4. **`voices[].author`** is the keeper named in that entry's header, spelled as a
   person would expect to read it in the UI footer: "William Clark",
   "Meriwether Lewis", "John Ordway" (expand the header's short name; the author
   label is UI copy, not verbatim source, so it is not substring-checked, but it
   must honestly name the keeper of that entry).

5. **A multi-voice milepost** carries two or more `voices`, each from a
   *different* keeper, describing the **same ground on the same day** (or the
   same short stretch of river). Set `milepost.date` to that shared day. Each
   voice is extracted independently per steps 2-3.

6. **The narrative window / start anchor.** `cleanSource` slices from the start
   anchor to the Gutenberg end marker so the Gutenberg boilerplate and any
   editor's preface are excluded. Choose a #8419 start anchor that (a) occurs
   exactly once in the file, (b) lies inside the first 1804 entry body, and
   (c) stops at a line break so it matches the raw pre-collapse bytes (as the
   Muir `NARRATIVE_START` constant does). Verify uniqueness against the actual
   committed file before finalizing.

7. **`approxNote`, `approach`, `place`, `framingNote`, `companion`, `title`** are
   **our words**, not the source. `place` is factual (a real place on the route,
   e.g. "The mouth of the Platte River") and is not swept. The rest are authored
   copy and MUST pass the copy sweep. `approach` must not be a verbatim slice of
   the cleaned source (the verify test greps for it) and must be one short
   sentence about the ground ahead, 15 to 120 characters, that never spoils the
   coming entry. `approxNote` must contain the phrase "near this ground" and
   carry no coordinate precision.

8. **The framing note (period content).** Write a plain, present-day note that
   tells the reader these are 1804 words, that they include the expedition's
   encounters with and descriptions of Native nations in the language and
   attitudes of that time, that some of it will read as wrong today, and that we
   reproduce it exactly and do not edit it. Keep it calm and factual. It must
   pass the copy sweep (no em-dashes, no banned vocabulary, no negative
   empty-state phrasing). The offensive or dated *content* lives only in
   `voices[].text`, which is primary source and exempt from the sweep. Never
   soften a voice; frame it in the note instead.

> Illustrative only, rewrite and verify before shipping. Companion line:
> "Meriwether Lewis, William Clark, and the sergeants keeping their own
> journals as they push up the Missouri in 1804. This first chapter ends where
> they wintered, at Fort Mandan." Title conveying the chapter:
> "Up the Missouri to Fort Mandan, 1804". These examples are swept (no dashes,
> no banned words, no negative phrasing); still re-read your final strings.

---

## Ordered task list

Each task lists concrete, testable acceptance criteria (AC).

### T1 — Commit the public-domain source

Add `web/src/packs/sources/gutenberg-8419.txt` as the exact bytes of Project
Gutenberg #8419.

- **AC1.1** The file exists and contains the standard Gutenberg end marker
  (`*** END OF THE PROJECT GUTENBERG EBOOK`).
- **AC1.2** The file contains the 1804 daily entries with bracketed keeper
  headers (e.g. a `[Clark, May 14, 1804]`-style header near the top) and mentions
  Fort Mandan later in the text.
- **AC1.3** No application module `import`s the `.txt` file. It is read only via
  `fs` in `lewisclark.verify.test.ts`. (Proven end-to-end by T8.)

### T2 — Generalize the source verifier (no Muir behavior change)

Parameterize `cleanSource` in `verifySource.ts` to accept a start anchor,
defaulting to the existing Muir `NARRATIVE_START`, and add the #8419 start-anchor
constant.

- **AC2.1** The existing `muir.verify.test.ts` passes **unchanged** (the Muir
  `cleanSource(raw)` call must behave byte-identically to today).
- **AC2.2** `cleanSource(raw8419, LC_NARRATIVE_START)` returns a substantial body
  (> 10,000 chars) with no `_`, `[`, or `]` remaining.
- **AC2.3** `LC_NARRATIVE_START` occurs exactly once in the committed #8419 file.

### T3 — Author the pack data

Create `lewisclark.json` and `lewisclark.ts`; register in `index.ts`.

- **AC3.1** `id` is stable and chapter-scoped (e.g. `lewis-clark-1804-fort-mandan`)
  so a later leg can ship as a separate pack without collision. `traveler` names
  the collective (e.g. "the Lewis and Clark expedition"), `years` is `"1804"`,
  `totalMiles` is about 1,600.
- **AC3.2** `source` records #8419: name "The Journals of Lewis and Clark,
  1804-1806", author "Meriwether Lewis and William Clark", `gutenbergId` 8419,
  the canonical URL, license "Public domain (Project Gutenberg)".
- **AC3.3** At least **40 mileposts**, ordered ascending by `mileMark`.
- **AC3.4** `mileMark` strictly increasing, every value within `(0, totalMiles]`;
  first milepost near the start of the segment, last milepost at or beyond
  `0.9 * totalMiles`; no single gap between consecutive mileposts exceeds 90
  miles (chapter feels continuous, not sparse).
- **AC3.5** Every `date` is a real 1804 calendar date in the segment window (May
  through the Fort Mandan arrival, i.e. months 05-11), non-decreasing across
  mileposts.
- **AC3.6** At least **8 mileposts** carry two or more `voices` whose `author`
  values are distinct keepers. Across the whole pack at least **3 distinct
  journalist authors** appear. At least one multi-voice milepost sits early in
  the segment (low `mileMark`) so a new Lewis & Clark walker meets the payoff
  soon after starting.
- **AC3.7** The **last milepost** is Fort Mandan: its `place` matches
  `/Fort Mandan/i` and it is the highest `mileMark`.
- **AC3.8** Chapter honesty: `title` and `companion` together make explicit that
  this is the first chapter of the expedition and that it ends at Fort Mandan,
  not the whole journey. `companion` (shown in the picker) names the keepers.
- **AC3.9** `framingNote` is present, addresses the 1804 period content
  including encounters with Native nations, and states the words are reproduced
  exactly and unedited.
- **AC3.10** Structural validity: `validatePack(lewisClarkPack)` returns `[]`
  (this enforces the "near this ground" phrase, the coordinate/GPS ban on every
  `approxNote`, non-empty `approach`, unique ids, and the monotonicity rules).

### T4 — Source-verification test

Add `lewisclark.verify.test.ts`, mirroring `muir.verify.test.ts` against #8419,
plus the multi-voice and chapter assertions unique to this pack.

- **AC4.1 (verbatim)** For every voice of every milepost,
  `cleanSource(raw8419, LC_NARRATIVE_START).includes(normalizeExcerpt(v.text))`
  is true.
- **AC4.2 (no apparatus)** No `v.text` contains `[`, `]`, or `_`.
- **AC4.3 (substantial)** Every `v.text` is at least 40 chars and contains a
  sentence-ending `.`/`!`/`?`.
- **AC4.4 (dates)** Every `date` matches `YYYY-MM-DD`, is a real date, has year
  1804 and month in 05-11, and dates are non-decreasing.
- **AC4.5 (miles)** `mileMark` strictly increasing and within `(0, totalMiles]`.
- **AC4.6 (count)** At least 40 mileposts.
- **AC4.7 (spread)** First `mileMark` small (e.g. <= 60), last
  `>= 0.9 * totalMiles`, no consecutive gap > 90.
- **AC4.8 (multi-voice)** At least 8 mileposts have `voices.length >= 2` with two
  or more distinct `author` values; the set of distinct authors across the pack
  has size >= 3.
- **AC4.9 (Fort Mandan end)** The last milepost's `place` matches `/Fort Mandan/i`.
- **AC4.10 (approach authored)** No `approach` line is found in the cleaned
  source; each is 15 to 120 chars.

### T5 — Structural registration tests

- **AC5.1** `validatePack.test.ts` asserts `validatePack(lewisClarkPack)` is `[]`.
- **AC5.2** `index.test.ts` asserts `journeyPacks` contains the pack and
  `packById(<id>)` returns it; an unknown id still returns `undefined`.

### T6 — Multi-voice rendering confirmation

The Arrival ceremony and the Journal spread already `.map(voices)` with a
per-voice author footer, so multiple voices render without new code. Confirm they
render **legibly and correctly attributed**, and lock it with a test.

- **AC6.1** A component test renders `Arrival` for a two-voice milepost and
  asserts **both** voice texts appear, **each with its own author label**.
- **AC6.2** A component test renders `Journal` (a reached two-voice milepost) and
  asserts both voice texts and both author labels appear in that milepost's
  spread.
- **AC6.3** Visual check at 390px width: stacked voices are visibly separated and
  each is clearly attributed to its keeper (the existing `.arrival-voice` /
  `.spread-voice` treatment). Adjust CSS only if two voices are hard to tell
  apart; do not redesign.

### T7 — Picker and first-run integration

- **AC7.1** Each picker "Begin" button has a distinct accessible name that names
  its journey; the two cards are individually targetable. `Start.test.tsx` still
  passes (it renders a single-pack picker; keep that green).
- **AC7.2** `beginMuirJourney` and `mobile.e2e.ts` are scoped to the Muir card
  and pass with two packs present (no strict-mode ambiguity).
- **AC7.3** A new e2e begins the **Lewis & Clark** journey from the picker, logs
  enough miles to reach an early multi-voice milepost, opens the Arrival, and
  sees **two keepers' entries**. The existing guided walkthrough still fires for
  this journey (it anchors to controls, not to a pack).
- **AC7.4** The full unit + e2e suite passes; no test assumes exactly one pack.

### T8 — Source stays out of the client bundle

- **AC8.1** `bundle.e2e.ts` greps `dist` for a #8419 front-matter sentinel (a
  line outside every packed excerpt) and asserts it is absent, alongside the
  existing sentinels.
- **AC8.2** The verify test asserts that same sentinel is present in the raw
  #8419 file but absent from every packed `voices[].text` (mirrors the Muir
  `introSentinel` check), proving the packed excerpts are entry bodies, not
  front matter.

### T9 — README

- **AC9.1** "The journeys" section describes the Lewis & Clark chapter: what it
  is (St. Louis up the Missouri to Fort Mandan, 1804), that it is the first
  chapter and not the whole expedition, that the words are verbatim from Project
  Gutenberg #8419, and that some mileposts carry more than one keeper's voice.
- **AC9.2** Any wording implying a single pack is updated. Run commands and test
  commands remain correct.
- **AC9.3** No factory internals; copy passes the sweep.

---

## Test plan (each planner acceptance criterion, proven)

| Planner acceptance criterion | Proven by |
| --- | --- |
| Built from clean PD edition #8419; Moulton only as route/date cross-ref, never a text source | AC4.1 (every voice verbatim in #8419) + AC4.2 (no apparatus) + AC8.2 (packed text is entry bodies, not front matter). Any text not present in #8419, including Moulton apparatus, fails AC4.1. The coordinate/GPS ban (AC3.10 via `validatePack` S8) keeps survey precision out. |
| Passes the same automated verification as EPIC 2: dates ordered, cumulative miles monotonic, text byte-identical | AC4.4 (dates), AC4.5 (miles), AC4.1 (byte-identical) — the same shape as Muir's V4/V5/V1, now over #8419. AC2.1 guarantees Muir's own verification is unchanged. |
| >= 40 mileposts, several multi-voice | AC4.6 (count >= 40) + AC4.8 (>= 8 multi-voice mileposts, >= 3 distinct authors) + AC6.1/AC6.2 (both voices actually render, attributed). |
| Clearly a chapter with a real end waypoint (Fort Mandan), not the whole expedition | AC3.7 + AC4.9 (last milepost is Fort Mandan) + AC3.8 (title and companion frame it as the first chapter) + AC9.1 (README says so). |
| Plain framing note for 1804 period content (Native nations); framed, never edited | AC3.9 (framingNote content) + `lewisclark.copy.test.ts` sweep of authored fields + the primary-source exemption keeping `voices[].text` unedited (AC4.1/AC4.2). |

### Full command gate

`npm test` (vitest: `validatePack.test.ts`, `index.test.ts`,
`lewisclark.verify.test.ts`, `lewisclark.copy.test.ts`, the Arrival/Journal
component tests, and every existing test unchanged) and `npm run validate:packs`
must pass, plus the Playwright e2e suite (`scripts/e2e.sh`) including the updated
`firstrun`/`mobile`/`bundle` specs and the new Lewis & Clark journey spec. A red
verify test means a voice is not verbatim; fix the text, never the test.

---

## Quality bar notes specific to this EPIC

- **First-run / real choice.** The picker now offers two journeys. Each card
  keeps exactly one primary action ("Begin this journey"), visibly the main
  control, with distinct accessible names. The Muir card stays first and remains
  the boot-gate / `SEED_DEMO` default (do not repoint `SEED_DEMO`; that is EPIC
  2's surface and out of scope here).
- **Mobile-first.** Two picker cards must stack cleanly at 390px with no
  horizontal scroll and ~44px touch targets. A two-voice Arrival must stay
  readable at 390px (the reading column is already capped; confirm stacked
  voices do not overflow).
- **Designed states.** No new empty/loading/error states are introduced. The
  Journal's existing empty and reached states already cover the new pack.
- **Perceived speed.** The pack is bundled JSON, no fetch, no query. Committing a
  large source `.txt` must not enter the client bundle (T8 proves it).
- **Copy sweep is part of DONE.** Sweep every authored string you add or edit
  (title, companion, framingNote, every `approxNote`, every `approach`, README,
  and the illustrative copy you finalize) for em-dashes/en-dashes, the banned
  LLM vocabulary, and negative empty-state phrasing. `voices[].text`, `place`,
  and `date` are primary-source/factual and exempt: never "fix" a keeper's 1804
  spelling or punctuation.
- **Accessibility.** Giving each Begin button a journey-specific accessible name
  is required here (two identically named buttons fail §6 and confuse screen
  readers), and each rendered voice must be programmatically attributed to its
  keeper.

---

## Notes and assumptions

- **#8419 confirmed suitable.** Project Gutenberg #8419 is "The Journals of Lewis
  and Clark, 1804-1806," beginning May 14, 1804 at Camp River Dubois, with daily
  entries headed by bracketed keeper attributions (`[Clark, ...]`, `[Lewis, ...]`,
  `[Ordway, ...]`) and multiple keepers writing on the same dates. This is what
  makes the >= 40-milepost, multi-voice, Fort Mandan chapter achievable entirely
  from a single public-domain source. No blocking question remains.
- **~1,600 miles / chapter length.** `totalMiles` represents this chapter (St.
  Louis to Fort Mandan), about 1,600 river miles, not the full expedition. Use
  the Moulton edition purely to sanity-check cumulative mileage and entry dates;
  never lift its text.
- **Extensibility is free, not built.** A later leg is simply another pack file
  registered in `index.ts`. This EPIC ships only the first chapter; do not build
  scaffolding for future legs.
