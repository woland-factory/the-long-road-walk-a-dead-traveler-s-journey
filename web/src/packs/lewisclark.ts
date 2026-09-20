import type { JourneyPack } from "./types";
import data from "./lewisclark.json";

// The Lewis & Clark pack: the first chapter of the expedition, St. Louis up the
// Missouri to Fort Mandan in 1804. lewisclark.json is validated by
// validatePack.test.ts and its verbatim text is proven against the committed
// Project Gutenberg #8419 source by lewisclark.verify.test.ts. Several mileposts
// carry more than one keeper's voice. Vite bundles the JSON at build, so no
// runtime fetch.
export const lewisClarkPack: JourneyPack = data as JourneyPack;
