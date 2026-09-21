import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trail } from "./Trail";
import { muirPack } from "../packs/muir";
import { __resetDbForTests } from "../state/store";

// AC2.3: interaction feedback under 100ms. logMiles updates state synchronously
// (optimistic) before the async IndexedDB write resolves, so the odometer and a
// crossing Arrival appear in the same tick as submit. These assertions use
// getBy* (synchronous) right after the click settles: if the UI waited on I/O,
// the odometer would still show the empty state and getBy* would throw.

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  __resetDbForTests();
  window.__ENV__ = { SEED_DEMO: "false", SENTRY_DSN: "", UMAMI_URL: "", UMAMI_WEBSITE_ID: "" };
});

describe("the check-in is optimistic (AC2.3)", () => {
  it("advances the odometer in the same tick as submit, before persistence", async () => {
    const user = userEvent.setup();
    render(<Trail pack={muirPack} />);
    await screen.findByText("Your road starts here");

    // A sub-milepost value (first Muir milepost is mile 6): no ceremony, just
    // the odometer. It reads the new total synchronously, not after an await.
    await user.type(screen.getByLabelText("Miles walked today"), "2");
    await user.click(screen.getByRole("button", { name: "Log miles" }));
    expect(screen.getByTestId("odometer-value")).toHaveTextContent("2");
  });

  it("opens the Arrival immediately when a check-in crosses a milepost", async () => {
    const user = userEvent.setup();
    render(<Trail pack={muirPack} />);
    await screen.findByText("Your road starts here");

    await user.type(screen.getByLabelText("Miles walked today"), "6");
    await user.click(screen.getByRole("button", { name: "Log miles" }));
    // The dialog is present synchronously with the crossing, no I/O await.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("odometer-value")).toHaveTextContent("6");
  });
});

describe("the updated total is announced to screen readers (AC4.5)", () => {
  it("puts the odometer inside a polite live region, so a non-crossing check-in is not silent", async () => {
    const user = userEvent.setup();
    render(<Trail pack={muirPack} />);
    await screen.findByText("Your road starts here");

    // A check-in that crosses no milepost updates only the odometer total.
    await user.type(screen.getByLabelText("Miles walked today"), "2");
    await user.click(screen.getByRole("button", { name: "Log miles" }));

    const region = screen.getByTestId("odometer-value").closest("[aria-live]");
    expect(region).not.toBeNull();
    expect(region).toHaveAttribute("aria-live", "polite");
  });
});
