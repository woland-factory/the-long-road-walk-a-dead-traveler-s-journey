import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trail } from "./Trail";
import { fixturePack } from "../packs/fixturePack";
import { saveState, __resetDbForTests } from "../state/store";
import { freshState, addMiles } from "../state/odometer";

const FX1_TEXT = "We crossed the river at dawn";
const FX2_TEXT = "We rested on the ridge";
const FX3_TEXT = "We reached the meadow by evening";

function setSeedDemo(on: boolean) {
  window.__ENV__ = { SEED_DEMO: on ? "true" : "false", SENTRY_DSN: "", UMAMI_URL: "", UMAMI_WEBSITE_ID: "" };
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  __resetDbForTests();
  setSeedDemo(false);
});

afterEach(() => {
  delete window.__ENV__;
});

describe("loading state (AC6.2)", () => {
  it("shows a skeleton that holds the layout before the store resolves", () => {
    render(<Trail pack={fixturePack} />);
    // Synchronously after mount the store promise is still pending.
    expect(screen.getByLabelText("Loading your trail")).toBeInTheDocument();
  });
});

describe("empty state (AC6.1, AC7.3)", () => {
  it("shows positive directive copy for a fresh visitor with SEED_DEMO off", async () => {
    render(<Trail pack={fixturePack} />);
    expect(await screen.findByText("Your road starts here")).toBeInTheDocument();
    expect(screen.getByText(/Log your first miles to begin/)).toBeInTheDocument();
  });
});

describe("withhold then reveal (AC5.3)", () => {
  it("does not render milepost text until the odometer reaches its mark", async () => {
    const user = userEvent.setup();
    render(<Trail pack={fixturePack} />);
    await screen.findByText("Your road starts here");

    // Below fx-1 (mile 5): its text must be absent from the DOM.
    await user.type(screen.getByLabelText("Miles walked today"), "4");
    await user.click(screen.getByRole("button", { name: "Log miles" }));
    await screen.findByTestId("odometer-value");
    expect(screen.queryByText(new RegExp(FX1_TEXT))).not.toBeInTheDocument();

    // Cross fx-1: its text is now revealed.
    await user.type(screen.getByLabelText("Miles walked today"), "2");
    await user.click(screen.getByRole("button", { name: "Log miles" }));
    expect(await screen.findByText(new RegExp(FX1_TEXT))).toBeInTheDocument();
    // fx-2 (mile 12) is still withheld at 6 miles.
    expect(screen.queryByText(new RegExp(FX2_TEXT))).not.toBeInTheDocument();
  });
});

describe("SEED_DEMO seeding (AC7.1)", () => {
  it("shows an earned fixture entry on first load with no input", async () => {
    setSeedDemo(true);
    render(<Trail pack={fixturePack} />);
    expect(await screen.findByTestId("odometer-value")).toHaveTextContent("14");
    expect(screen.getByText(new RegExp(FX1_TEXT))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(FX2_TEXT))).toBeInTheDocument();
    // fx-3 (mile 20) is still withheld at 14 miles.
    expect(screen.queryByText(new RegExp(FX3_TEXT))).not.toBeInTheDocument();
  });
});

describe("SEED_DEMO never overwrites real state (AC7.2)", () => {
  it("keeps existing walker state even when SEED_DEMO is on", async () => {
    const real = addMiles(freshState(fixturePack.id, "2026-09-01T00:00:00.000Z"), 6, "2026-09-01", fixturePack);
    await saveState(real);
    setSeedDemo(true);

    render(<Trail pack={fixturePack} />);
    expect(await screen.findByTestId("odometer-value")).toHaveTextContent("6");
    // Only fx-1 is reached at 6 miles; the seed's 14 miles never applied.
    expect(screen.getByText(new RegExp(FX1_TEXT))).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(FX2_TEXT))).not.toBeInTheDocument();
  });
});
