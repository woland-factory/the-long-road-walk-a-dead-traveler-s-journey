import { useEffect, useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { Trail } from "./trail/Trail";
import { Start } from "./firstrun/Start";
import { LoadingState, ErrorState } from "./trail/states";
import { journeyPacks, packById } from "./packs";
import { muirPack } from "./packs/muir";
import type { JourneyPack } from "./packs/types";
import type { WalkerState } from "./state/types";
import { freshState } from "./state/odometer";
import { loadState, saveState } from "./state/store";
import { env } from "./env";
import { reportError } from "./observability/sentry";

type Boot = "loading" | "start" | "trail" | "error";

// The boot gate. One read of the store decides the first screen: an existing
// record boots straight to its Trail; a fresh database with SEED_DEMO boots the
// seeded Trail; a fresh database otherwise shows Start. Choosing a journey or
// restoring a backup creates the record and enters the Trail.
export function App() {
  const [boot, setBoot] = useState<Boot>("loading");
  const [pack, setPack] = useState<JourneyPack>(muirPack);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadState();
        if (cancelled) return;
        if (loaded) {
          setPack(packById(loaded.activePackId) ?? muirPack);
          setBoot("trail");
          return;
        }
        if (env.seedDemo) {
          setPack(muirPack);
          setBoot("trail");
          return;
        }
        setBoot("start");
      } catch (err) {
        if (cancelled) return;
        reportError(err);
        setBoot("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function beginJourney(packId: string) {
    const chosen = packById(packId) ?? muirPack;
    try {
      await saveState(freshState(packId, new Date().toISOString()));
    } catch (err) {
      reportError(err);
    }
    setPack(chosen);
    setBoot("trail");
  }

  async function restoreOnStart(state: WalkerState) {
    try {
      await saveState(state); // Trail's useWalker recomputes derived fields on load
    } catch (err) {
      reportError(err);
    }
    setPack(packById(state.activePackId) ?? muirPack);
    setBoot("trail");
  }

  return (
    <ErrorBoundary>
      {boot === "loading" && (
        <main className="page">
          <section className="card" aria-live="polite">
            <LoadingState />
          </section>
        </main>
      )}
      {boot === "error" && (
        <main className="page">
          <section className="card">
            <ErrorState onRetry={() => window.location.reload()} />
          </section>
        </main>
      )}
      {boot === "start" && (
        <Start packs={journeyPacks} onBegin={beginJourney} onRestore={restoreOnStart} />
      )}
      {boot === "trail" && <Trail pack={pack} />}
    </ErrorBoundary>
  );
}
