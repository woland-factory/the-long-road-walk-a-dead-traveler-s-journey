// One step of the guided first run: a small callout that sits beside the card
// it points at. One imperative sentence, an optional primary control (Next or
// Done), and Skip. It never traps focus, never covers the control it points at,
// and carries .no-print so it never lands in the keepsake.

interface WalkthroughProps {
  message: string;
  primary?: { label: string; onClick: () => void };
  onSkip: () => void;
}

export function Walkthrough({ message, primary, onSkip }: WalkthroughProps) {
  return (
    <div className="walkthrough-callout no-print" role="status">
      <p className="walkthrough-message">{message}</p>
      <div className="walkthrough-actions">
        {primary && (
          <button type="button" className="walkthrough-primary" onClick={primary.onClick}>
            {primary.label}
          </button>
        )}
        <button type="button" className="walkthrough-skip" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  );
}
