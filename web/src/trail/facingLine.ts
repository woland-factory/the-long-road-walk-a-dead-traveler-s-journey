// Boundary validator for the walker's facing line. It keeps the value to a
// single tidy line and never blocks the walker, so there is no failure path:
// empty input is allowed and means "no line".

export const MAX_FACING_LINE_CHARS = 280;

export function parseFacingLine(input: string): { ok: true; text: string } {
  // Collapse every run of whitespace (including newlines) to a single space so
  // it stays one line, trim the ends, then cap the length.
  const collapsed = input.replace(/\s+/g, " ").trim();
  const text = collapsed.slice(0, MAX_FACING_LINE_CHARS);
  return { ok: true, text };
}
