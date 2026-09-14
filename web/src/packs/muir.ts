import type { JourneyPack } from "./types";
import data from "./muir.json";

// The real, verified Muir pack. muir.json is validated by validatePack.test.ts
// and its verbatim text is proven against the committed Gutenberg source by
// muir.verify.test.ts. Vite bundles the JSON at build, so no runtime fetch.
export const muirPack: JourneyPack = data as JourneyPack;
