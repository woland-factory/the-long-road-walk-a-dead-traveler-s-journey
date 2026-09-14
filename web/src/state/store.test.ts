import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { loadState, saveState, migrate, __resetDbForTests } from "./store";
import { freshState, addMiles } from "./odometer";
import { upsertFacingLine } from "./personalLog";
import { fixturePack } from "../packs/fixturePack";
import type { WalkerStateV1 } from "./types";

beforeEach(() => {
  // Fresh database per test so state never leaks between cases.
  globalThis.indexedDB = new IDBFactory();
  __resetDbForTests();
});

describe("store round-trip (AC3.1)", () => {
  it("saveState then loadState returns an identical record", async () => {
    const s = addMiles(freshState(fixturePack.id, "2026-09-01T00:00:00.000Z"), 12, "2026-09-01", fixturePack);
    await saveState(s);
    const loaded = await loadState();
    expect(loaded).toEqual(s);
  });

  it("round-trips a record carrying a personalLog (AC3.2)", async () => {
    let s = addMiles(freshState(fixturePack.id, "2026-09-01T00:00:00.000Z"), 12, "2026-09-01", fixturePack);
    s = upsertFacingLine(s, "fx-1", "Rain most of the way.", "2026-09-01");
    await saveState(s);
    const loaded = await loadState();
    expect(loaded).toEqual(s);
    expect(loaded?.personalLog).toHaveLength(1);
  });
});

describe("v1 to v2 migration (AC3.2)", () => {
  it("upgrades a literal v1 record to v2, preserving the walked miles", () => {
    const v1: WalkerStateV1 = {
      schemaVersion: 1,
      activePackId: fixturePack.id,
      createdAt: "2026-09-01T00:00:00.000Z",
      dailyLog: [{ date: "2026-09-01", miles: 12 }],
      cumulativeMiles: 12,
      reachedMilepostIds: ["fx-1"],
    };
    const migrated = migrate(v1);
    expect(migrated).toEqual({ ...v1, schemaVersion: 2, personalLog: [] });
    // Every walked mile and earned word is preserved.
    expect(migrated?.dailyLog).toEqual(v1.dailyLog);
    expect(migrated?.cumulativeMiles).toBe(12);
    expect(migrated?.reachedMilepostIds).toEqual(["fx-1"]);
  });

  it("loads a stored v1 record as an upgraded v2 record", async () => {
    const v1 = {
      schemaVersion: 1,
      activePackId: fixturePack.id,
      createdAt: "2026-09-01T00:00:00.000Z",
      dailyLog: [{ date: "2026-09-01", miles: 6 }],
      cumulativeMiles: 6,
      reachedMilepostIds: ["fx-1"],
    };
    await saveState(v1 as never);
    const loaded = await loadState();
    expect(loaded?.schemaVersion).toBe(2);
    expect(loaded?.personalLog).toEqual([]);
    expect(loaded?.cumulativeMiles).toBe(6);
  });
});

describe("empty database (AC3.2)", () => {
  it("loadState returns null without throwing", async () => {
    await expect(loadState()).resolves.toBeNull();
  });
});

describe("migration of unknown versions (AC3.3)", () => {
  it("treats an unknown schemaVersion as fresh (null)", () => {
    expect(migrate({ schemaVersion: 99, foo: "bar" })).toBeNull();
  });

  it("treats an absent schemaVersion as fresh (null)", () => {
    expect(migrate({ dailyLog: [] })).toBeNull();
  });

  it("treats non-object records as fresh (null)", () => {
    expect(migrate(null)).toBeNull();
    expect(migrate("garbage")).toBeNull();
    expect(migrate(42)).toBeNull();
  });

  it("passes a valid v2 record through unchanged", () => {
    const s = freshState(fixturePack.id, "2026-09-01T00:00:00.000Z");
    expect(migrate(s)).toEqual(s);
  });

  it("loadState on a stored unknown-version record returns null", async () => {
    // Persist a record that bypasses the typed API, then load it.
    await saveState({ schemaVersion: 99 } as never);
    await expect(loadState()).resolves.toBeNull();
  });
});
