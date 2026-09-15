import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Journal } from "./Journal";
import { fixturePack } from "../packs/fixturePack";
import { muirPack } from "../packs/muir";
import { freshState, addMiles } from "../state/odometer";
import { upsertFacingLine } from "../state/personalLog";
import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "../state/types";

const FX1_TEXT = fixturePack.mileposts[0].voices[0].text;
const FX2_TEXT = fixturePack.mileposts[1].voices[0].text;

function walkerAt(miles: number, pack: JourneyPack = fixturePack): WalkerState {
  return addMiles(freshState(pack.id, "2026-09-01T00:00:00.000Z"), miles, "2026-09-01", pack);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a spread renders both sides (AC2.1, AC2.6)", () => {
  it("shows place, datelines, attributed verbatim text, approxNote, and the facing line", () => {
    let state = walkerAt(6);
    state = upsertFacingLine(state, "fx-1", "Cold river, warm sun.", "2026-09-01");
    render(<Journal pack={fixturePack} state={state} onClose={() => {}} />);

    expect(screen.getByRole("heading", { name: "The first ford" })).toBeInTheDocument();
    expect(screen.getByText("January 1, 2026")).toBeInTheDocument(); // traveler dateline
    expect(screen.getByText(FX1_TEXT)).toBeInTheDocument();
    expect(screen.getByText("Sample traveler")).toBeInTheDocument(); // attribution
    expect(screen.getByText("near this ground")).toBeInTheDocument();
    expect(screen.getByText("You reached this on September 1, 2026.")).toBeInTheDocument();
    expect(screen.getByText("Cold river, warm sun.")).toBeInTheDocument();
  });

  it("shows the quiet prompt when the facing line is empty", () => {
    render(<Journal pack={fixturePack} state={walkerAt(6)} onClose={() => {}} />);
    expect(
      screen.getByText("Add your line for this milepost from the Trail."),
    ).toBeInTheDocument();
  });
});

describe("front matter (AC2.2)", () => {
  it("renders title, traveler, the factual scale line, and the framing note once", () => {
    const state = walkerAt(13); // 13 miles, fx-1 and fx-2 earned
    render(<Journal pack={fixturePack} state={state} onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: "Fixture trail" })).toBeInTheDocument();
    expect(screen.getByText(/A double journal with Sample traveler/)).toBeInTheDocument();
    expect(screen.getByText("13 miles walked. 2 entries earned.")).toBeInTheDocument();
    expect(screen.getAllByText(fixturePack.framingNote)).toHaveLength(1);
  });
});

describe("withhold guard (AC2.3, AC3.3)", () => {
  it("renders no spread and no verbatim text for an unreached fixture milepost", () => {
    render(<Journal pack={fixturePack} state={walkerAt(6)} onClose={() => {}} />);
    expect(screen.getByText(FX1_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(FX2_TEXT)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "The ridge camp" })).not.toBeInTheDocument();
  });

  it("keeps every unreached Muir entry out of the journal DOM", () => {
    const state = walkerAt(6, muirPack); // only the first Muir milepost (mile 6)
    const { container } = render(<Journal pack={muirPack} state={state} onClose={() => {}} />);
    const dom = container.textContent ?? "";
    expect(dom.includes(muirPack.mileposts[0].voices[0].text)).toBe(true);
    for (const milepost of muirPack.mileposts.slice(1)) {
      for (const voice of milepost.voices) {
        expect(dom.includes(voice.text)).toBe(false);
      }
    }
  });
});

describe("designed empty state (AC2.4)", () => {
  it("explains the journal and the first step, with a way back", () => {
    const state = freshState(fixturePack.id, "2026-09-01T00:00:00.000Z");
    render(<Journal pack={fixturePack} state={state} onClose={() => {}} />);
    expect(screen.getByText(/Your journal fills as you walk/)).toBeInTheDocument();
    expect(screen.getByText(/Log your first miles to earn the first page/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to the trail" })).toBeInTheDocument();
    // Nothing to print on an empty journal.
    expect(screen.queryByRole("button", { name: "Print your journal" })).not.toBeInTheDocument();
  });
});

describe("accessibility and navigation (AC2.5)", () => {
  it("labels the view by its heading and moves focus to it on open", () => {
    render(<Journal pack={fixturePack} state={walkerAt(6)} onClose={() => {}} />);
    const heading = screen.getByRole("heading", { name: "Fixture trail" });
    expect(heading).toHaveFocus();
    const region = document.querySelector("section.journal");
    expect(region?.getAttribute("aria-labelledby")).toBe(heading.id);
  });

  it("gives every spread its own heading", () => {
    render(<Journal pack={fixturePack} state={walkerAt(13)} onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: "The first ford" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The ridge camp" })).toBeInTheDocument();
  });

  it("returns to the Trail on Escape and on the close control", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Journal pack={fixturePack} state={walkerAt(6)} onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Back to the trail" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("the print path (AC3.1, AC3.2)", () => {
  it("Print your journal calls window.print()", async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<Journal pack={fixturePack} state={walkerAt(6)} onClose={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Print your journal" }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("the interactive chrome carries .no-print", () => {
    render(<Journal pack={fixturePack} state={walkerAt(6)} onClose={() => {}} />);
    const back = screen.getByRole("button", { name: "Back to the trail" });
    const print = screen.getByRole("button", { name: "Print your journal" });
    expect(back.closest(".no-print")).not.toBeNull();
    expect(print.closest(".no-print")).not.toBeNull();
  });

  it("the stylesheet holds the print rules", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/app.css"), "utf8");
    expect(css.includes("@media print")).toBe(true);
    expect(css.includes("@page")).toBe(true);
    expect(css).toMatch(/\.no-print\s*\{\s*display:\s*none/);
    expect(css.includes("break-inside: avoid")).toBe(true);
    expect(css.includes("break-after: page")).toBe(true);
  });
});
