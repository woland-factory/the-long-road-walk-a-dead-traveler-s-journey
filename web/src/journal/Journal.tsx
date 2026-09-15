import { useEffect, useId, useRef } from "react";
import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "../state/types";
import { buildJournal } from "./buildJournal";

// The double journal: a full-viewport reading view that replaces the Trail
// body. One facing-page spread per reached milepost, the traveler's verbatim
// entry beside the walker's own line and the real date they reached that
// ground. The same mounted DOM is what the print stylesheet lays out, so the
// withhold boundary in buildJournal covers the printed artifact too.

interface JournalProps {
  pack: JourneyPack;
  state: WalkerState;
  onClose: () => void; // back to the Trail
}

export function Journal({ pack, state, onClose }: JournalProps) {
  const spreads = buildJournal(state, pack);
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Reading starts at the top: move focus to the view heading on open.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Escape returns to the Trail from anywhere in the view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const miles = state.cumulativeMiles;
  const scaleLine = [
    miles === 1 ? "1 mile walked." : `${miles} miles walked.`,
    spreads.length === 1 ? "1 entry earned." : `${spreads.length} entries earned.`,
  ].join(" ");

  return (
    <section className="journal" aria-labelledby={headingId}>
      <div className="journal-top no-print">
        <button type="button" className="journal-back" onClick={onClose}>
          Back to the trail
        </button>
        {spreads.length > 0 && (
          <button type="button" className="journal-print" onClick={() => window.print()}>
            Print your journal
          </button>
        )}
      </div>

      <header className="journal-front">
        <h1 id={headingId} tabIndex={-1} ref={headingRef} className="journal-title">
          {pack.title}
        </h1>
        <p className="journal-traveler">
          A double journal with {pack.traveler}, {pack.years}.
        </p>
        {spreads.length > 0 && (
          <>
            <p className="journal-scale">{scaleLine}</p>
            <p className="journal-framing">{pack.framingNote}</p>
          </>
        )}
      </header>

      {spreads.length === 0 ? (
        <div className="journal-empty">
          <p>
            Your journal fills as you walk. Each milepost you reach adds the
            traveler's words beside your own. Log your first miles to earn the
            first page.
          </p>
        </div>
      ) : (
        <ol className="journal-spreads">
          {spreads.map((s) => (
            <li key={s.milepostId}>
              <article className="journal-spread" aria-label={`Mile ${s.mileMark}: ${s.place}`}>
                <section className="spread-side spread-traveler">
                  <h2 className="spread-place">{s.place}</h2>
                  <p className="spread-dateline">{s.travelerDateline}</p>
                  {s.voices.map((v, i) => (
                    <blockquote className="spread-voice" key={i}>
                      <p className="voice-text">{v.text}</p>
                      <footer className="voice-author">{v.author}</footer>
                    </blockquote>
                  ))}
                  <p className="spread-approx">{s.approxNote}</p>
                </section>
                <section className="spread-side spread-walker">
                  <p className="spread-dateline">You reached this on {s.reachedDateline}.</p>
                  {s.walkerLine !== "" ? (
                    <p className="spread-walker-line">{s.walkerLine}</p>
                  ) : (
                    <p className="spread-walker-prompt no-print">
                      Add your line for this milepost from the Trail.
                    </p>
                  )}
                </section>
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
