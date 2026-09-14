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
    expect(screen.getByLabelText("Loading your trail")).toBeInTheDocument();
  });
});

describe("empty state (AC6.1)", () => {
  it("shows positive directive copy for a fresh visitor with SEED_DEMO off", async () => {
    render(<Trail pack={fixturePack} />);
    expect(await screen.findByText("Your road starts here")).toBeInTheDocument();
    expect(screen.getByText(/Log your first miles to begin/)).toBeInTheDocument();
  });
});

describe("withhold then reveal through the Arrival (AC5.2, AC7.4)", () => {
  it("keeps a milepost's text out of the DOM until crossed, then opens the Arrival", async () => {
    const user = userEvent.setup();
    render(<Trail pack={fixturePack} />);
    await screen.findByText("Your road starts here");

    // Below fx-1 (mile 5): no Arrival, no verbatim text.
    await user.type(screen.getByLabelText("Miles walked today"), "4");
    await user.click(screen.getByRole("button", { name: "Log miles" }));
    await screen.findByTestId("odometer-value");
    expect(screen.queryByText(new RegExp(FX1_TEXT))).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Cross fx-1: the Arrival opens automatically with the verbatim entry.
    await user.type(screen.getByLabelText("Miles walked today"), "2");
    await user.click(screen.getByRole("button", { name: "Log miles" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(FX1_TEXT);
    // fx-2 (mile 12) is still withheld at 6 miles.
    expect(screen.queryByText(new RegExp(FX2_TEXT))).not.toBeInTheDocument();

    // Close returns to the Trail; the verbatim text leaves the DOM.
    await user.click(screen.getByRole("button", { name: "Back to the trail" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(FX1_TEXT))).not.toBeInTheDocument();
    // The reached row is present to re-open it.
    expect(screen.getByTestId("reached-row-fx-1")).toBeInTheDocument();
  });
});

describe("re-open a reached row (AC7.1)", () => {
  it("tapping a reached row re-opens the Arrival with the verbatim entry", async () => {
    const user = userEvent.setup();
    const real = addMiles(freshState(fixturePack.id, "2026-09-01T00:00:00.000Z"), 6, "2026-09-01", fixturePack);
    await saveState(real);

    render(<Trail pack={fixturePack} />);
    // On load there is no auto-open (no fresh crossing): just the reached row.
    const row = await screen.findByTestId("reached-row-fx-1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(FX1_TEXT))).not.toBeInTheDocument();

    await user.click(row);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(FX1_TEXT);
  });
});

describe("SEED_DEMO seeding (AC7.4)", () => {
  it("shows two reached rows on first load, verbatim only after opening", async () => {
    setSeedDemo(true);
    const user = userEvent.setup();
    render(<Trail pack={fixturePack} />);
    expect(await screen.findByTestId("odometer-value")).toHaveTextContent("14");

    // Rows for fx-1 and fx-2 are present; fx-3 (mile 20) is withheld.
    expect(screen.getByTestId("reached-row-fx-1")).toBeInTheDocument();
    expect(screen.getByTestId("reached-row-fx-2")).toBeInTheDocument();
    expect(screen.queryByTestId("reached-row-fx-3")).not.toBeInTheDocument();

    // No verbatim text on the Trail until a row is opened.
    expect(screen.queryByText(new RegExp(FX1_TEXT))).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(FX3_TEXT))).not.toBeInTheDocument();

    await user.click(screen.getByTestId("reached-row-fx-2"));
    expect(await screen.findByRole("dialog")).toHaveTextContent(FX2_TEXT);
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
    expect(screen.getByTestId("reached-row-fx-1")).toBeInTheDocument();
    expect(screen.queryByTestId("reached-row-fx-2")).not.toBeInTheDocument();
  });
});
