import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Arrival } from "./Arrival";
import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "../state/types";
import { freshState } from "../state/odometer";
import { upsertFacingLine } from "../state/personalLog";

// A small multi-voice test pack. Muir is single-voice, so the multi-voice path
// is proven here without touching the real pack.
const twoVoicePack: JourneyPack = {
  id: "test-two-voice",
  title: "Two voice trail",
  traveler: "Two travelers",
  years: "1804",
  totalMiles: 100,
  source: { name: "Test", author: "Test", gutenbergId: 0, url: "https://example.com", license: "Test" },
  framingNote: "A framing note that puts the period words in context.",
  mileposts: [
    {
      id: "tv-1",
      mileMark: 10,
      date: "1804-05-14",
      place: "The river landing",
      approxNote: "near this ground by the water",
      approach: "The road runs down to the river landing.",
      voices: [
        { author: "Meriwether Lewis", text: "The morning was fair and we set out early along the wide river." },
        { author: "William Clark", text: "Rain in the afternoon. The men are in good spirits despite the mud." },
      ],
    },
    {
      id: "tv-2",
      mileMark: 20,
      date: "1804-05-20",
      place: "The bluff camp",
      approxNote: "near this ground on the bluff",
      approach: "Ahead the trail climbs to the bluff camp.",
      voices: [{ author: "Meriwether Lewis", text: "We camped on a high bluff with a fine view of the plains beyond." }],
    },
  ],
};

function stateReaching(ids: string[]): WalkerState {
  const s = freshState(twoVoicePack.id, "2026-09-01T00:00:00.000Z");
  return { ...s, reachedMilepostIds: ids };
}

describe("Arrival reading surface (AC4.1, AC4.2)", () => {
  it("renders the place, dateline, every voice with its author, approxNote, and framing", () => {
    render(
      <Arrival
        pack={twoVoicePack}
        state={stateReaching(["tv-1"])}
        queue={["tv-1"]}
        onSaveFacingLine={() => {}}
        onClose={() => {}}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "The river landing" })).toBeInTheDocument();
    expect(within(dialog).getByText("May 14, 1804")).toBeInTheDocument();
    // Both voices render, attributed, neither dropped nor merged.
    expect(within(dialog).getByText(/The morning was fair/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Rain in the afternoon/)).toBeInTheDocument();
    expect(within(dialog).getByText("Meriwether Lewis")).toBeInTheDocument();
    expect(within(dialog).getByText("William Clark")).toBeInTheDocument();
    expect(within(dialog).getByText(/near this ground by the water/)).toBeInTheDocument();
    expect(within(dialog).getByText(/puts the period words in context/)).toBeInTheDocument();
  });

  it("renders each voice as its own separated passage (AC4.2)", () => {
    render(
      <Arrival
        pack={twoVoicePack}
        state={stateReaching(["tv-1"])}
        queue={["tv-1"]}
        onSaveFacingLine={() => {}}
        onClose={() => {}}
      />,
    );
    const quotes = screen.getByRole("dialog").querySelectorAll("blockquote");
    expect(quotes.length).toBe(2);
  });
});

describe("Arrival facing line (AC4.3)", () => {
  it("prefills from personalLog and saves the typed line", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const state = upsertFacingLine(stateReaching(["tv-1"]), "tv-1", "Saved earlier.", "2026-09-01");
    render(
      <Arrival
        pack={twoVoicePack}
        state={state}
        queue={["tv-1"]}
        onSaveFacingLine={onSave}
        onClose={() => {}}
      />,
    );
    const field = screen.getByLabelText("Your line for this milepost");
    expect(field).toHaveValue("Saved earlier.");
    await user.clear(field);
    await user.type(field, "A fresh line.");
    await user.tab(); // blur saves
    expect(onSave).toHaveBeenCalledWith("tv-1", "A fresh line.");
  });

  it("shows the saved line when the same milepost re-opens", () => {
    const state = upsertFacingLine(stateReaching(["tv-1"]), "tv-1", "My earned line.", "2026-09-01");
    render(
      <Arrival
        pack={twoVoicePack}
        state={state}
        queue={["tv-1"]}
        onSaveFacingLine={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByLabelText("Your line for this milepost")).toHaveValue("My earned line.");
  });
});

describe("Arrival accessibility and controls (AC4.4)", () => {
  it("is a labelled modal dialog with focus moved in and Escape closing", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Arrival
        pack={twoVoicePack}
        state={stateReaching(["tv-1"])}
        queue={["tv-1"]}
        onSaveFacingLine={() => {}}
        onClose={onClose}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("The river landing");
    expect(dialog).toHaveFocus();

    // A single primary action, with a subordinate close control present.
    expect(screen.getByRole("button", { name: "Back to the trail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Arrival multi-milepost queue (AC4.5)", () => {
  it("advances in order, saving each line, then closes on the last", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <Arrival
        pack={twoVoicePack}
        state={stateReaching(["tv-1", "tv-2"])}
        queue={["tv-1", "tv-2"]}
        onSaveFacingLine={onSave}
        onClose={onClose}
      />,
    );
    // First entry, primary action reads "Next entry".
    expect(screen.getByRole("heading", { name: "The river landing" })).toBeInTheDocument();
    const advance = screen.getByRole("button", { name: "Next entry" });
    await user.click(advance);
    expect(onSave).toHaveBeenCalledWith("tv-1", "");

    // Second (last) entry, primary action reads "Back to the trail".
    expect(screen.getByRole("heading", { name: "The bluff camp" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to the trail" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Arrival withhold guard (AC5.1)", () => {
  it("renders nothing and closes when the queued id is not reached", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Arrival
        pack={twoVoicePack}
        state={stateReaching([])} // nothing reached
        queue={["tv-1"]}
        onSaveFacingLine={() => {}}
        onClose={onClose}
      />,
    );
    // The unreached milepost's voice text is absent from the DOM.
    expect(screen.queryByText(/The morning was fair/)).not.toBeInTheDocument();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(onClose).toHaveBeenCalled();
  });

  it("drops an unreached id from a mixed queue and never mounts its voices", () => {
    render(
      <Arrival
        pack={twoVoicePack}
        state={stateReaching(["tv-1"])} // tv-2 not reached
        queue={["tv-1", "tv-2"]}
        onSaveFacingLine={() => {}}
        onClose={() => {}}
      />,
    );
    // Only tv-1 is presentable; tv-2's verbatim text must be absent.
    expect(screen.getByText(/The morning was fair/)).toBeInTheDocument();
    expect(screen.queryByText(/high bluff with a fine view/)).not.toBeInTheDocument();
    // And the last step is reached immediately since only one id survives.
    expect(screen.getByRole("button", { name: "Back to the trail" })).toBeInTheDocument();
  });
});
