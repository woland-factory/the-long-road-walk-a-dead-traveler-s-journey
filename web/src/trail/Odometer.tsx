// Cumulative miles display. Rounds to one decimal for a clean readout while
// the underlying value stays exact.
export function Odometer({ cumulativeMiles }: { cumulativeMiles: number }) {
  const display = Number.isInteger(cumulativeMiles)
    ? String(cumulativeMiles)
    : cumulativeMiles.toFixed(1);
  return (
    <div className="odometer">
      <span className="value" data-testid="odometer-value">
        {display}
      </span>
      <span className="unit">miles walked</span>
    </div>
  );
}
