import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Backup } from "./Backup";
import { fixturePack } from "../packs/fixturePack";
import { freshState, addMiles } from "../state/odometer";
import { serializeBackup } from "../state/backup";
import { readReminderFlags } from "./reminder";
import type { WalkerState } from "../state/types";

function walkerAt(miles: number): WalkerState {
  return addMiles(freshState(fixturePack.id, "2026-09-01T00:00:00.000Z"), miles, "2026-09-01", fixturePack);
}

function backupFile(state: WalkerState, name = "the-long-road-backup.json"): File {
  return new File([serializeBackup(state, "2026-09-10T12:00:00.000Z")], name, {
    type: "application/json",
  });
}

// jsdom's Blob has no .text(); FileReader reads it the portable way.
function blobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Save a backup (AC4.3)", () => {
  it("downloads the serialized state as a .json file and confirms", async () => {
    const user = userEvent.setup();
    const state = walkerAt(6);
    let captured: Blob | null = null;
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn((blob: Blob) => {
        captured = blob;
        return "blob:test";
      }),
      revokeObjectURL: vi.fn(),
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<Backup state={state} onRestore={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Save a backup" }));

    expect(click).toHaveBeenCalledTimes(1);
    expect(captured).not.toBeNull();
    const text = await blobText(captured as unknown as Blob);
    const parsed = JSON.parse(text);
    expect(parsed.state).toEqual(state);
    expect(screen.getByText(/Saved\./)).toBeInTheDocument();
    // The reminder is satisfied for good on this device.
    expect(readReminderFlags().exported).toBe(true);
    vi.unstubAllGlobals();
  });

  it("names the file after the app and pack with a .json ending", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });
    let downloadName = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.download;
    });

    render(<Backup state={walkerAt(6)} onRestore={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Save a backup" }));

    expect(downloadName).toBe("the-long-road-fixture-demo-backup.json");
    vi.unstubAllGlobals();
  });
});

describe("Restore from a backup (AC5.4)", () => {
  it("asks for confirmation when the device already has logged miles", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const incoming = walkerAt(13);
    render(<Backup state={walkerAt(2)} onRestore={onRestore} />);

    await user.upload(screen.getByLabelText("Restore from a backup"), backupFile(incoming));

    expect(
      await screen.findByText("This backup replaces the journal on this device."),
    ).toBeInTheDocument();
    expect(onRestore).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Restore the backup" }));
    expect(onRestore).toHaveBeenCalledWith(incoming);
    expect(screen.getByText("Your journal is restored.")).toBeInTheDocument();
  });

  it("keeps the current journal when the walker declines", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(<Backup state={walkerAt(2)} onRestore={onRestore} />);

    await user.upload(screen.getByLabelText("Restore from a backup"), backupFile(walkerAt(13)));
    await user.click(await screen.findByRole("button", { name: "Keep the current journal" }));

    expect(onRestore).not.toHaveBeenCalled();
    expect(
      screen.queryByText("This backup replaces the journal on this device."),
    ).not.toBeInTheDocument();
  });

  it("restores without a prompt on a fresh device", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const incoming = walkerAt(13);
    render(<Backup state={null} onRestore={onRestore} />);

    await user.upload(screen.getByLabelText("Restore from a backup"), backupFile(incoming));

    expect(await screen.findByText("Your journal is restored.")).toBeInTheDocument();
    expect(onRestore).toHaveBeenCalledWith(incoming);
    expect(
      screen.queryByText("This backup replaces the journal on this device."),
    ).not.toBeInTheDocument();
  });

  it("shows the designed error for an invalid file and changes no state", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(<Backup state={walkerAt(2)} onRestore={onRestore} />);

    const bad = new File(["{ not json"], "bad.json", { type: "application/json" });
    await user.upload(screen.getByLabelText("Restore from a backup"), bad);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose the .json backup this app saved.",
    );
    expect(onRestore).not.toHaveBeenCalled();
  });
});

describe("the gentle reminder (AC6.2)", () => {
  it("appears only once an entry is earned", () => {
    const { rerender } = render(<Backup state={null} onRestore={() => {}} />);
    expect(
      screen.queryByText("Keep a backup so your journal travels with you."),
    ).not.toBeInTheDocument();

    // Miles logged but nothing earned: still quiet.
    rerender(<Backup state={walkerAt(2)} onRestore={() => {}} />);
    expect(
      screen.queryByText("Keep a backup so your journal travels with you."),
    ).not.toBeInTheDocument();

    rerender(<Backup state={walkerAt(6)} onRestore={() => {}} />);
    expect(
      screen.getByText("Keep a backup so your journal travels with you."),
    ).toBeInTheDocument();
  });

  it("dismiss hides it permanently", async () => {
    const user = userEvent.setup();
    const { rerender, unmount } = render(<Backup state={walkerAt(6)} onRestore={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(
      screen.queryByText("Keep a backup so your journal travels with you."),
    ).not.toBeInTheDocument();
    expect(readReminderFlags().dismissed).toBe(true);

    // Still hidden on re-render and on a fresh mount.
    rerender(<Backup state={walkerAt(6)} onRestore={() => {}} />);
    expect(
      screen.queryByText("Keep a backup so your journal travels with you."),
    ).not.toBeInTheDocument();
    unmount();
    render(<Backup state={walkerAt(6)} onRestore={() => {}} />);
    expect(
      screen.queryByText("Keep a backup so your journal travels with you."),
    ).not.toBeInTheDocument();
  });

  it("saving a backup hides it permanently", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<Backup state={walkerAt(6)} onRestore={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Save a backup" }));
    expect(
      screen.queryByText("Keep a backup so your journal travels with you."),
    ).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
