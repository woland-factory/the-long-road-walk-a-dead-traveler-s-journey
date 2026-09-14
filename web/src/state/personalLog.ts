import type { PersonalEntry, WalkerState } from "./types";

// Pure helpers for the walker's facing lines. No IndexedDB, no React, so they
// are cheap to test exhaustively. `text` is assumed already validated and
// whitespace-collapsed by the caller (see trail/facingLine.ts).

// Upsert the facing line for a milepost. Empty text removes any stored entry
// (the walker chose to leave no line); non-empty text replaces or appends one.
export function upsertFacingLine(
  state: WalkerState,
  milepostId: string,
  text: string,
  date: string,
): WalkerState {
  const rest = state.personalLog.filter((e) => e.milepostId !== milepostId);
  if (text === "") {
    return { ...state, personalLog: rest };
  }
  const entry: PersonalEntry = { date, milepostId, text };
  return { ...state, personalLog: [...rest, entry] };
}

// The walker's saved facing line for a milepost, or "" when none.
export function facingLineFor(state: WalkerState, milepostId: string): string {
  return state.personalLog.find((e) => e.milepostId === milepostId)?.text ?? "";
}
