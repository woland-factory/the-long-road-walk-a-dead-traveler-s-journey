import { useState } from "react";
import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "../state/types";
import { BACKUP_MESSAGES, MAX_BACKUP_BYTES, parseBackup } from "../state/backup";
import { readFileText } from "../lib/readFileText";

// The Start screen, shown only when no walker record exists. It says what the
// product is and that it asks for a daily check-in before the walker commits,
// hosts the journey picker, and carries a subordinate restore path for a
// returning walker on a fresh device.

interface StartProps {
  packs: JourneyPack[];
  onBegin: (packId: string) => void;
  onRestore: (state: WalkerState) => void;
}

export function Start({ packs, onBegin, onRestore }: StartProps) {
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  function begin(packId: string) {
    setPressedId(packId); // pressed feedback within 100ms; onBegin persists and navigates
    onBegin(packId);
  }

  async function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = ""; // choosing the same file again re-fires the change
    if (!file) return;
    setRestoreError(null);
    if (file.size > MAX_BACKUP_BYTES) {
      setRestoreError(BACKUP_MESSAGES.tooLarge);
      return;
    }
    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      setRestoreError(BACKUP_MESSAGES.notABackup);
      return;
    }
    const result = parseBackup(text);
    if (!result.ok) {
      setRestoreError(result.message);
      return;
    }
    onRestore(result.state); // a fresh device has nothing to lose: no confirm
  }

  return (
    <main className="page start-page">
      <header className="masthead">
        <h1>The Long Road</h1>
        <p>Walk a real historic journey, mile for mile. Each milepost you reach hands you what the traveler wrote on that ground.</p>
      </header>

      <section className="card start-ritual">
        <p>You count your own miles and log them here once a day. It takes about ten seconds.</p>
      </section>

      <section className="picker" aria-label="Choose a journey">
        <h2 className="picker-heading">Choose a journey</h2>
        {packs.map((pack) => (
          <article className="picker-card card" key={pack.id}>
            <h3 className="picker-title">{pack.title}</h3>
            <p className="picker-scale">
              {pack.years}. About {pack.totalMiles.toLocaleString("en-US")} miles.
            </p>
            <p className="picker-companion">{pack.companion}</p>
            <button
              type="button"
              className={pressedId === pack.id ? "picker-begin is-pressed" : "picker-begin"}
              aria-label={`Begin ${pack.title}`}
              onClick={() => begin(pack.id)}
            >
              Begin this journey
            </button>
          </article>
        ))}
      </section>

      <section className="card start-restore">
        <p className="start-restore-lead">Walked before? Restore your backup.</p>
        <label className="backup-restore">
          Restore from a backup
          <input
            type="file"
            accept="application/json,.json"
            className="backup-file"
            onChange={(e) => void onFileChosen(e)}
          />
        </label>
        {restoreError && (
          <p className="backup-notice backup-notice-error" role="alert">
            {restoreError}
          </p>
        )}
      </section>
    </main>
  );
}
