import type { JourneyPack } from "../packs/types";
import { useWalker } from "../state/useWalker";
import { Odometer } from "./Odometer";
import { NextMilepost } from "./NextMilepost";
import { CheckIn } from "./CheckIn";
import { ReachedList } from "./ReachedList";
import { EmptyState, LoadingState, ErrorState } from "./states";

// The Trail: the home/check-in screen. Cumulative odometer, a ten-second
// check-in, progress to the next milepost, and the mileposts already reached
// with their revealed text.
export function Trail({ pack }: { pack: JourneyPack }) {
  const { status, state, logMiles } = useWalker(pack);

  const hasMiles = state !== null && state.dailyLog.length > 0;
  const hasReached = state !== null && state.reachedMilepostIds.length > 0;

  return (
    <main className="page">
      <header className="masthead">
        <h1>The Long Road</h1>
        <p>Walk {pack.traveler}'s journey, mile for mile.</p>
      </header>

      {status === "loading" && (
        <section className="card" aria-live="polite">
          <LoadingState />
        </section>
      )}

      {status === "error" && (
        <section className="card">
          <ErrorState onRetry={() => window.location.reload()} />
        </section>
      )}

      {status === "ready" && (
        <>
          <section className="card">
            {hasMiles && state ? <Odometer cumulativeMiles={state.cumulativeMiles} /> : <EmptyState />}
          </section>

          <section className="card">
            <CheckIn onLog={logMiles} />
          </section>

          {hasMiles && state && (
            <section className="card">
              <NextMilepost state={state} pack={pack} />
            </section>
          )}

          {hasReached && (
            <section className="card framing" aria-label="About these words">
              <h2>About these words</h2>
              <p>{pack.framingNote}</p>
            </section>
          )}

          {state && <ReachedList state={state} pack={pack} />}
        </>
      )}
    </main>
  );
}
