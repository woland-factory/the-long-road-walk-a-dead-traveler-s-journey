import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trail } from "./Trail";
import { muirPack } from "../packs/muir";
import { __resetDbForTests } from "../state/store";

// Withhold-then-reveal driven by the REAL Muir pack: the crossing auto-opens
// the Arrival (AC5.2), the framing note lives inside it (AC7.3), unreached
// mileposts have no row and no text (AC5.3), and SEED_DEMO seeds reached rows
// against the real pack (AC7.4).

const M1 = muirPack.mileposts[0]; // mile 6
const M2 = muirPack.mileposts[1]; // mile 30
const M1_TEXT = M1.voices[0].text.slice(0, 40);
const M2_TEXT = M2.voices[0].text.slice(0, 40);

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

describe("crossing a Muir milepost auto-opens the Arrival (AC5.2, AC5.3, AC7.3)", () => {
  it("reveals the verbatim entry only after its mile mark, and only in the Arrival", async () => {
    const user = userEvent.setup();
    render(<Trail pack={muirPack} />);
    await screen.findByText("Your road starts here");

    // Below the first milepost (mile 6): its text is absent and no row exists.
    await user.type(screen.getByLabelText("Miles walked today"), "3");
    await user.click(screen.getByRole("button", { name: "Log miles" }));
    await screen.findByTestId("odometer-value");
    expect(screen.queryByText(new RegExp(escapeRe(M1_TEXT)))).not.toBeInTheDocument();
    expect(screen.queryByTestId(`reached-row-${M1.id}`)).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Cross the first milepost: the Arrival opens with the verbatim line and framing.
    await user.type(screen.getByLabelText("Miles walked today"), "4");
    await user.click(screen.getByRole("button", { name: "Log miles" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(M1_TEXT);
    expect(dialog).toHaveTextContent("You are reading his exact words");

    // The second milepost (mile 30) stays withheld at 7 miles: no text, no row.
    expect(screen.queryByText(new RegExp(escapeRe(M2_TEXT)))).not.toBeInTheDocument();
    expect(screen.queryByTestId(`reached-row-${M2.id}`)).not.toBeInTheDocument();
  });
});

describe("SEED_DEMO with the real Muir pack (AC7.4)", () => {
  it("lands past the second milepost with two reached rows and the third withheld", async () => {
    setSeedDemo(true);
    render(<Trail pack={muirPack} />);

    // entry1 = 6 + 1 = 7, entry2 = 30 + 2 - 7 = 25, total 32.
    expect(await screen.findByTestId("odometer-value")).toHaveTextContent("32");
    expect(screen.getByTestId(`reached-row-${M1.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`reached-row-${M2.id}`)).toBeInTheDocument();

    // The third milepost (mile 54) is withheld: no row, no text.
    const M3 = muirPack.mileposts[2];
    expect(screen.queryByTestId(`reached-row-${M3.id}`)).not.toBeInTheDocument();
    const M3_TEXT = M3.voices[0].text.slice(0, 40);
    expect(screen.queryByText(new RegExp(escapeRe(M3_TEXT)))).not.toBeInTheDocument();
  });
});

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
