// Source-verification helpers: the machine proof that every earned line in a
// pack is the traveler's verbatim words. Pure string functions with no fs so
// they are trivially testable; the verifier test (muir.verify.test.ts) reads
// the committed Gutenberg source and drives these.

// Anchors tie the comparison to the committed source bytes
// (web/src/packs/sources/gutenberg-60749.txt).
//
// NARRATIVE_START is the first line of Chapter I. Starting the window here
// excludes the editor's introduction, so a paraphrase living only in the
// introduction can never match. The source hard-wraps at ~70 columns, so this
// constant stops at the line break ("...the Northern\nStates...") to match the
// raw bytes before whitespace is collapsed.
export const NARRATIVE_START =
  "I had long been looking from the wildwoods and gardens of the Northern";

// The #8419 (Lewis & Clark) start anchor. It is the first line of the first
// 1804 entry body (Clark, May 14, 1804, at Camp River Dubois), so the window
// excludes the Gutenberg boilerplate and the compiler's front matter. Like
// NARRATIVE_START it stops at the source's hard line break ("...proceded up
// the\r\nMissouris...") to match the raw bytes, and it occurs exactly once in
// the committed file.
export const LC_NARRATIVE_START =
  "Set out from Camp River a Dubois at 4 oClock P.M. and proceded up the";

// The standard Project Gutenberg end-of-text marker, identical in both files.
export const GUTENBERG_END_MARKER = "*** END OF THE PROJECT GUTENBERG EBOOK";

// Collapse every run of whitespace (spaces, tabs, CR, LF) to a single space.
function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// Clean the raw source into a comparable narrative body:
//   1. take the narrative window (Chapter I .. Gutenberg end marker),
//   2. remove "_" italic markers,
//   3. remove every "[...]" editorial span (insertions, footnote markers,
//      "[Illustration]" tags) with a non-greedy match,
//   4. collapse whitespace and trim.
// Steps 2 and 3 strip the editor's apparatus so only the traveler's words
// remain to match against.
//
// `start` selects the narrative window's opening anchor. It defaults to
// NARRATIVE_START, so the existing Muir call `cleanSource(raw)` is byte-for-byte
// unchanged; a second source (Lewis & Clark) passes its own LC_NARRATIVE_START.
export function cleanSource(raw: string, start: string = NARRATIVE_START): string {
  const startIdx = raw.indexOf(start);
  const end = raw.indexOf(GUTENBERG_END_MARKER);
  const window = raw.slice(startIdx === -1 ? 0 : startIdx, end === -1 ? raw.length : end);
  const noItalics = window.replace(/_/g, "");
  const noBrackets = noItalics.replace(/\[[^\]]*\]/g, "");
  return collapseWhitespace(noBrackets);
}

// Normalize a pack excerpt for comparison: collapse whitespace only. The pack
// text must already be clean of apparatus (guarded by V2), so no "_" or "[...]"
// stripping happens here.
export function normalizeExcerpt(text: string): string {
  return collapseWhitespace(text);
}
