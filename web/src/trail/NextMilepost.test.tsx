import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextMilepost } from "./NextMilepost";
import { fixturePack } from "../packs/fixturePack";
import { freshState, addMiles } from "../state/odometer";

// fixturePack mileposts: fx-1 mile 5, fx-2 mile 12, fx-3 mile 20.

describe("NextMilepost non-unlock day (AC6.1)", () => {
  it("before any milepost: start line, distance to the first, and its approach", () => {
    const state = addMiles(freshState(fixturePack.id, "2026-09-01T00:00:00.000Z"), 3, "2026-09-01", fixturePack);
    render(<NextMilepost state={state} pack={fixturePack} />);
    expect(screen.getByText("You are at the start of the road.")).toBeInTheDocument();
    expect(screen.getByText(/miles to The first ford/)).toBeInTheDocument();
    expect(screen.getByText("The road runs down to the first river ford.")).toBeInTheDocument();
  });

  it("after a milepost: names the last reached place and the next approach", () => {
    // 8 miles: past fx-1 (mile 5), short of fx-2 (mile 12).
    const state = addMiles(freshState(fixturePack.id, "2026-09-01T00:00:00.000Z"), 8, "2026-09-01", fixturePack);
    render(<NextMilepost state={state} pack={fixturePack} />);
    expect(screen.getByText("You last reached The first ford.")).toBeInTheDocument();
    expect(screen.getByText(/miles to The ridge camp/)).toBeInTheDocument();
    expect(screen.getByText("Ahead the trail climbs to the ridge camp.")).toBeInTheDocument();
  });
});

describe("NextMilepost never spoils the coming entry (AC6.2)", () => {
  it("shows the approach but never the next milepost's verbatim text", () => {
    const state = addMiles(freshState(fixturePack.id, "2026-09-01T00:00:00.000Z"), 8, "2026-09-01", fixturePack);
    render(<NextMilepost state={state} pack={fixturePack} />);
    const nextText = fixturePack.mileposts[1].voices[0].text; // "We rested on the ridge..."
    expect(screen.queryByText(new RegExp(nextText.slice(0, 20)))).not.toBeInTheDocument();
    expect(screen.getByText(fixturePack.mileposts[1].approach)).toBeInTheDocument();
  });
});

describe("NextMilepost completion (AC6.3)", () => {
  it("shows the completion note and no distance or approach once all are reached", () => {
    const state = addMiles(freshState(fixturePack.id, "2026-09-01T00:00:00.000Z"), 20, "2026-09-01", fixturePack);
    render(<NextMilepost state={state} pack={fixturePack} />);
    expect(screen.getByText(/You reached every milepost/)).toBeInTheDocument();
    expect(screen.queryByText(/miles to/)).not.toBeInTheDocument();
    for (const m of fixturePack.mileposts) {
      expect(screen.queryByText(m.approach)).not.toBeInTheDocument();
    }
  });
});
