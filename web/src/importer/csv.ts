// Pure parser for a hand-made or exported `date,miles` CSV. No file access, no
// React: it takes decoded text and returns per-day totals or a designed,
// plain-voice error. The error carries a line NUMBER at most, never any of the
// file's own content, so a parse failure can never leak what the walker typed.

export interface DayTotal {
  date: string; // YYYY-MM-DD
  miles: number; // > 0, rounded to hundredths
}

export const MAX_CSV_BYTES = 1 * 1024 * 1024;

export type CsvResult =
  | { ok: true; days: DayTotal[] }
  | { ok: false; message: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NUM_RE = /^\d+(\.\d{1,2})?$/;
const HEADER_RE = /^date\s*,\s*miles$/i;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// A real calendar date, so "2026-13-40" is rejected even though it matches the
// shape.
function isRealDate(s: string): boolean {
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

// Line numbers are 1-based over the original file, so the message points the
// walker at the exact row to fix.
function badLine(lineNumber: number): CsvResult {
  return { ok: false, message: `Line ${lineNumber} needs the form 2026-06-01,3.5.` };
}

export function parseWalksCsv(text: string): CsvResult {
  const lines = text.split(/\r?\n/);
  const totals = new Map<string, number>();
  const order: string[] = [];
  let headerAllowed = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue; // blank and trailing lines are ignored

    if (headerAllowed && HEADER_RE.test(line)) {
      headerAllowed = false;
      continue;
    }
    headerAllowed = false;

    const parts = line.split(",");
    if (parts.length !== 2) return badLine(i + 1);
    const date = parts[0].trim();
    const value = parts[1].trim();
    if (!DATE_RE.test(date) || !isRealDate(date) || !NUM_RE.test(value)) {
      return badLine(i + 1);
    }
    const miles = Number(value);
    if (miles <= 0) return badLine(i + 1);

    if (!totals.has(date)) order.push(date);
    totals.set(date, round2((totals.get(date) ?? 0) + miles));
  }

  const days = order.map((date) => ({ date, miles: round2(totals.get(date)!) }));
  return { ok: true, days };
}
