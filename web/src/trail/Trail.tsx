import { useEffect, useRef, useState } from "react";
import type { JourneyPack } from "../packs/types";
import { useWalker } from "../state/useWalker";
import { Odometer } from "./Odometer";
import { NextMilepost } from "./NextMilepost";
import { CheckIn } from "./CheckIn";
import { ReachedList } from "./ReachedList";
import { Arrival } from "./Arrival";
import { Journal } from "../journal/Journal";
import { Backup } from "../journal/Backup";
import { EmptyState, LoadingState, ErrorState } from "./states";

// The Trail: the home/check-in screen. Cumulative odometer, a ten-second
// check-in, the next milepost with its approach line, and the reached mileposts
// as tappable rows. Crossing a milepost opens the Arrival ceremony; the heavy
// verbatim text is read there, one entry at a time. The Journal is a second
// in-app view that replaces the Trail body while the walker reads.
export function Trail({ pack }: { pack: JourneyPack }) {
  const { status, state, logMiles, saveFacingLine, restoreState, pendingArrival, clearPendingArrival } =
    useWalker(pack);

  // A manually re-opened entry (tapping a reached row). The Arrival queue is the
  // fresh crossing when there is one, otherwise the manual re-read.
  const [manualOpen, setManualOpen] = useState<string[] | null>(null);
  const queue = pendingArrival.length > 0 ? pendingArrival : manualOpen ?? [];

  const [view, setView] = useState<"trail" | "journal">("trail");
  const readJournalRef = useRef<HTMLButtonElement>(null);
  const returnFromJournal = useRef(false);

  // Closing the Journal returns focus to the control that opened it.
  useEffect(() => {
    if (view === "trail" && returnFromJournal.current) {
      returnFromJournal.current = false;
      readJournalRef.current?.focus();
    }
  }, [view]);

  const hasMiles = state !== null && state.dailyLog.length > 0;
  const hasEarned = state !== null && state.reachedMilepostIds.length > 0;

  function closeArrival() {
    clearPendingArrival();
    setManualOpen(null);
  }

  function closeJournal() {
    returnFromJournal.current = true;
    setView("trail");
  }

  if (view === "journal" && state) {
    return (
      <main className="page journal-page">
        <Journal pack={pack} state={state} onClose={closeJournal} />
      </main>
    );
  }

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

          {state && <ReachedList state={state} pack={pack} onOpen={(id) => setManualOpen([id])} />}

          <section className="card keepsake">
            <h2>Your journal</h2>
            {hasEarned && (
              <button
                type="button"
                ref={readJournalRef}
                className="keepsake-read"
                onClick={() => setView("journal")}
              >
                Read your journal
              </button>
            )}
            <Backup state={state} onRestore={restoreState} />
          </section>
        </>
      )}

      {state && queue.length > 0 && (
        <Arrival
          pack={pack}
          state={state}
          queue={queue}
          onSaveFacingLine={saveFacingLine}
          onClose={closeArrival}
        />
      )}
    </main>
  );
}
