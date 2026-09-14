import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "../state/types";
import { milesToNext } from "../state/odometer";

// The non-unlock-day payoff: where the walker stands now, how far to the next
// milepost in miles, and one authored approach line about the ground ahead that
// never spoils the coming entry. Shows a completion note once all are reached.
export function NextMilepost({ state, pack }: { state: WalkerState; pack: JourneyPack }) {
  const remaining = milesToNext(state, pack);

  if (remaining === null) {
    return (
      <div className="next" role="status">
        <p>You reached every milepost on this trail. Keep a record of the whole walk.</p>
      </div>
    );
  }

  const next = pack.mileposts
    .filter((m) => m.mileMark > state.cumulativeMiles)
    .sort((a, b) => a.mileMark - b.mileMark)[0];

  const passed = pack.mileposts
    .filter((m) => m.mileMark <= state.cumulativeMiles)
    .sort((a, b) => a.mileMark - b.mileMark);
  const last = passed[passed.length - 1];
  const prevMark = last ? last.mileMark : 0;

  const span = next.mileMark - prevMark;
  const done = state.cumulativeMiles - prevMark;
  const pct = span > 0 ? Math.min(100, Math.max(0, (done / span) * 100)) : 0;
  const rounded = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(1);

  return (
    <div className="next">
      <p className="position">
        {last ? `You last reached ${last.place}.` : "You are at the start of the road."}
      </p>
      <p>
        <strong>{rounded}</strong> miles to {next.place}.
      </p>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={`Progress to ${next.place}`}
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="approach">{next.approach}</p>
    </div>
  );
}
