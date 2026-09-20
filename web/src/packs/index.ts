import { muirPack } from "./muir";
import { lewisClarkPack } from "./lewisclark";
import type { JourneyPack } from "./types";

// The registry of shipped journey packs. The Start picker, the boot gate, and
// the restore path all read from here, so a new pack drops in by adding it to
// this array with no further wiring. Muir stays first so it remains the default
// the boot gate and SEED_DEMO fall back to.
export const journeyPacks: JourneyPack[] = [muirPack, lewisClarkPack];

export function packById(id: string): JourneyPack | undefined {
  return journeyPacks.find((p) => p.id === id);
}
