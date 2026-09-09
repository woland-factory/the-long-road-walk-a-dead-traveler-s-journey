# VALIDATION — The Long Road: walk a dead traveler's journey, mile for mile, diary for diary

**Verdict: VIABLE.** Build it, with the design constraints named below treated as binding.

## Core value proposition

You log the real miles you walk each day. When your odometer crosses a true milepost of a documented historic journey, the app hands you exactly what the traveler wrote at that ground, verbatim, from a public-domain diary. Your one-line daily log accretes opposite their entries into a printable double journal: their 1804 (or 1867) against your 2026, which grows only through walking and cannot be bought. No existing product, paid or free, keys primary texts to earned mileposts; competitors pay off in medals, postcards, and cartoon scenery.

## Why it passes the value tests

- **Genuinely better off:** the walker finishes (or even quits at mile 120) owning a unique artifact plus having actually read a primary text of American history. Durable residue, not points.
- **Survives the chatbot test:** a chat window cannot hold a months-long odometer, cannot withhold tomorrow's entry until you have walked to it (the withholding IS the product), and cannot guarantee verbatim fidelity. The product needs no runtime LLM at all, so the BYOK question vanishes entirely.
- **Survives the free-tool test:** World Walking, Walk The Distance, MistyWay, Camino for Good all verified (dossier, 2026-09-02) to carry no primary texts. The gap exists because mile-to-entry alignment is editorial labor no fitness company will fund and no hobbyist has finished. That labor is exactly what build-time agents are good at.
- **Demand is evidenced, not assumed:** 23 public hand-built "walk to Mordor" trackers on GitHub, an HN parent whose son walked 3,500 miles for a map dot, and the Éowyn Challenge serving this hunger with static charts since 2003.

## Verification performed this run (2026-09-09)

The whole premise rests on two claims I checked directly rather than trusted:

1. **The corpus is real, free, and complete.** Muir's *A Thousand-Mile Walk to the Gulf* is on Project Gutenberg (#60749), public domain, plain-text download. The Lewis & Clark journals are on Project Gutenberg (#8419, public domain, 3.5 MB plain text) with the UNL scholarly site as a cross-reference. Caution recorded below on the UNL edition's copyright.
2. **Mileposts land on real content, not filler** (the skeptic's strongest technical objection). I pulled the Muir plain text and inspected its structure: it is a dated, near-daily journal (Sept 1 through October, 1867) with named, mappable places appearing multiple times per page: "Sept 3... Salt River was nearly dry", "Sept 6. Started at the earliest bird song in hopes of seeing the great Mammoth Cave", Munfordville, Cumberland Mountains, Clinch River, Athens, Savannah, Bonaventure. This is alignable to cumulative miles. Lewis & Clark is even richer per mile: up to five journalists (Lewis, Clark, Ordway, Gass, Whitehouse) wrote on the same days, so a single milepost can carry multiple voices.

## Minimal feature set (the smallest product that delivers the value)

1. **Two verified journey packs at launch**: Lewis & Clark (best-documented case, multi-voice) and Muir's thousand-mile walk (short enough to finish in about a year at casual pace). A pack = route polyline + milepost-to-entry mapping + verbatim text + a short framing note.
2. **Daily check-in**: type a number (or drop a health-export file, parsed locally). One optional one-line personal log.
3. **The unlock**: crossing a milepost opens the traveler's entry for that ground, presented as "near this ground", never false GPS precision.
4. **The double journal**: their entries interleaved date-by-date with your one-line log; printable export plus plain-data export. Works from mile one, so a quitter at mile 120 still owns 120 miles of it.
5. **Local-first**: no accounts; state in local storage plus exportable file.

Everything else (more packs, sharing, groups, the "you leave when they left" synchronized variant) is out of MVP scope.

## Main risks (binding constraints for the plan)

1. **Retention rests on ritual, not automation.** A web app cannot count steps in the background; daily manual entry is the best-documented abandonment cause in health apps. Mitigations that must be designed in, not bolted on: first milepost reachable within the first week; value accrues from mile one via the double journal; the check-in must take under ten seconds. Anyone wanting invisible tracking is not this user, and the product must say so honestly.
2. **Milepost cadence is sparser than daily for casual walkers.** Muir averaged roughly 25 miles a day; a 2-mile-a-day walker unlocks one Muir day every week or two. Lewis & Clark moved about 10 to 15 miles a day with multiple journalists, so it meters better. The plan must design the between-milepost days (approach context, "you are 3 miles from where they camped", the personal log) so the ritual has a payoff even on non-unlock days. This is the single most important pacing design problem.
3. **Alignment is approximate scholarship.** Muir's route is reconstructed, not surveyed. Every pack needs a build-time verification pass (dates in order, miles monotonic, entries verbatim against source) and honest "near this ground" presentation. Agents can do this; the spec must task them to do it honestly.
4. **Edition copyright trap.** The UNL/Moulton edition's editorial apparatus is a University of Nebraska Press product and may be copyrighted even though the underlying 1804-06 text is not. Packs must be built from clean public-domain editions (Project Gutenberg #8419 for Lewis & Clark, #60749 for Muir), using UNL only as a route/date cross-reference.
5. **Period content needs framing.** Both texts contain period racism and violence (Muir walked the Reconstruction South; the expedition's encounters with Native nations are written in 1804 voice). Each pack carries a short, plain framing note. Serving the raw text with zero context is a defect; rewriting or bowdlerizing it destroys the verbatim promise. Frame, never edit.
6. **Quiet niche.** Thousands of devoted users, not millions. Acceptable under the factory's purpose (durable value over reach), stated so nobody later judges it a failure against a growth bar it never targeted.

## What would make me reject it

- If milepost alignment for the two launch texts proved impossible or mostly landed on empty logistics (checked: it does not; both texts are dated, place-rich, near-daily).
- If the primary texts were not cleanly public domain (checked: both Gutenberg editions are).
- If the product required background step counting to be honest (it does not; it is a deliberate check-in ritual and says so).
- If the plan drifts into a generic fitness tracker with quotes sprinkled on top: medals, streak-shaming, social feeds. The withheld verbatim text and the double journal are the product; if either is cut, kill the build.

## Note on the bolder sibling

The dossier's variant ("you leave when they left": entries arrive on the expedition's real calendar whether you walked or not) is the sharper signature moment but the crueler product, since a walker can fall irrecoverably behind. Recommendation: build the self-paced original as the MVP and treat the synchronized departure as a possible later mode, not a fork now.
