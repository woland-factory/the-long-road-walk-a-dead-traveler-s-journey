import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "../state/types";
import { facingLineFor } from "../state/personalLog";
import { dateline } from "./dateline";

// The Arrival ceremony: a full-viewport reading surface that hands the walker
// the verbatim entry they just earned. It opens on a fresh crossing or when a
// reached row is tapped, and closes back to the Trail.
//
// The withholding is airtight here as a second line of defense: the queue is
// filtered to ids actually in reachedMilepostIds, so the voices of an unearned
// milepost are never mounted, not merely hidden.

interface ArrivalProps {
  pack: JourneyPack;
  state: WalkerState;
  queue: string[];
  onSaveFacingLine: (milepostId: string, text: string) => void;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Arrival({ pack, state, queue, onSaveFacingLine, onClose }: ArrivalProps) {
  const reached = new Set(state.reachedMilepostIds);
  const ids = queue.filter((id) => reached.has(id));

  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<Element | null>(null);
  const [index, setIndex] = useState(0);
  const headingId = useId();
  const lineFieldId = useId();

  const activeId = ids[Math.min(index, ids.length - 1)];
  const milepost = pack.mileposts.find((m) => m.id === activeId);

  const [lineValue, setLineValue] = useState("");

  // Prefill the facing line whenever the active milepost changes.
  useEffect(() => {
    // Reading the saved line only on milepost change keeps what the walker
    // typed from being clobbered by the optimistic state update after a save.
    if (activeId) setLineValue(facingLineFor(state, activeId));
  }, [activeId]);

  // Nothing earned in this queue: close and render nothing.
  useEffect(() => {
    if (ids.length === 0) onClose();
  }, [ids.length, onClose]);

  // Capture the trigger, move focus in, restore focus on close.
  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    dialogRef.current?.focus();
    const toRestore = returnFocusRef.current;
    return () => {
      if (toRestore instanceof HTMLElement) toRestore.focus();
    };
  }, []);

  const saveCurrent = useCallback(() => {
    if (activeId) onSaveFacingLine(activeId, lineValue);
  }, [activeId, lineValue, onSaveFacingLine]);

  const advance = useCallback(() => {
    saveCurrent();
    if (index < ids.length - 1) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  }, [saveCurrent, index, ids.length, onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      saveCurrent();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    // Keep focus within the dialog.
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!milepost) return null;

  const isLast = index === ids.length - 1;

  return (
    <div className="arrival-overlay" role="presentation">
      <div
        className="arrival-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        ref={dialogRef}
        onKeyDown={onKeyDown}
      >
        <div className="arrival-top">
          <button type="button" className="arrival-close" onClick={() => { saveCurrent(); onClose(); }}>
            Close
          </button>
        </div>

        <div className="arrival-scroll">
          <header className="arrival-head">
            <h2 id={headingId} className="arrival-place">{milepost.place}</h2>
            <p className="arrival-dateline">{dateline(milepost.date)}</p>
          </header>

          <div className="arrival-entry">
            {milepost.voices.map((v, i) => (
              <blockquote className="arrival-voice" key={i}>
                <p className="voice-text">{v.text}</p>
                <footer className="voice-author">{v.author}</footer>
              </blockquote>
            ))}
          </div>

          <p className="arrival-approx">{milepost.approxNote}</p>

          <section className="arrival-framing" aria-label="About these words">
            <p>{pack.framingNote}</p>
          </section>

          <div className="arrival-line">
            <label htmlFor={lineFieldId}>Your line for this milepost</label>
            <textarea
              id={lineFieldId}
              className="arrival-line-input"
              rows={2}
              value={lineValue}
              placeholder="Rain most of the way. Legs tired, mind clear."
              onChange={(e) => setLineValue(e.target.value)}
              onBlur={saveCurrent}
            />
          </div>
        </div>

        <div className="arrival-actions">
          <button type="button" className="arrival-advance" onClick={advance}>
            {isLast ? "Back to the trail" : "Next entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
