import { useCallback, useEffect, useState } from "react";
import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "./types";
import { addMiles, freshState, recompute } from "./odometer";
import { loadState, saveState } from "./store";
import { buildSeededState } from "./seed";
import { env } from "../env";
import { reportError } from "../observability/sentry";
import { todayISO } from "../trail/validate";

export type WalkerStatus = "loading" | "ready" | "error";

export interface UseWalker {
  status: WalkerStatus;
  state: WalkerState | null; // null means no miles logged yet (empty trail)
  logMiles: (miles: number) => void;
}

// Loads walker state from IndexedDB, applies SEED_DEMO seeding on a fresh
// database, and exposes an optimistic logMiles that updates the UI before the
// async persist completes.
export function useWalker(pack: JourneyPack): UseWalker {
  const [status, setStatus] = useState<WalkerStatus>("loading");
  const [state, setState] = useState<WalkerState | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadState();
        if (cancelled) return;
        if (loaded) {
          // Recompute derived fields so they can never drift from the log.
          setState(recompute(loaded, pack));
          setStatus("ready");
          return;
        }
        if (env.seedDemo) {
          const seeded = buildSeededState(pack);
          await saveState(seeded);
          if (cancelled) return;
          setState(seeded);
          setStatus("ready");
          return;
        }
        setState(null);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        reportError(err);
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pack]);

  const logMiles = useCallback(
    (miles: number) => {
      setState((prev) => {
        const base = prev ?? freshState(pack.id, new Date().toISOString());
        const next = addMiles(base, miles, todayISO(), pack);
        // Persist in the background; the UI already reflects `next`.
        void saveState(next).catch((err) => reportError(err));
        return next;
      });
    },
    [pack],
  );

  return { status, state, logMiles };
}
