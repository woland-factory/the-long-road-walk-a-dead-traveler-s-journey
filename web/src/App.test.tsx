import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { freshState } from "./state/odometer";
import { saveState, __resetDbForTests } from "./state/store";

function setSeedDemo(on: boolean) {
  window.__ENV__ = { SEED_DEMO: on ? "true" : "false", SENTRY_DSN: "", UMAMI_URL: "", UMAMI_WEBSITE_ID: "" };
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  __resetDbForTests();
  setSeedDemo(false);
  window.localStorage.clear();
});

afterEach(() => {
  delete window.__ENV__;
});

describe("boot gate: fresh database (AC2.1)", () => {
  it("shows Start and no Trail when there is no record and no SEED_DEMO", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Choose a journey" })).toBeInTheDocument();
    expect(screen.getByText(/log them here once a day/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Miles walked today")).not.toBeInTheDocument();
  });
});

describe("boot gate: existing record (AC2.2)", () => {
  it("boots straight to the Trail and never mounts Start", async () => {
    await saveState(freshState("muir-thousand-mile-walk", "2026-09-01T00:00:00.000Z"));
    render(<App />);
    expect(await screen.findByLabelText("Miles walked today")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Choose a journey" })).not.toBeInTheDocument();
  });

  it("falls back to the Muir pack for an unknown activePackId", async () => {
    await saveState(freshState("a-pack-that-was-removed", "2026-09-01T00:00:00.000Z"));
    render(<App />);
    // The Trail mounts (Muir masthead), not Start.
    expect(await screen.findByText(/Walk John Muir's journey/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Choose a journey" })).not.toBeInTheDocument();
  });
});

describe("boot gate: SEED_DEMO bypass (AC2.3)", () => {
  it("boots to the seeded Trail and never mounts Start", async () => {
    setSeedDemo(true);
    render(<App />);
    // The seed crosses the first two Muir mileposts, so the odometer shows miles.
    expect(await screen.findByTestId("odometer-value")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Choose a journey" })).not.toBeInTheDocument();
  });
});

describe("choosing a journey persists the record (AC2.6)", () => {
  it("begins the journey and a remount boots straight to the Trail", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    // Two packs now share a visible label; pick Muir by its accessible name.
    await user.click(
      await screen.findByRole("button", { name: "Begin A Thousand-Mile Walk to the Gulf" }),
    );

    // The Trail replaces Start in place.
    expect(await screen.findByLabelText("Miles walked today")).toBeInTheDocument();
    unmount();

    // A fresh mount reads the persisted record and skips Start.
    render(<App />);
    expect(await screen.findByLabelText("Miles walked today")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Choose a journey" })).not.toBeInTheDocument();
  });
});
