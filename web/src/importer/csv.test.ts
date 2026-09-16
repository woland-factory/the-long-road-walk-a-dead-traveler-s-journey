import { describe, it, expect } from "vitest";
import { parseWalksCsv } from "./csv";

// AC4.1 / AC4.2: the pure CSV parser.

describe("parseWalksCsv accepts well-formed files (AC4.1)", () => {
  it("parses rows with a header, tolerating blank and trailing lines", () => {
    const text = "date,miles\n2026-06-01,3.5\n\n2026-06-02,4\n";
    const result = parseWalksCsv(text);
    expect(result).toEqual({
      ok: true,
      days: [
        { date: "2026-06-01", miles: 3.5 },
        { date: "2026-06-02", miles: 4 },
      ],
    });
  });

  it("parses a file with no header", () => {
    const result = parseWalksCsv("2026-06-01,2\n2026-06-02,3");
    expect(result).toEqual({
      ok: true,
      days: [
        { date: "2026-06-01", miles: 2 },
        { date: "2026-06-02", miles: 3 },
      ],
    });
  });

  it("sums duplicate dates and rounds to hundredths, keeping file order", () => {
    const text = "2026-06-02,1.1\n2026-06-01,0.1\n2026-06-01,0.2\n2026-06-02,2.2";
    const result = parseWalksCsv(text);
    expect(result).toEqual({
      ok: true,
      days: [
        { date: "2026-06-02", miles: 3.3 },
        { date: "2026-06-01", miles: 0.3 },
      ],
    });
  });

  it("tolerates whitespace around the header and values", () => {
    const result = parseWalksCsv(" Date , Miles \n 2026-06-01 , 3 ");
    expect(result).toEqual({ ok: true, days: [{ date: "2026-06-01", miles: 3 }] });
  });
});

describe("parseWalksCsv rejects the first bad line whole (AC4.2)", () => {
  const cases: Array<[string, string, number]> = [
    ["a bad date", "date,miles\n2026-13-40,3", 2],
    ["a non-date first column", "not-a-date,3", 1],
    ["a non-numeric value", "date,miles\n2026-06-01,oops", 2],
    ["a negative value", "2026-06-01,-3", 1],
    ["more than two decimals", "2026-06-01,3.555", 1],
    ["a zero value", "2026-06-01,0", 1],
    ["a wrong column count", "2026-06-01,3,extra", 1],
  ];
  for (const [label, text, line] of cases) {
    it(`rejects ${label} with the line number`, () => {
      const result = parseWalksCsv(text);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBe(`Line ${line} needs the form 2026-06-01,3.5.`);
        // The message never carries the file's own content.
        expect(result.message).not.toMatch(/oops|extra/);
      }
    });
  }
});
