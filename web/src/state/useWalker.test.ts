import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useWalker } from "./useWalker";
import { fixturePack } from "../packs/fixturePack";
import { loadState, __resetDbForTests } from "./store";
import type { WalkerState } from "./types";

// AC5.3: restoreState replaces the walker record, recomputes derived fields
// against the pack, persists, and never auto-opens the Arrival.

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  __resetDbForTests();
  window.__ENV__ = { SEED_DEMO: "false", SENTRY_DSN: "", UMAMI_URL: "", UMAMI_WEBSITE_ID: "" };
});

afterEach(() => {
  delete window.__ENV__;
});

// A backup whose derived fields are stale on purpose: only the log is truth.
function staleBackup(): WalkerState {
  return {
    schemaVersion: 2,
    activePackId: fixturePack.id,
    createdAt: "2026-08-01T00:00:00.000Z",
    dailyLog: [
      { date: "2026-08-01", miles: 6 },
      { date: "2026-08-02", miles: 7 },
    ],
    cumulativeMiles: 0, // stale
    reachedMilepostIds: [], // stale
    personalLog: [{ date: "2026-08-01", milepostId: "fx-1", text: "First ford behind me." }],
  };
}

describe("useWalker.importDays (AC4.4)", () => {
  it("merges days, recomputes, persists, and queues newly crossed mileposts", async () => {
    const { result } = renderHook(() => useWalker(fixturePack));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    // Two days that together cross fx-1 (mile 5) and fx-2 (mile 12): 8 + 5 = 13.
    act(() =>
      result.current.importDays([
        { date: "2026-06-02", miles: 5 },
        { date: "2026-06-01", miles: 8 },
      ]),
    );

    const state = result.current.state!;
    expect(state.cumulativeMiles).toBe(13);
    // Log is sorted ascending by date.
    expect(state.dailyLog.map((e) => e.date)).toEqual(["2026-06-01", "2026-06-02"]);
    // Both crossings queue ascending by mileMark.
    expect(result.current.pendingArrival).toEqual(["fx-1", "fx-2"]);

    await waitFor(async () => {
      expect(await loadState()).toEqual(state);
    });
  });

  it("creates a fresh record when importing the first miles", async () => {
    const { result } = renderHook(() => useWalker(fixturePack));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.state).toBeNull();

    act(() => result.current.importDays([{ date: "2026-06-01", miles: 2 }]));

    expect(result.current.state!.cumulativeMiles).toBe(2);
    expect(result.current.state!.activePackId).toBe(fixturePack.id);
    // Below fx-1 (mile 5): nothing crossed.
    expect(result.current.pendingArrival).toEqual([]);
  });
});

describe("useWalker.restoreState", () => {
  it("recomputes, persists, sets state, and clears pendingArrival", async () => {
    const { result } = renderHook(() => useWalker(fixturePack));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    // Create a fresh crossing so pendingArrival is non-empty.
    act(() => result.current.logMiles(6));
    expect(result.current.pendingArrival).toEqual(["fx-1"]);

    act(() => result.current.restoreState(staleBackup()));

    const state = result.current.state;
    expect(state).not.toBeNull();
    // Derived fields recomputed from the imported log, never trusted.
    expect(state!.cumulativeMiles).toBe(13);
    expect(state!.reachedMilepostIds).toEqual(["fx-1", "fx-2"]);
    expect(state!.personalLog[0].text).toBe("First ford behind me.");
    // A restore is not a fresh crossing.
    expect(result.current.pendingArrival).toEqual([]);

    // Persisted: a reload would see the restored record.
    await waitFor(async () => {
      expect(await loadState()).toEqual(state);
    });
  });
});
