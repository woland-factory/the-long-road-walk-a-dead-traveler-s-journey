import { describe, it, expect } from "vitest";
import {
  createRecordScanner,
  scanHealthExport,
  HEALTH_MESSAGES,
  XML_CHUNK_BYTES,
  type AbortFlag,
} from "./appleHealth";

const D = "HKQuantityTypeIdentifierDistanceWalkingRunning";

function record(attrs: Record<string, string>): string {
  const inner = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<Record ${inner}/>`;
}

describe("createRecordScanner counts and converts (AC5.1)", () => {
  it("counts only distance records, parses attributes in any order, converts units", () => {
    const scanner = createRecordScanner();
    // mi as-is.
    scanner.push(record({ type: D, sourceName: "Watch", unit: "mi", startDate: "2026-02-01 08:00:00 -0800", value: "3" }));
    // km, with attributes in a different order.
    scanner.push(record({ value: "8.04672", unit: "km", startDate: "2026-02-02 07:00:00 -0800", type: D, sourceName: "Watch" }));
    // m.
    scanner.push(record({ type: D, unit: "m", value: "1609.344", startDate: "2026-02-03 06:00:00 -0800", sourceName: "Watch" }));
    // A non-distance record is ignored entirely.
    scanner.push(record({ type: "HKQuantityTypeIdentifierStepCount", unit: "count", value: "999", startDate: "2026-02-01 08:00:00 -0800", sourceName: "Watch" }));

    const result = scanner.finish();
    expect(result).toEqual({
      ok: true,
      days: [
        { date: "2026-02-01", miles: 3 },
        { date: "2026-02-02", miles: 5 },
        { date: "2026-02-03", miles: 1 },
      ],
      skippedRecords: 0,
    });
  });
});

describe("per-day source rule (AC5.2)", () => {
  it("takes the largest single source, never the sum of sources", () => {
    const scanner = createRecordScanner();
    // One walk logged by both the watch and the phone on the same day.
    scanner.push(record({ type: D, sourceName: "Watch", unit: "mi", startDate: "2026-02-01 08:00:00 -0800", value: "2" }));
    scanner.push(record({ type: D, sourceName: "Watch", unit: "mi", startDate: "2026-02-01 12:00:00 -0800", value: "1" }));
    scanner.push(record({ type: D, sourceName: "Phone", unit: "mi", startDate: "2026-02-01 08:05:00 -0800", value: "2.5" }));

    const result = scanner.finish();
    // Watch sums to 3, Phone to 2.5; the day is the larger, 3, not 5.5.
    expect(result).toEqual({ ok: true, days: [{ date: "2026-02-01", miles: 3 }], skippedRecords: 0 });
  });
});

describe("chunk boundaries and malformed records (AC5.3)", () => {
  it("parses a record split across two pushed chunks exactly once", () => {
    const scanner = createRecordScanner();
    const tag = record({ type: D, sourceName: "Watch", unit: "mi", startDate: "2026-02-01 08:00:00 -0800", value: "4" });
    const cut = Math.floor(tag.length / 2);
    scanner.push(tag.slice(0, cut));
    scanner.push(tag.slice(cut));

    const result = scanner.finish();
    expect(result).toEqual({ ok: true, days: [{ date: "2026-02-01", miles: 4 }], skippedRecords: 0 });
  });

  it("skips unknown units and unreadable values without failing the scan", () => {
    const scanner = createRecordScanner();
    scanner.push(record({ type: D, sourceName: "Watch", unit: "mi", startDate: "2026-02-01 08:00:00 -0800", value: "3" }));
    scanner.push(record({ type: D, sourceName: "Watch", unit: "furlong", startDate: "2026-02-02 08:00:00 -0800", value: "3" }));
    scanner.push(record({ type: D, sourceName: "Watch", unit: "mi", startDate: "2026-02-03 08:00:00 -0800", value: "NaN" }));

    const result = scanner.finish();
    expect(result).toEqual({ ok: true, days: [{ date: "2026-02-01", miles: 3 }], skippedRecords: 2 });
  });
});

describe("finish with no walking records (AC5.4)", () => {
  it("returns the designed wrong-file error", () => {
    const scanner = createRecordScanner();
    scanner.push(record({ type: "HKQuantityTypeIdentifierStepCount", unit: "count", value: "500", startDate: "2026-02-01 08:00:00 -0800", sourceName: "Phone" }));
    expect(scanner.finish()).toEqual({ ok: false, message: HEALTH_MESSAGES.noWalking });
  });
});

// A minimal File stand-in: the driver only reads .size and slice(a,b).arrayBuffer().
function fakeFile(text: string, size: number): File {
  const bytes = new TextEncoder().encode(text);
  return {
    size,
    slice(start: number, end: number) {
      return {
        async arrayBuffer() {
          return bytes.slice(start, end).buffer;
        },
      };
    },
  } as unknown as File;
}

describe("scanHealthExport driver (AC5.4)", () => {
  it("reports monotonic byte progress across chunks", async () => {
    const xml = `<?xml version="1.0"?><HealthData>${record({ type: D, sourceName: "Watch", unit: "mi", startDate: "2026-02-01 08:00:00 -0800", value: "3" })}</HealthData>`;
    const size = XML_CHUNK_BYTES * 2 + 10; // forces three reads
    const progress: number[] = [];
    const signal: AbortFlag = { aborted: false };
    const result = await scanHealthExport(fakeFile(xml, size), (read) => progress.push(read), signal);

    expect(result).toEqual({ ok: true, days: [{ date: "2026-02-01", miles: 3 }], skippedRecords: 0 });
    expect(progress).toEqual([XML_CHUNK_BYTES, XML_CHUNK_BYTES * 2, size]);
    for (let i = 1; i < progress.length; i++) expect(progress[i]).toBeGreaterThan(progress[i - 1]);
  });

  it("stops promptly once the abort flag is set", async () => {
    const size = XML_CHUNK_BYTES * 3;
    const signal: AbortFlag = { aborted: false };
    let calls = 0;
    const result = await scanHealthExport(
      fakeFile("<HealthData></HealthData>", size),
      () => {
        calls++;
        signal.aborted = true; // abort after the first chunk
      },
      signal,
    );
    expect(result.ok).toBe(false);
    expect(calls).toBe(1);
  });
});
