import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Start } from "./Start";
import { fixturePack } from "../packs/fixturePack";
import { muirPack } from "../packs/muir";
import { freshState, addMiles } from "../state/odometer";
import { serializeBackup } from "../state/backup";
import type { WalkerState } from "../state/types";

function walkerAt(miles: number): WalkerState {
  return addMiles(freshState(fixturePack.id, "2026-09-01T00:00:00.000Z"), miles, "2026-09-01", fixturePack);
}

function backupFile(state: WalkerState): File {
  return new File([serializeBackup(state, "2026-09-10T12:00:00.000Z")], "backup.json", {
    type: "application/json",
  });
}

describe("Start framing (AC2.4)", () => {
  it("states the product and the once-a-day ritual before any commitment", () => {
    render(<Start packs={[fixturePack]} onBegin={() => {}} onRestore={() => {}} />);
    expect(screen.getByRole("heading", { level: 1, name: "The Long Road" })).toBeInTheDocument();
    expect(screen.getByText(/log them here once a day/i)).toBeInTheDocument();
    expect(screen.getByText(/about ten seconds/i)).toBeInTheDocument();
  });
});

describe("the journey picker (AC2.5)", () => {
  it("shows a card per pack with title, years-and-scale, and the companion line", () => {
    render(<Start packs={[fixturePack]} onBegin={() => {}} onRestore={() => {}} />);
    expect(screen.getByRole("heading", { name: "Fixture trail" })).toBeInTheDocument();
    expect(screen.getByText("2026. About 20 miles.")).toBeInTheDocument();
    expect(screen.getByText(fixturePack.companion)).toBeInTheDocument();
  });

  it("gives each pack's Begin button a distinct accessible name (AC7.1)", () => {
    render(<Start packs={[fixturePack, muirPack]} onBegin={() => {}} onRestore={() => {}} />);
    expect(
      screen.getByRole("button", { name: `Begin ${fixturePack.title}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Begin ${muirPack.title}` })).toBeInTheDocument();
    // Two cards, two individually targetable primary actions.
    expect(screen.getAllByRole("button", { name: /^Begin / })).toHaveLength(2);
  });

  it("begins the chosen journey and shows a pressed state", async () => {
    const user = userEvent.setup();
    const onBegin = vi.fn();
    render(<Start packs={[fixturePack]} onBegin={onBegin} onRestore={() => {}} />);

    // Each Begin button carries a journey-specific accessible name (AC7.1),
    // so a screen reader and the e2e selectors can tell two cards apart.
    const button = screen.getByRole("button", { name: `Begin ${fixturePack.title}` });
    await user.click(button);
    expect(onBegin).toHaveBeenCalledWith(fixturePack.id);
    expect(button).toHaveClass("is-pressed");
  });
});

describe("Start restore (AC2.7)", () => {
  it("restores a valid backup by calling onRestore with the parsed state", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const incoming = walkerAt(6);
    render(<Start packs={[fixturePack]} onBegin={() => {}} onRestore={onRestore} />);

    await user.upload(screen.getByLabelText("Restore from a backup"), backupFile(incoming));
    await vi.waitFor(() => expect(onRestore).toHaveBeenCalledWith(incoming));
  });

  it("shows the designed error for an invalid file and changes nothing", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(<Start packs={[fixturePack]} onBegin={() => {}} onRestore={onRestore} />);

    const bad = new File(["{ not json"], "bad.json", { type: "application/json" });
    await user.upload(screen.getByLabelText("Restore from a backup"), bad);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose the .json backup this app saved.",
    );
    expect(onRestore).not.toHaveBeenCalled();
  });
});
