import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "../state/types";

// Reached mileposts, each with its revealed voices shown inline.
// A milepost's text is rendered only when its id is in reachedMilepostIds,
// which is the withhold-then-reveal mechanism at the render boundary.

// Format an ISO date (YYYY-MM-DD) as a readable dateline, e.g. "September 12, 1867".
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
function dateline(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, year, month, day] = m;
  const name = MONTHS[Number(month) - 1] ?? month;
  return `${name} ${Number(day)}, ${year}`;
}

export function ReachedList({ state, pack }: { state: WalkerState; pack: JourneyPack }) {
  const reached = pack.mileposts.filter((m) => state.reachedMilepostIds.includes(m.id));

  if (reached.length === 0) {
    return null;
  }

  return (
    <section className="reached card" aria-label="Mileposts reached">
      <h2>Mileposts reached</h2>
      {reached.map((m) => (
        <article className="milepost" key={m.id} data-testid={`milepost-${m.id}`}>
          <div className="milepost-head">
            <span className="place">{m.place}</span> <span className="mark">mile {m.mileMark}</span>
          </div>
          <p className="dateline">{dateline(m.date)}</p>
          {m.voices.map((v, i) => (
            <blockquote key={i}>
              <p className="voice-text">{v.text}</p>
              <footer className="voice-author">{v.author}</footer>
            </blockquote>
          ))}
          <p className="approx">{m.approxNote}</p>
        </article>
      ))}
    </section>
  );
}
