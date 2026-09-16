import type { JourneyPack } from "./types";

// Placeholder pack used only to exercise the check-in loop in unit tests.
// The running app ships the real Muir pack (see muir.ts). This fixture keeps
// the EPIC 1 tests fast and self-contained with invented, obviously-sample text.
export const fixturePack: JourneyPack = {
  id: "fixture-demo",
  title: "Fixture trail",
  traveler: "Sample traveler",
  years: "2026",
  totalMiles: 20,
  source: {
    name: "Fixture source",
    author: "Sample traveler",
    gutenbergId: 0,
    url: "https://example.com/fixture",
    license: "Sample data (not a real source)",
  },
  framingNote: "A sample trail used to check the loop. It carries no real diary.",
  companion: "A sample companion line for the fixture trail.",
  mileposts: [
    {
      id: "fx-1",
      mileMark: 5,
      date: "2026-01-01",
      place: "The first ford",
      approxNote: "near this ground",
      approach: "The road runs down to the first river ford.",
      voices: [{ author: "Sample traveler", text: "We crossed the river at dawn. The water ran cold and clear." }],
    },
    {
      id: "fx-2",
      mileMark: 12,
      date: "2026-01-02",
      place: "The ridge camp",
      approxNote: "near this ground",
      approach: "Ahead the trail climbs to the ridge camp.",
      voices: [{ author: "Sample traveler", text: "We rested on the ridge and watched the valley fill with light." }],
    },
    {
      id: "fx-3",
      mileMark: 20,
      date: "2026-01-03",
      place: "The far meadow",
      approxNote: "near this ground",
      approach: "The way carries on to the far meadow.",
      voices: [{ author: "Sample traveler", text: "We reached the meadow by evening and made our fire." }],
    },
  ],
};
