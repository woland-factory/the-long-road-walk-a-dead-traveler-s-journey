// Designed empty, loading, and error surfaces for the Trail.

export function EmptyState() {
  return (
    <div className="state" role="status">
      <h2>Your road starts here</h2>
      <p>Log your first miles to begin. Each milepost you reach hands you the traveler's own words.</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="state" aria-busy="true" aria-label="Loading your trail">
      <div className="skeleton value" />
      <div className="skeleton line" />
      <div className="skeleton line" />
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="state" role="alert">
      <h2>Your trail paused</h2>
      <p>Reload to pick it up. Your logged miles are saved on this device.</p>
      {onRetry && (
        <button type="button" className="retry" onClick={onRetry} style={{ marginTop: 14, minHeight: 44 }}>
          Reload the trail
        </button>
      )}
    </div>
  );
}
