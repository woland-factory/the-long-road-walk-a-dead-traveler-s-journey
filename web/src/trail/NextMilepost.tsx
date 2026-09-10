import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "../state/types";
import { milesToNext } from "../state/odometer";

// Distance to the next milepost, with a progress bar. Shows a completion note
// once every milepost is reached.
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

  const prevMark = pack.mileposts
    .filter((m) => m.mileMark <= state.cumulativeMiles)
    .reduce((max, m) => Math.max(max, m.mileMark), 0);

  const span = next.mileMark - prevMark;
  const done = state.cumulativeMiles - prevMark;
  const pct = span > 0 ? Math.min(100, Math.max(0, (done / span) * 100)) : 0;
  const rounded = Number.isInteger(remaining) ? String(remaining) : remaining.toFixed(1);

  return (
    <div className="next">
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
    </div>
  );
}
