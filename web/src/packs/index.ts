import { muirPack } from "./muir";
import type { JourneyPack } from "./types";

// The registry of shipped journey packs. The Start picker, the boot gate, and
// the restore path all read from here, so a new pack (EPIC 6's Lewis & Clark)
// drops in by adding it to this array with no further wiring.
export const journeyPacks: JourneyPack[] = [muirPack];

export function packById(id: string): JourneyPack | undefined {
  return journeyPacks.find((p) => p.id === id);
}
