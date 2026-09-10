import type { JourneyPack } from "./types";

// Placeholder pack used only to exercise the check-in loop end to end.
// EPIC 2 replaces this with the real Muir pack loaded through the same types.
export const fixturePack: JourneyPack = {
  id: "fixture-demo",
  title: "Fixture trail",
  traveler: "Sample traveler",
  totalMiles: 20,
  mileposts: [
    {
      id: "fx-1",
      mileMark: 5,
      place: "The first ford",
      approxNote: "near this ground",
      text: "We crossed the river at dawn. The water ran cold and clear.",
    },
    {
      id: "fx-2",
      mileMark: 12,
      place: "The ridge camp",
      approxNote: "near this ground",
      text: "We rested on the ridge and watched the valley fill with light.",
    },
    {
      id: "fx-3",
      mileMark: 20,
      place: "The far meadow",
      approxNote: "near this ground",
      text: "We reached the meadow by evening and made our fire.",
    },
  ],
};
