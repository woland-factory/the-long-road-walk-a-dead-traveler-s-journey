import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { loadState, saveState, migrate, __resetDbForTests } from "./store";
import { freshState, addMiles } from "./odometer";
import { fixturePack } from "../packs/fixturePack";

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

  it("passes a valid v1 record through", () => {
    const s = freshState(fixturePack.id, "2026-09-01T00:00:00.000Z");
    expect(migrate(s)).toEqual(s);
  });

  it("loadState on a stored unknown-version record returns null", async () => {
    // Persist a record that bypasses the typed API, then load it.
    await saveState({ schemaVersion: 99 } as never);
    await expect(loadState()).resolves.toBeNull();
  });
});
