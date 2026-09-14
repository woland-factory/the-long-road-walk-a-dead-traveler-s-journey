import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trail } from "./Trail";
import { muirPack } from "../packs/muir";
import { __resetDbForTests } from "../state/store";

// Withhold-then-reveal driven by the REAL Muir pack (AC5.2), the SEED_DEMO
// demo against the real pack (AC5.3), and the framing note surface (AC6.2).

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

describe("withhold then reveal with the real Muir pack (AC5.2)", () => {
  it("reveals a milepost's verbatim words only after its mile mark is crossed", async () => {
    const user = userEvent.setup();
    render(<Trail pack={muirPack} />);
    await screen.findByText("Your road starts here");

    // Below the first milepost (mile 6): its text is absent.
    await user.type(screen.getByLabelText("Miles walked today"), "3");
    await user.click(screen.getByRole("button", { name: "Log miles" }));
    await screen.findByTestId("odometer-value");
    expect(screen.queryByText(new RegExp(escapeRe(M1_TEXT)))).not.toBeInTheDocument();

    // Cross the first milepost: its verbatim line is revealed.
    await user.type(screen.getByLabelText("Miles walked today"), "4");
    await user.click(screen.getByRole("button", { name: "Log miles" }));
    expect(await screen.findByText(new RegExp(escapeRe(M1_TEXT)))).toBeInTheDocument();

    // The second milepost (mile 30) is still withheld at 7 miles.
    expect(screen.queryByText(new RegExp(escapeRe(M2_TEXT)))).not.toBeInTheDocument();
  });

  it("shows the framing note once real entries are readable (AC6.2)", async () => {
    const user = userEvent.setup();
    render(<Trail pack={muirPack} />);
    await screen.findByText("Your road starts here");

    await user.type(screen.getByLabelText("Miles walked today"), "7");
    await user.click(screen.getByRole("button", { name: "Log miles" }));
    await screen.findByText(new RegExp(escapeRe(M1_TEXT)));

    expect(screen.getByText(/You are reading his exact words/)).toBeInTheDocument();
  });
});

describe("SEED_DEMO with the real Muir pack (AC5.3)", () => {
  it("lands past the second milepost with two entries revealed and the third withheld", async () => {
    setSeedDemo(true);
    render(<Trail pack={muirPack} />);

    // entry1 = 6 + 1 = 7, entry2 = 30 + 2 - 7 = 25, total 32.
    expect(await screen.findByTestId("odometer-value")).toHaveTextContent("32");
    expect(screen.getByText(new RegExp(escapeRe(M1_TEXT)))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(escapeRe(M2_TEXT)))).toBeInTheDocument();

    // The third milepost (mile 54) is still withheld at 32 miles.
    const M3_TEXT = muirPack.mileposts[2].voices[0].text.slice(0, 40);
    expect(screen.queryByText(new RegExp(escapeRe(M3_TEXT)))).not.toBeInTheDocument();
  });
});

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
