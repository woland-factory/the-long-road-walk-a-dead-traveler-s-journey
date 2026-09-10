import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "../state/types";

// Reached mileposts, each with its revealed fixture text shown inline.
// A milepost's text is rendered only when its id is in reachedMilepostIds,
// which is the withhold-then-reveal mechanism at the render boundary.
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
          <div>
            <span className="place">{m.place}</span> <span className="mark">mile {m.mileMark}</span>
          </div>
          <blockquote>
            {m.text}
            <span className="approx">{m.approxNote}</span>
          </blockquote>
        </article>
      ))}
    </section>
  );
}
