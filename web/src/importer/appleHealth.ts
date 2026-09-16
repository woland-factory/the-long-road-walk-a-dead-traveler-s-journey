import type { DayTotal } from "./csv";

// Chunked scanner for an Apple Health `export.xml`. Real exports run to hundreds
// of megabytes, so the driver reads the File in bounded slices and the pure core
// accumulates per-day per-source sums from decoded text chunks. Everything runs
// on the device; no bytes leave it.

export const MAX_HEALTH_XML_BYTES = 1024 * 1024 * 1024; // 1 GiB
export const XML_CHUNK_BYTES = 8 * 1024 * 1024; // 8 MiB reads
export const XML_CARRY_BYTES = 64 * 1024; // bounded tail for a split tag

const DISTANCE_TYPE = "HKQuantityTypeIdentifierDistanceWalkingRunning";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const START_TOKEN = "<Record";

export const HEALTH_MESSAGES = {
  noWalking:
    "This file holds no walking distance. In the Health app, export your data, unzip export.zip, and choose the export.xml inside.",
  tooLarge: "That export is larger than this app can read. Choose an export.xml under 1 GB.",
} as const;

export type XmlResult =
  | { ok: true; days: DayTotal[]; skippedRecords: number }
  | { ok: false; message: string };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Read one attribute by name from a tag's text. Attributes are matched by name,
// never by position, so record field order never matters.
function attr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}="([^"]*)"`);
  const m = re.exec(tag);
  return m ? m[1] : null;
}

// Convert a distance value to miles, or null if the unit is unsupported or the
// value cannot be read. Under-counting is safe; inventing miles is not.
function toMiles(value: string | null, unit: string | null): number | null {
  if (value === null || unit === null) return null;
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  switch (unit) {
    case "mi":
      return n;
    case "km":
      return n * 0.621371;
    case "m":
      return n / 1609.344;
    default:
      return null;
  }
}

export interface RecordScanner {
  push(chunk: string): void;
  finish(): XmlResult;
}

// Pure core: feed it decoded text chunks in order, then call finish(). Days are
// keyed by the date part of startDate; each day's miles is the LARGEST single
// source's sum (a watch and a phone report the same walk, so summing sources
// would inflate the miles and unlock unearned entries).
export function createRecordScanner(): RecordScanner {
  const perDay = new Map<string, Map<string, number>>(); // date -> sourceName -> raw miles
  let skipped = 0;
  let carry = "";

  function processTag(tag: string): void {
    if (attr(tag, "type") !== DISTANCE_TYPE) return;
    const startDate = attr(tag, "startDate");
    const date = startDate && startDate.length >= 10 ? startDate.slice(0, 10) : null;
    const miles = toMiles(attr(tag, "value"), attr(tag, "unit"));
    if (!date || !DATE_RE.test(date) || miles === null) {
      skipped++;
      return;
    }
    const source = attr(tag, "sourceName") ?? "";
    let sources = perDay.get(date);
    if (!sources) {
      sources = new Map();
      perDay.set(date, sources);
    }
    sources.set(source, (sources.get(source) ?? 0) + miles);
  }

  function push(chunk: string): void {
    let buf = carry + chunk;
    let from = 0;
    for (;;) {
      const start = buf.indexOf(START_TOKEN, from);
      if (start === -1) {
        // Keep a tiny tail so a "<Record" token split across the boundary is
        // rejoined on the next push.
        carry = buf.slice(Math.max(0, buf.length - (START_TOKEN.length - 1)));
        return;
      }
      const end = buf.indexOf(">", start);
      if (end === -1) {
        // The tag itself spans the boundary. Carry it, bounded so a pathological
        // unterminated tag can never grow without limit.
        carry = buf.slice(start);
        if (carry.length > XML_CARRY_BYTES) carry = "";
        return;
      }
      processTag(buf.slice(start, end + 1));
      from = end + 1;
    }
  }

  function finish(): XmlResult {
    if (perDay.size === 0) {
      return { ok: false, message: HEALTH_MESSAGES.noWalking };
    }
    const days: DayTotal[] = [];
    for (const [date, sources] of perDay) {
      let max = 0;
      for (const sum of sources.values()) if (sum > max) max = sum;
      days.push({ date, miles: round2(max) });
    }
    days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return { ok: true, days, skippedRecords: skipped };
  }

  return { push, finish };
}

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export interface AbortFlag {
  aborted: boolean;
}

// Async driver over the File: slice in bounded chunks, decode with a streaming
// TextDecoder, push each chunk, yield to the event loop so the UI stays live,
// and report progress by bytes read. Returns a distinct aborted result when the
// caller flips the flag.
export async function scanHealthExport(
  file: File,
  onProgress: (bytesRead: number, totalBytes: number) => void,
  signal: AbortFlag,
): Promise<XmlResult> {
  if (file.size > MAX_HEALTH_XML_BYTES) {
    return { ok: false, message: HEALTH_MESSAGES.tooLarge };
  }
  const scanner = createRecordScanner();
  const decoder = new TextDecoder("utf-8");
  const total = file.size;
  let offset = 0;

  while (offset < total) {
    if (signal.aborted) return { ok: false, message: "" };
    const end = Math.min(offset + XML_CHUNK_BYTES, total);
    const buffer = await file.slice(offset, end).arrayBuffer();
    scanner.push(decoder.decode(buffer, { stream: end < total }));
    offset = end;
    onProgress(offset, total);
    await nextTick();
  }

  if (signal.aborted) return { ok: false, message: "" };
  return scanner.finish();
}
