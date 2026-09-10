# PRODUCT PLAN — The Long Road

*Walk a dead traveler's journey, mile for mile, diary for diary.*

## Core value (one sentence)

Log the real miles you walk each day, and when your odometer crosses a true
milepost of a documented historic journey, the app hands you exactly what the
traveler wrote at that ground, verbatim, accreting with your own one-line log
into a printable double journal that grows only through walking.

## North star

Months into a journey, the walker opens their double journal and holds
something that did not exist before their own feet made it: a facing-page
companionship across two centuries, a dead traveler's verbatim words beside
their own daily lines, page after page. The excellent version of this product
feels like walking in a real person's company. You are never alone on the trail
and you are never handed the ending. You earn the next voice one honest day at a
time, and when you stop, for a week or for good, you keep the miles you walked
and the words you earned. A keepsake you would mourn losing, and a primary text
of history you actually read, not a medal that means nothing the day after it
arrives.

## Quality differentiator (the one dimension we beat everyone on)

**The substance of the payoff.** Every existing virtual-journey product, paid or
free, rewards distance with medals, points, postcards, or cartoon scenery. This
app rewards distance with a real dead person's actual words, verbatim, keyed to
the exact ground you reached, and it withholds tomorrow's entry until your feet
earn it. We do not compete on gamification, breadth, or automation. We compete on
the meaning of the reward, and we commit to that one thing.

## Signature moment

You log the miles that push your odometer past a milepost, and the app opens the
traveler's diary entry written on that exact ground. You could not read it
yesterday. You cannot skip ahead to next month. You earned these specific words
by walking to them, and you write your single line for the day facing theirs.

---

## Who this is for, and the honest limit

A daily walker who wants their walking to be *about* something. The kind of
person who today hand-builds a "walk to Mordor" tracker rather than accept a
medal app. This is a deliberate daily check-in ritual, not a passive tracker: a
web app cannot count steps in the background, and the product says so plainly on
the first screen. Anyone who wants invisible automatic tracking is not this
product's user. The check-in takes under ten seconds, and value accrues from
mile one, so the ritual pays off long before the journey ends.

---

## MVP user stories

1. As a new visitor, I understand within seconds what this is (walk a real
   historic journey and earn its diary), and that it needs a daily check-in from
   me, before I commit.
2. As a new user, I pick a journey (John Muir's thousand-mile walk, or the Lewis
   & Clark expedition) and see where I will begin and who I will be walking with.
3. As a walker, I log today's miles in under ten seconds, by typing a number or
   dropping a health-export file that is parsed on my own device.
4. As a walker, I see my position on the trail, how far to the next entry, and a
   short line of what ground is coming, so a non-unlock day still feels like
   progress.
5. As a walker, when my miles cross a milepost, I receive the traveler's verbatim
   entry for that ground, framed as "near this ground," and I write one line
   facing it.
6. As a walker, I open my double journal at any time and read our two voices
   interleaved by date, from mile one to today.
7. As a walker, I export my journal as a printable file and as plain data, and I
   can import that data back to restore it on another device or after clearing my
   browser.
8. As a returning walker, I land straight in my active journey with no
   walkthrough repeating, and pick up where I left off.

---

## Data model sketch

**Journey pack** (static, shipped with the app, curated at build time):
```
JourneyPack {
  id, title, traveler, years,
  source: { name, gutenbergId, license },        // public-domain provenance
  framingNote,                                    // period-context note, plain
  totalMiles,
  route?: [ [lat, lng], ... ],                    // optional coarse polyline
  mileposts: [
    { id, mileMark, date, place, approxNote,      // approxNote = "near this ground"
      voices: [ { author, text } ] }              // one or more journalists
  ]
}
```

**Walker state** (local only: IndexedDB, mirrored to an export file):
```
WalkerState {
  activePackId, unitPref,                         // "mi" | "km"
  createdAt, firstSuccessDone,
  dailyLog:   [ { date, miles } ],                // the odometer source of truth
  cumulativeMiles,
  personalLog:[ { date, text, milepostId? } ],    // the walker's one-liners
  reachedMilepostIds: [ ... ]
}
```

**Export artifact:** a single JSON file (complete state, re-importable) plus a
printable HTML/PDF rendering of the double journal.

No server-side state, no accounts, no database. Journey packs are static JSON
served alongside the app bundle. Everything the walker creates lives on their
device until they export it.

---

## Screen / endpoint inventory

**Screens (single-page app):**
1. **Start / Journey picker** — what this is, the honest daily-ritual note, and a
   choice of journey with a one-line "who you walk with."
2. **Trail (home)** — position on the route, distance to the next milepost, the
   approach line for what is coming, the ten-second check-in, recent log.
3. **Arrival** — the unlock ceremony: the verbatim entry for the ground you
   reached, and the field to write your facing line. Re-readable later.
4. **Journal** — the double journal, two voices interleaved by date, with print
   and data export.
5. **Settings** — units, export / import / backup, health-export import, the
   journey's framing note, reset.

**Endpoints:** static SPA assets and `/packs/<id>.json` (static). `/healthz` for
the deploy. No auth endpoints, no mutation endpoints (there is no server state to
mutate).

---

## Architecture notes

- **Local-first, static-served.** React + Vite + TypeScript SPA. State in
  IndexedDB. The "backend" serves static files only. This is the smallest honest
  architecture for a no-accounts, no-cloud product, and it collapses most of the
  security surface: there are no data endpoints to authorize and no PII to leak
  server-side. The security work that remains is real and in scope: validate any
  imported file at the boundary (type, size, shape) before parsing, encode
  rendered diary and user text safely, ship no secrets in the bundle, serve over
  HTTPS at deploy.
- **No runtime LLM.** The corpus is curated and verified at build time and served
  verbatim. There is no generation at runtime, no BYOK surface, and no
  `llm_request`. Verbatim fidelity is a promise generative text cannot keep, and
  avoiding the LLM entirely is a feature of this product, not a gap.
- **Durability of the artifact.** Because state is local, export is not a
  nice-to-have, it is how the keepsake survives. Export and import are
  first-class from EPIC 4, and the app gently reminds the walker to keep a
  backup.
- **Observability.** Wire GlitchTip/Sentry (`SENTRY_DSN`) and Umami
  (`UMAMI_WEBSITE_ID` / `UMAMI_URL`) on the frontend from EPIC 1, injected via
  env at deploy time.

---

## EPIC list (build order)

Each EPIC is small and independently reviewable. The list is depth-first toward
the signature moment: prove the earned-verbatim-entry loop with real content
early, then build the durable artifact around it, then onboarding and the second
journey, then polish. Every EPIC inherits the QUALITY BAR as binding spec.

### EPIC 1 — Foundation, the check-in loop, and the staging scaffold
**Scope.** The SPA skeleton (React + Vite + TypeScript), mobile-first layout, and
the smallest walkable loop: a Trail screen where the walker types today's miles
and watches a cumulative odometer advance, persisted locally across reloads,
running against a tiny built-in fixture pack (two or three mileposts) so the loop
is testable end to end. Plus the deploy scaffold and observability.

**Acceptance criteria.**
- A `Dockerfile` and a `docker-compose.staging.yml` build the SPA and serve it;
  `docker compose -f docker-compose.staging.yml up` yields a reachable app and a
  passing `/healthz`. (Binding: reviews treat a missing staging compose as a
  shipping blocker.)
- The scaffold honors a `SEED_DEMO` env flag: when set, the app seeds a walker
  whose logged miles have already crossed at least one milepost, so a stranger
  sees the differentiator (an earned entry and a populated journal) within a
  minute with no hand-crafted input.
- Typing a mile figure advances the cumulative odometer; the value survives a
  page reload.
- Empty, loading, and error states are designed on every screen present: the
  empty Trail says what to do first in positive, plain copy; no white screens; no
  raw errors.
- Usable at 390px with no horizontal scroll and ~44px touch targets; first
  meaningful render under ~1s; check-in feedback under 100ms.
- Sentry and Umami are wired on the frontend via env; no secrets in the bundle.
- `README.md` skeleton exists (what it is, how to run, where code lives) written
  for strangers, no factory internals.

**Non-goals.** No real journey content yet, no unlock ceremony, no journal
export, no onboarding walkthrough.

### EPIC 2 — Journey pack format and the Muir pack (the content engine)
**Scope.** Define the journey-pack JSON schema once, build the build-time
verification tooling, and produce the first real, fully verified pack: John
Muir's *A Thousand-Mile Walk to the Gulf* (Project Gutenberg #60749). Muir is the
flagship first pack because it is a single dated, near-daily, place-rich book,
about 1,000 miles, finishable at casual pace in roughly a year.

**Acceptance criteria.**
- A documented pack schema plus a validator that runs in CI and fails the build
  on any violation.
- The Muir pack loads and drives the EPIC 1 loop in place of the fixture.
- Verification, all machine-checked against the downloaded Gutenberg source:
  entry dates strictly ordered; cumulative `mileMark` values strictly monotonic;
  every `voices[].text` byte-identical to the public-domain source (no
  paraphrase, no editorial apparatus from copyrighted editions).
- At least 30 verified mileposts spread across the route so the ritual pays off
  at casual pace (see the pacing design in EPIC 3).
- Each milepost carries a real place, a date, and an `approxNote` phrased as
  "near this ground," never false GPS precision.
- The pack carries a short, plain framing note for period content (Muir walked
  the Reconstruction South). The text is framed, never edited.

**Non-goals.** No second pack, no user-submitted packs, no map polyline required
if coarse positioning suffices, no runtime text generation.

### EPIC 3 — The milepost unlock and between-milepost pacing (the signature)
**Scope.** The Arrival ceremony and the Trail's non-unlock-day payoff. This EPIC
is where the product earns its "wow," so it gets depth.

**Acceptance criteria.**
- Crossing a milepost opens the Arrival screen: the traveler's verbatim entry in
  a readable typographic setting, with dateline, place, and the "near this
  ground" note, and a field to write one facing line for the day.
- Entries are strictly withheld: the walker cannot read a milepost's text before
  the odometer reaches it, and cannot skip ahead to later mileposts.
- Multi-voice mileposts (relevant to EPIC 6) render more than one journalist
  cleanly when present.
- The Trail screen makes a non-unlock day feel like progress: current position,
  exact distance to the next milepost in the walker's units, and one short
  approach line about the ground ahead, without spoiling the entry.
- A reached entry is re-readable later from the Trail or Journal.
- All states designed; interaction feedback under 100ms; mobile-first.

**Non-goals.** No badges or celebratory gamification beyond the entry itself, no
streak counters, no social sharing.

### EPIC 4 — The double journal and export / import (the durable artifact)
**Scope.** The keepsake: both voices interleaved by date, and the export/import
that lets it survive a local-only architecture.

**Acceptance criteria.**
- The Journal screen renders the traveler's earned entries interleaved
  date-by-date with the walker's one-line log, correct from mile one, so a walker
  who stops at mile 120 owns 120 miles of double journal.
- Printable export (a clean print stylesheet or generated file) produces a
  readable facing-page artifact suitable for keeping.
- Data export writes the complete state as a single JSON file; import validates
  and restores it, round-tripping losslessly, on a fresh browser or device.
- A gentle, positive reminder to keep a backup, shown without nagging.
- Print layout and export are usable and legible; all states designed.

**Non-goals.** No cloud sync, no accounts, no sharing links, no PDF service
dependency if the browser print path suffices.

### EPIC 5 — First run: picker, guided walkthrough, and health-export import
**Scope.** Turn a curious visitor into a walker. The honest framing, the journey
choice, the guided first success, and the second input path.

**Acceptance criteria.**
- The Start screen states plainly what the product does and that it needs a daily
  check-in, before the walker commits, in short positive copy.
- The journey picker lets the walker choose a journey and shows a one-line "who
  you walk with" for each.
- A guided first run (2 to 4 steps) anchored to the real controls walks a brand
  new user through logging miles once and reaching or previewing their first
  entry. Each step is one short imperative sentence. It is skippable at any step,
  appears only until first success, and never again for a returning user.
- Health-export import: the walker can drop a supported file (a `date,miles` CSV
  and Apple Health `export.xml` walking/running distance), parsed entirely on
  device, validated at the boundary for type, size, and shape before parsing,
  with a clear list of supported formats and a designed error for an unsupported
  or malformed file.
- All states designed; mobile-first; no PII leaves the device.

**Non-goals.** No account creation, no multiple concurrent journeys, no arbitrary
fitness-format zoo beyond the two supported inputs, no background sync.

### EPIC 6 — The Lewis & Clark pack (the second journey)
**Scope.** A second verified pack, giving a real choice at first run and
showcasing the multi-voice payoff. Bounded to the best-documented segment to keep
editorial labor honest: **St. Louis to Fort Mandan** (May to October 1804, about
1,600 miles), labeled as the first chapter of the route and extensible later.

**Acceptance criteria.**
- Built from a clean public-domain edition (Project Gutenberg #8419), using the
  UNL/Moulton edition only as a route and date cross-reference, never as a text
  source (its editorial apparatus may be copyrighted).
- Passes the same automated verification as EPIC 2 (dates ordered, miles
  monotonic, text byte-identical to source).
- At least 40 verified mileposts across the segment, several carrying more than
  one journalist's voice so the multi-voice rendering earns its place.
- The segment is clearly presented as a chapter with a real end waypoint (Fort
  Mandan), not as the whole expedition, so the scope is honest to the user.
- Carries a plain framing note for period content (1804 voice on encounters with
  Native nations). Framed, never edited.

**Non-goals.** No geocoding of the full 3,700-mile route, no later expedition
legs, no user-submitted extensions.

### EPIC 7 — Polish (whole-product pass, no new features)
**Scope.** A UX, performance, and copy pass over the entire delivered product
against the QUALITY BAR and the quality differentiator. Tighten what exists; add
nothing.

**Acceptance criteria.**
- The signature moment lands: the earned verbatim entry is reachable within the
  first minute on staging via `SEED_DEMO`, and the withholding and the double
  journal are unmistakably the product, not gamification.
- Performance verified: first meaningful render under ~1s, interaction feedback
  under 100ms, no unindexed or unbounded work as the log grows over months (the
  journal and trail stay fast at hundreds of entries).
- Full mobile pass at 390px; accessibility pass (contrast, visible focus, labeled
  inputs, semantic headings and landmarks, alt text, full keyboard reach).
- Copy sweep across every user-visible string and every shipped pack framing
  note: no em-dashes or dash-asides, no banned LLM vocabulary, no negative
  empty-state phrasing. Every string reads as written by a thoughtful person.
- Every empty, loading, and error state reviewed and designed.
- `README.md` is complete and verified against the actual compose files: a
  stranger can understand, run, and contribute, with no factory internals.

**Non-goals.** No new features, no new packs, no re-architecture.

---

## Non-goals / out of scope (the fence)

These are tempting and deliberately excluded from the MVP:

- **Automatic or background step counting.** A web app cannot do it honestly;
  this is a deliberate check-in ritual and says so.
- **The "you leave when they left" synchronized-clock mode.** The sharper but
  crueler sibling. A possible later mode, not a fork now.
- **Gamification:** medals, badges, points, levels, streak counters,
  streak-shaming. The earned words are the reward.
- **Social features:** feeds, leaderboards, groups, friend challenges, sharing
  links.
- **Accounts, login, cloud sync.** Local-first with export/import instead.
- **User-generated or community-submitted journey packs.** MVP ships curated,
  verified packs only.
- **Editing, paraphrasing, or bowdlerizing the primary texts.** Frame, never
  edit. Verbatim fidelity is the promise.
- **Runtime LLM or chatbot features.** None needed; none built.
- **Live GPS or map location tracking.** Miles are self-reported.
- **Native mobile apps.** Mobile-first web only.
- **More than the two launch packs**, and the full 3,700-mile Lewis & Clark route
  (the MVP ships a bounded first chapter).

---

## A note on scope for the owner

The core value is fully delivered by one pack. If build budget runs short, EPIC 6
(Lewis & Clark) is the safe deferral: the loop, the signature moment, and the
durable artifact all ship complete with Muir alone, and the second journey can
follow as a content drop. Everything before EPIC 6 is the irreducible product.
The polish EPIC is not a deferral candidate; it is part of the smallest
professional product.
