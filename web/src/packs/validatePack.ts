import type { JourneyPack, Milepost } from "./types";

// Structural + intra-pack semantic validator. Pure, no fs, no source access,
// so it runs on any pack (the fixture and the Muir pack alike). Returns a list
// of human-readable violations; an empty list means the pack is valid.
//
// The Muir-only properties (verbatim text, >= 30 mileposts, route spread, the
// 1867 year) live in the source verifier (verifySource.ts / muir.verify.test.ts),
// not here, because the fixture legitimately has 3 invented mileposts.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// A decimal-degrees coordinate like "38.1, -85.7" or "38.1°": false GPS precision.
const COORD_RE = /\d+\.\d+\s*[,°]/;
const GPS_TOKEN_RE = /\b(lat|lng|lon|gps)\b/i;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function validatePack(pack: JourneyPack): string[] {
  const errors: string[] = [];

  // S1: top-level identity fields.
  if (!isNonEmptyString(pack.id)) errors.push("S1: pack.id must be a non-empty string");
  if (!isNonEmptyString(pack.title)) errors.push("S1: pack.title must be a non-empty string");
  if (!isNonEmptyString(pack.traveler)) errors.push("S1: pack.traveler must be a non-empty string");
  if (!isNonEmptyString(pack.years)) errors.push("S1: pack.years must be a non-empty string");
  if (!isFiniteNumber(pack.totalMiles) || pack.totalMiles <= 0)
    errors.push("S1: pack.totalMiles must be a finite number > 0");

  // S2: source provenance.
  const source = pack.source;
  if (!source || typeof source !== "object") {
    errors.push("S2: pack.source is required");
  } else {
    if (!isNonEmptyString(source.name)) errors.push("S2: source.name must be a non-empty string");
    if (!isNonEmptyString(source.author)) errors.push("S2: source.author must be a non-empty string");
    if (!isNonEmptyString(source.license)) errors.push("S2: source.license must be a non-empty string");
    if (typeof source.gutenbergId !== "number") errors.push("S2: source.gutenbergId must be a number");
    if (typeof source.url !== "string") errors.push("S2: source.url must be a string");
  }

  // S3: framing note.
  if (!isNonEmptyString(pack.framingNote)) errors.push("S3: pack.framingNote must be a non-empty string");

  // S10: companion line, the picker's "who you walk with".
  if (!isNonEmptyString(pack.companion)) errors.push("S10: pack.companion must be a non-empty string");

  // S4: mileposts array and unique ids.
  const mileposts = pack.mileposts;
  if (!Array.isArray(mileposts) || mileposts.length === 0) {
    errors.push("S4: pack.mileposts must be a non-empty array");
    return errors; // remaining rules assume an array of mileposts
  }

  const seenIds = new Set<string>();
  for (const m of mileposts) {
    if (!isNonEmptyString(m.id)) {
      errors.push("S4: every milepost id must be a non-empty string");
      continue;
    }
    if (seenIds.has(m.id)) errors.push(`S4: duplicate milepost id "${m.id}"`);
    seenIds.add(m.id);
  }

  // S5: per-milepost field rules.
  for (const m of mileposts) {
    const label = isNonEmptyString(m.id) ? m.id : "(unnamed)";
    if (!isFiniteNumber(m.mileMark) || m.mileMark <= 0)
      errors.push(`S5: milepost "${label}" mileMark must be a finite number > 0`);
    if (!isNonEmptyString(m.date) || !DATE_RE.test(m.date))
      errors.push(`S5: milepost "${label}" date must match YYYY-MM-DD`);
    if (!isNonEmptyString(m.place)) errors.push(`S5: milepost "${label}" place must be a non-empty string`);
    if (!Array.isArray(m.voices) || m.voices.length === 0) {
      errors.push(`S5: milepost "${label}" must have at least one voice`);
    } else {
      for (const v of m.voices) {
        if (!isNonEmptyString(v.author)) errors.push(`S5: milepost "${label}" voice author must be non-empty`);
        if (!isNonEmptyString(v.text)) errors.push(`S5: milepost "${label}" voice text must be non-empty`);
      }
    }
    // S8: approxNote framing.
    if (!isNonEmptyString(m.approxNote)) {
      errors.push(`S5: milepost "${label}" approxNote must be a non-empty string`);
    } else {
      if (!/near this ground/i.test(m.approxNote))
        errors.push(`S8: milepost "${label}" approxNote must contain "near this ground"`);
      if (COORD_RE.test(m.approxNote))
        errors.push(`S8: milepost "${label}" approxNote must not contain coordinate precision`);
      if (GPS_TOKEN_RE.test(m.approxNote))
        errors.push(`S8: milepost "${label}" approxNote must not contain lat/lng/lon/gps tokens`);
    }
    // S9: approach line present (a non-empty authored string).
    if (!isNonEmptyString(m.approach))
      errors.push(`S9: milepost "${label}" approach must be a non-empty string`);
  }

  // S6: mileMark strictly increasing.
  for (let i = 1; i < mileposts.length; i++) {
    if (!(mileposts[i].mileMark > mileposts[i - 1].mileMark))
      errors.push(
        `S6: mileMark must strictly increase (milepost "${label(mileposts[i])}" <= "${label(mileposts[i - 1])}")`,
      );
  }

  // S7: date non-decreasing.
  for (let i = 1; i < mileposts.length; i++) {
    if (mileposts[i].date < mileposts[i - 1].date)
      errors.push(`S7: date must be non-decreasing (milepost "${label(mileposts[i])}" before "${label(mileposts[i - 1])}")`);
  }

  return errors;
}

function label(m: Milepost): string {
  return isNonEmptyString(m.id) ? m.id : "(unnamed)";
}
