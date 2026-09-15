import { describe, it, expect } from "vitest";
import {
  BACKUP_FORMAT,
  MAX_BACKUP_BYTES,
  parseBackup,
  serializeBackup,
} from "./backup";
import { freshState, addMiles } from "./odometer";
import { upsertFacingLine } from "./personalLog";
import { fixturePack } from "../packs/fixturePack";
import type { WalkerState, WalkerStateV1 } from "./types";

// A non-trivial state: multi-day log, two reached mileposts, a personal line.
function richState(): WalkerState {
  let state = freshState(fixturePack.id, "2026-09-01T08:00:00.000Z");
  state = addMiles(state, 6, "2026-09-01", fixturePack);
  state = addMiles(state, 7.5, "2026-09-02", fixturePack);
  state = upsertFacingLine(state, "fx-1", "Cold river, warm sun.", "2026-09-01");
  return state;
}

describe("serializeBackup (AC4.1)", () => {
  it("wraps the full state in a versioned envelope as pretty JSON", () => {
    const state = richState();
    const text = serializeBackup(state, "2026-09-10T12:00:00.000Z");
    const parsed = JSON.parse(text);
    expect(parsed.format).toBe(BACKUP_FORMAT);
    expect(parsed.version).toBe(state.schemaVersion);
    expect(parsed.exportedAt).toBe("2026-09-10T12:00:00.000Z");
    expect(parsed.state).toEqual(state);
    // Pretty-printed so the walker can read their own file.
    expect(text.includes("\n  ")).toBe(true);
  });
});

describe("the export carries no traveler verbatim text (AC4.2)", () => {
  it("serializes walker state only, never the pack's voices", () => {
    const state = richState(); // fx-1 and fx-2 reached
    const text = serializeBackup(state, "2026-09-10T12:00:00.000Z");
    for (const milepost of fixturePack.mileposts) {
      for (const voice of milepost.voices) {
        expect(text.includes(voice.text)).toBe(false);
      }
    }
  });
});

describe("lossless round-trip (AC5.1)", () => {
  it("parseBackup(serializeBackup(state)) returns the original state", () => {
    const state = richState();
    const result = parseBackup(serializeBackup(state, "2026-09-10T12:00:00.000Z"));
    expect(result).toEqual({ ok: true, state });
  });
});

describe("boundary rejection (AC5.2)", () => {
  it("rejects non-JSON text without throwing", () => {
    const result = parseBackup("this is a walk, never a backup {");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message.length).toBeGreaterThan(0);
  });

  it("rejects a wrong format", () => {
    const text = JSON.stringify({
      format: "someone-else/state",
      version: 2,
      exportedAt: "x",
      state: richState(),
    });
    expect(parseBackup(text).ok).toBe(false);
  });

  it("rejects a missing state field", () => {
    const text = JSON.stringify({ format: BACKUP_FORMAT, version: 2, exportedAt: "x" });
    expect(parseBackup(text).ok).toBe(false);
  });

  it("rejects wrong-typed state fields", () => {
    const broken = { ...richState(), dailyLog: "not an array" };
    const text = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 2,
      exportedAt: "x",
      state: broken,
    });
    expect(parseBackup(text).ok).toBe(false);
  });

  it("rejects malformed log entries", () => {
    const broken = { ...richState(), dailyLog: [{ date: 3, miles: "six" }] };
    const text = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 2,
      exportedAt: "x",
      state: broken,
    });
    expect(parseBackup(text).ok).toBe(false);
  });

  it("rejects an unknown schema version", () => {
    const future = { ...richState(), schemaVersion: 99 };
    const text = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 99,
      exportedAt: "x",
      state: future,
    });
    expect(parseBackup(text).ok).toBe(false);
  });

  it("rejects text larger than MAX_BACKUP_BYTES", () => {
    const oversized = "x".repeat(MAX_BACKUP_BYTES + 1);
    expect(parseBackup(oversized).ok).toBe(false);
  });

  it("accepts a v1 envelope and migrates it to v2", () => {
    const v1: WalkerStateV1 = {
      schemaVersion: 1,
      activePackId: fixturePack.id,
      createdAt: "2026-09-01T08:00:00.000Z",
      dailyLog: [{ date: "2026-09-01", miles: 6 }],
      cumulativeMiles: 6,
      reachedMilepostIds: ["fx-1"],
    };
    const text = JSON.stringify({
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: "x",
      state: v1,
    });
    const result = parseBackup(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.schemaVersion).toBe(2);
      expect(result.state.personalLog).toEqual([]);
      expect(result.state.dailyLog).toEqual(v1.dailyLog);
    }
  });
});
