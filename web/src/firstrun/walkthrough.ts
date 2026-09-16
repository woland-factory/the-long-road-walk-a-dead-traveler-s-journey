// The guided first run. The decision is pure and tested directly; the "done"
// flag is device-local (localStorage), kept out of the exported keepsake for
// the same reason as the EPIC 4 backup-reminder flags: it describes THIS
// device's first run, not the journey.

export type WalkthroughStep = "log" | "preview" | "finish" | null;

// Pure. `done` is the persisted flag; `hasMiles`/`hasEarned` come from state;
// `arrivalOpen` suppresses the callout under the ceremony; `previewSeen` is the
// in-session record that the walker acknowledged the preview step.
export function walkthroughStep(args: {
  done: boolean;
  hasMiles: boolean;
  hasEarned: boolean;
  arrivalOpen: boolean;
  previewSeen: boolean;
}): WalkthroughStep {
  if (args.done) return null;
  if (args.arrivalOpen) return null; // the ceremony is never overlaid
  if (!args.hasMiles) return "log";
  if (args.hasEarned) return "finish"; // the first log crossed a milepost
  if (!args.previewSeen) return "preview";
  return "finish";
}

const DONE_KEY = "the-long-road:walkthrough-done";

// localStorage can be absent or sealed (private mode); the walkthrough then
// simply shows again, which is harmless.
export function readWalkthroughDone(): boolean {
  try {
    return window.localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markWalkthroughDone(): void {
  try {
    window.localStorage.setItem(DONE_KEY, "1");
  } catch {
    // The flag is a convenience, never load-bearing.
  }
}
