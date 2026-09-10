import { useId, useState, type FormEvent } from "react";
import { parseMiles } from "./validate";

// The ten-second check-in: type miles, submit. Validates at the boundary and
// only advances the odometer on valid input.
export function CheckIn({ onLog }: { onLog: (miles: number) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = parseMiles(value);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    setValue("");
    onLog(result.miles); // optimistic: parent updates state synchronously
  }

  return (
    <form className="checkin" onSubmit={submit} noValidate>
      <label htmlFor={inputId}>Miles walked today</label>
      <div className="checkin-row">
        <input
          id={inputId}
          name="miles"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="3"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <button type="submit">Log miles</button>
      </div>
      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
