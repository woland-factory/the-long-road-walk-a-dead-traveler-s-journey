# Journey pack schema

A journey pack is the content unit of The Long Road: one documented historic
walk, its verified mileposts, and the traveler's own diary words keyed to the
ground they reached. The types live in `types.ts`; this document is the prose
contract every pack must satisfy.

## The three binding rules

1. **Dates are non-decreasing.** `mileposts[i].date >= mileposts[i-1].date`. A
   real one-way walk can pass two mileposts in one long day, so dates may
   repeat, but the walk never goes backward in time.
2. **`mileMark` is strictly increasing.** `mileposts[i].mileMark >
   mileposts[i-1].mileMark`. Every milepost is a distinct position further along
   the route than the last.
3. **`voices[].text` is verbatim and never edited.** Each voice text is the
   traveler's exact public-domain words, reproduced byte-for-byte from the
   committed source (after a defined whitespace normalization, with the editor's
   apparatus excluded). We frame this text, we never soften or rewrite it.

## Types

### `JourneyPack`

| Field         | Type                  | Rule |
| ------------- | --------------------- | ---- |
| `id`          | string                | Non-empty, stable pack identifier (e.g. `muir-thousand-mile-walk`). |
| `title`       | string                | Non-empty. The work's title. Authored copy: swept for tone. |
| `traveler`    | string                | Non-empty. The diarist (e.g. `John Muir`). |
| `years`       | string                | Non-empty. The journey year(s) (e.g. `1867`). |
| `totalMiles`  | number                | Finite, greater than 0. Approximate route length. |
| `source`      | `PackSource`          | Provenance for verification and the README (see below). |
| `framingNote` | string                | Non-empty. Authored, present-day note that frames the period content. Swept for tone. |
| `route`       | `[number, number][]?` | Optional coarse polyline. Not populated yet. No map is rendered. |
| `mileposts`   | `Milepost[]`          | Non-empty, ordered ascending by `mileMark`. |

### `Milepost`

| Field        | Type      | Rule |
| ------------ | --------- | ---- |
| `id`         | string    | Non-empty, unique within the pack. A stable slug (e.g. `muir-03-munfordville`). |
| `mileMark`   | number    | Finite, greater than 0, within `(0, totalMiles]`. Strictly increasing across mileposts. |
| `date`       | string    | `YYYY-MM-DD`. A real calendar date. Non-decreasing across mileposts. |
| `place`      | string    | Non-empty. A real place on the route. Factual data: NOT swept. |
| `approxNote` | string    | Non-empty. Contains the phrase `near this ground` (case-insensitive). Carries no coordinate precision (no decimal degrees, no `lat`/`lng`/`lon`/`gps`). Authored copy: swept. |
| `voices`     | `Voice[]` | At least one entry. For a single traveler, exactly one. |

### `Voice`

| Field    | Type   | Rule |
| -------- | ------ | ---- |
| `author` | string | Non-empty. Whose words these are. |
| `text`   | string | Non-empty. The traveler's verbatim public-domain words. Carries no editorial apparatus (`[`, `]`, `_`). At least ~40 characters with at least one sentence. Primary source: NOT swept. |

### `PackSource`

| Field         | Type   | Rule |
| ------------- | ------ | ---- |
| `name`        | string | Non-empty. The work's title. |
| `author`      | string | Non-empty. |
| `gutenbergId` | number | The Project Gutenberg ebook number. |
| `url`         | string | The canonical download URL for the committed source text. |
| `license`     | string | Non-empty (e.g. `Public domain (Project Gutenberg)`). |

## How packs are verified

- **Structural rules** (the table constraints above, plus the two monotonicity
  rules and the `approxNote` framing) are checked by `validatePack.ts` and run
  on every pack in `validatePack.test.ts`.
- **Verbatim rules** (the traveler's text matches the committed source, no
  apparatus, substantial passages, dates in the journey year, at least 30
  mileposts spread across the route) are checked by `verifySource.ts` and
  `muir.verify.test.ts`, which read the committed public-domain source under
  `sources/` with `fs`. The source file is never imported by app code.
- **Copy tone**: the authored fields (`title`, `framingNote`, `approxNote`) are
  swept in `muir.copy.test.ts`. The primary source (`voices[].text`, `place`,
  `date`) is exempt: it is factual and verbatim, and editing it would break the
  verbatim promise.

Any violation fails `npm test` / `npm run validate:packs`, which fails the build.
