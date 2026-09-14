import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "../state/types";
import { dateline } from "./dateline";

// Reached mileposts as compact tappable rows, newest first. Tapping a row
// re-opens its Arrival surface to read the entry again. The verbatim text is
// never rendered here; it is mounted one entry at a time in the Arrival.
//
// The withhold boundary is unchanged: only ids in reachedMilepostIds produce a
// row, so an unreached milepost has no row and no text anywhere in the DOM.
export function ReachedList({
  state,
  pack,
  onOpen,
}: {
  state: WalkerState;
  pack: JourneyPack;
  onOpen: (id: string) => void;
}) {
  const reached = pack.mileposts
    .filter((m) => state.reachedMilepostIds.includes(m.id))
    .reverse(); // newest first

  if (reached.length === 0) {
    return null;
  }

  return (
    <section className="reached card" aria-label="Mileposts reached">
      <h2>Mileposts reached</h2>
      <ul className="reached-rows">
        {reached.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              className="reached-row"
              data-testid={`reached-row-${m.id}`}
              onClick={() => onOpen(m.id)}
            >
              <span className="reached-place">{m.place}</span>
              <span className="reached-meta">
                {dateline(m.date)} · mile {m.mileMark}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
