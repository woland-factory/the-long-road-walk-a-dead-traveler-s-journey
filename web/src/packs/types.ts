// Journey pack schema, defined once. Every pack (this one and future ones)
// must satisfy these types and the rules documented in SCHEMA.md.

export interface Voice {
  author: string; // e.g. "John Muir"
  text: string; // verbatim public-domain source. Framed, never edited.
  // EXEMPT from the copy sweep (see muir.copy.test.ts).
}

export interface Milepost {
  id: string; // unique within the pack, a stable slug (e.g. "muir-03-munfordville")
  mileMark: number; // cumulative miles reached; strictly increasing across mileposts
  date: string; // YYYY-MM-DD of the entry; non-decreasing across mileposts
  place: string; // a real place on the route (drawn from the traveler's text/geography)
  approxNote: string; // approximate-location framing; contains "near this ground"; never coordinates
  approach: string; // one short authored line about the ground AHEAD toward this milepost.
  // Present-day plain English, our words (not the traveler's), never spoils the entry,
  // swept for tone. Shown on the Trail before arrival, never at arrival.
  voices: Voice[]; // >= 1 entry. For Muir, exactly one (a single traveler).
}

export interface PackSource {
  name: string; // "A Thousand-Mile Walk to the Gulf"
  author: string; // "John Muir"
  gutenbergId: number; // 60749
  url: string; // canonical source URL used to fetch the committed text
  license: string; // "Public domain (Project Gutenberg)"
}

export interface JourneyPack {
  id: string; // e.g. "muir-thousand-mile-walk"
  title: string; // "A Thousand-Mile Walk to the Gulf"
  traveler: string; // "John Muir"
  years: string; // "1867"
  totalMiles: number; // ~1000
  source: PackSource; // provenance for verification and the README
  framingNote: string; // authored, plain period-content note (swept)
  route?: [number, number][]; // optional coarse polyline; NOT populated this EPIC
  mileposts: Milepost[]; // ordered ascending by mileMark
}
