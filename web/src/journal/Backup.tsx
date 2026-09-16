import { useState } from "react";
import type { WalkerState } from "../state/types";
import {
  BACKUP_MESSAGES,
  MAX_BACKUP_BYTES,
  parseBackup,
  serializeBackup,
} from "../state/backup";
import {
  markBackupExported,
  markReminderDismissed,
  readReminderFlags,
  shouldShowBackupReminder,
} from "./reminder";
import { readFileText } from "../lib/readFileText";

// Save a backup, restore from one, and the gentle one-line reminder.
// Everything here is local: the file the walker downloads is the only copy
// that leaves the device, and only because they chose to save it.

interface BackupProps {
  state: WalkerState | null;
  onRestore: (state: WalkerState) => void;
}

type Notice = { kind: "saved" | "restored" | "error"; message: string };

export function Backup({ state, onRestore }: BackupProps) {
  const [flags, setFlags] = useState(readReminderFlags);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState<WalkerState | null>(null);
  const [pressed, setPressed] = useState(false);

  const hasMiles = state !== null && state.dailyLog.length > 0;
  const hasEarnedEntry = state !== null && state.reachedMilepostIds.length > 0;
  const showReminder = shouldShowBackupReminder({
    hasEarnedEntry,
    dismissed: flags.dismissed,
    exported: flags.exported,
  });

  function saveBackup() {
    if (!state) return;
    setPressed(true);
    window.setTimeout(() => setPressed(false), 150);
    const text = serializeBackup(state, new Date().toISOString());
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `the-long-road-${state.activePackId}-backup.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    markBackupExported();
    setFlags(readReminderFlags());
    setPending(null);
    setNotice({ kind: "saved", message: "Saved. Keep the file somewhere safe." });
  }

  async function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = ""; // choosing the same file again re-fires the change
    if (!file) return;
    setPending(null);
    if (file.size > MAX_BACKUP_BYTES) {
      setNotice({ kind: "error", message: BACKUP_MESSAGES.tooLarge });
      return;
    }
    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      setNotice({ kind: "error", message: BACKUP_MESSAGES.notABackup });
      return;
    }
    const result = parseBackup(text);
    if (!result.ok) {
      setNotice({ kind: "error", message: result.message });
      return;
    }
    if (hasMiles) {
      // Replacing real progress is hard to reverse: confirm first.
      setNotice(null);
      setPending(result.state);
      return;
    }
    completeRestore(result.state);
  }

  function completeRestore(next: WalkerState) {
    onRestore(next);
    setPending(null);
    setNotice({ kind: "restored", message: "Your journal is restored." });
  }

  return (
    <div className="backup">
      {showReminder && (
        <div className="backup-reminder" role="status">
          <p>Keep a backup so your journal travels with you.</p>
          <button
            type="button"
            className="backup-dismiss"
            onClick={() => {
              markReminderDismissed();
              setFlags(readReminderFlags());
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="backup-actions">
        {hasMiles && (
          <button
            type="button"
            className={pressed ? "backup-save is-pressed" : "backup-save"}
            onClick={saveBackup}
          >
            Save a backup
          </button>
        )}
        <label className="backup-restore">
          Restore from a backup
          <input
            type="file"
            accept="application/json,.json"
            className="backup-file"
            onChange={(e) => void onFileChosen(e)}
          />
        </label>
      </div>

      {pending && (
        <div className="backup-confirm" role="group" aria-label="Confirm the restore">
          <p>This backup replaces the journal on this device.</p>
          <div className="backup-confirm-actions">
            <button
              type="button"
              className="backup-confirm-restore"
              onClick={() => completeRestore(pending)}
            >
              Restore the backup
            </button>
            <button type="button" className="backup-keep" onClick={() => setPending(null)}>
              Keep the current journal
            </button>
          </div>
        </div>
      )}

      {notice && (
        <p
          className={`backup-notice backup-notice-${notice.kind}`}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.message}
        </p>
      )}
    </div>
  );
}
