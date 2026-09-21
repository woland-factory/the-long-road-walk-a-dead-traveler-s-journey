import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { JourneyPack } from "../packs/types";
import { useWalker } from "../state/useWalker";
import { Odometer } from "./Odometer";
import { NextMilepost } from "./NextMilepost";
import { CheckIn } from "./CheckIn";
import { ReachedList } from "./ReachedList";
import { Arrival } from "./Arrival";
import { Journal } from "../journal/Journal";
import { Backup } from "../journal/Backup";
import { Importer } from "../importer/Importer";
import type { DayTotal } from "../importer/csv";
import { Walkthrough } from "../firstrun/Walkthrough";
import {
  markWalkthroughDone,
  readWalkthroughDone,
  walkthroughStep,
} from "../firstrun/walkthrough";
import { EmptyState, LoadingState, ErrorState } from "./states";

// The Trail: the home/check-in screen. Cumulative odometer, a ten-second
// check-in, the next milepost with its approach line, and the reached mileposts
// as tappable rows. Crossing a milepost opens the Arrival ceremony; the heavy
// verbatim text is read there, one entry at a time. The Journal and the Importer
// are second in-app views that replace the Trail body.
export function Trail({ pack }: { pack: JourneyPack }) {
  const { status, state, logMiles, importDays, saveFacingLine, restoreState, pendingArrival, clearPendingArrival } =
    useWalker(pack);

  // A manually re-opened entry (tapping a reached row). The Arrival queue is the
  // fresh crossing when there is one, otherwise the manual re-read.
  const [manualOpen, setManualOpen] = useState<string[] | null>(null);
  const queue = pendingArrival.length > 0 ? pendingArrival : manualOpen ?? [];

  const [view, setView] = useState<"trail" | "journal" | "import">("trail");
  const readJournalRef = useRef<HTMLButtonElement>(null);
  const importTriggerRef = useRef<HTMLButtonElement>(null);
  const returnFromJournal = useRef(false);
  const returnFromImport = useRef(false);

  // The guided first run: a device-local "done" flag plus a tiny in-session
  // record that the walker acknowledged the preview step.
  const [done, setDone] = useState<boolean>(() => readWalkthroughDone());
  const [previewSeen, setPreviewSeen] = useState(false);
  const initRef = useRef(false);

  const hasMiles = state !== null && state.dailyLog.length > 0;
  const hasEarned = state !== null && state.reachedMilepostIds.length > 0;

  // At first ready, a record that already has miles (a returning walker, a
  // seeded demo, or a restored backup) marks the walkthrough done silently, so
  // it never shows for them. useLayoutEffect runs before paint, so no callout
  // ever flashes.
  useLayoutEffect(() => {
    if (status !== "ready" || initRef.current) return;
    initRef.current = true;
    if (!done && hasMiles) {
      markWalkthroughDone();
      setDone(true);
    }
  }, [status, hasMiles, done]);

  // Closing the Journal or Importer returns focus to the control that opened it.
  useEffect(() => {
    if (view === "trail" && returnFromJournal.current) {
      returnFromJournal.current = false;
      readJournalRef.current?.focus();
    }
    if (view === "trail" && returnFromImport.current) {
      returnFromImport.current = false;
      importTriggerRef.current?.focus();
    }
  }, [view]);

  function finishWalkthrough() {
    markWalkthroughDone();
    setDone(true);
  }

  // A restore brings a returning walker's whole journal, so the guided first run
  // never applies to it.
  function handleRestore(incoming: Parameters<typeof restoreState>[0]) {
    restoreState(incoming);
    finishWalkthrough();
  }

  function closeArrival() {
    clearPendingArrival();
    setManualOpen(null);
  }

  function closeJournal() {
    returnFromJournal.current = true;
    setView("trail");
  }

  function closeImporter() {
    returnFromImport.current = true;
    setView("trail");
  }

  function onImport(adds: DayTotal[]) {
    const wasEmpty = !hasMiles;
    importDays(adds);
    // An import that adds the walker's first miles is a first success.
    if (wasEmpty) finishWalkthrough();
    closeImporter();
  }

  const arrivalOpen = queue.length > 0;
  const step = walkthroughStep({ done, hasMiles, hasEarned, arrivalOpen, previewSeen });
  const traveler = pack.traveler;

  if (view === "journal" && state) {
    return (
      <main className="page journal-page">
        <Journal pack={pack} state={state} onClose={closeJournal} />
      </main>
    );
  }

  if (view === "import") {
    return (
      <main className="page">
        <Importer
          dailyLog={state?.dailyLog ?? []}
          onImport={onImport}
          onClose={closeImporter}
        />
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
          <section className="card" aria-live="polite">
            {hasMiles && state ? <Odometer cumulativeMiles={state.cumulativeMiles} /> : <EmptyState />}
          </section>

          <section className="card">
            <CheckIn onLog={logMiles} />
            <button
              type="button"
              ref={importTriggerRef}
              className="import-open"
              onClick={() => setView("import")}
            >
              Add miles from a file
            </button>
          </section>

          {step === "log" && (
            <Walkthrough message="Log the miles you walked today." onSkip={finishWalkthrough} />
          )}
          {step === "finish" && !hasEarned && (
            <Walkthrough
              message="Come back tomorrow and log your walk again."
              primary={{ label: "Done", onClick: finishWalkthrough }}
              onSkip={finishWalkthrough}
            />
          )}

          {hasMiles && state && (
            <section className="card">
              <NextMilepost state={state} pack={pack} />
            </section>
          )}

          {step === "preview" && (
            <Walkthrough
              message={`Walk this distance to earn ${traveler}'s first entry.`}
              primary={{ label: "Next", onClick: () => setPreviewSeen(true) }}
              onSkip={finishWalkthrough}
            />
          )}

          {state && <ReachedList state={state} pack={pack} onOpen={(id) => setManualOpen([id])} />}

          {step === "finish" && hasEarned && (
            <Walkthrough
              message="Return each day to earn the next entry."
              primary={{ label: "Done", onClick: finishWalkthrough }}
              onSkip={finishWalkthrough}
            />
          )}

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
            <Backup state={state} onRestore={handleRestore} />
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
