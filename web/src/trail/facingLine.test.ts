import { describe, it, expect } from "vitest";
import { parseFacingLine, MAX_FACING_LINE_CHARS } from "./facingLine";

describe("parseFacingLine (AC3.4)", () => {
  it("trims leading and trailing whitespace", () => {
    expect(parseFacingLine("   walked far today   ")).toEqual({ ok: true, text: "walked far today" });
  });

  it("collapses internal whitespace to single spaces", () => {
    expect(parseFacingLine("rain    most\tof   the way")).toEqual({ ok: true, text: "rain most of the way" });
  });

  it("collapses newlines to spaces so it stays one line", () => {
    expect(parseFacingLine("first\nsecond\r\nthird")).toEqual({ ok: true, text: "first second third" });
  });

  it("allows empty input, yielding an empty string", () => {
    expect(parseFacingLine("")).toEqual({ ok: true, text: "" });
    expect(parseFacingLine("   \n  ")).toEqual({ ok: true, text: "" });
  });

  it("caps length at MAX_FACING_LINE_CHARS", () => {
    const long = "a".repeat(MAX_FACING_LINE_CHARS + 50);
    const result = parseFacingLine(long);
    expect(result.text.length).toBe(MAX_FACING_LINE_CHARS);
  });

  it("keeps a line at exactly the cap intact", () => {
    const exact = "b".repeat(MAX_FACING_LINE_CHARS);
    expect(parseFacingLine(exact).text.length).toBe(MAX_FACING_LINE_CHARS);
  });
});
