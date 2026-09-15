// The gentle backup reminder. The decision is pure and tested directly; the
// flags are device-local (localStorage), deliberately kept out of the exported
// keepsake: they describe THIS device's backup habit, not the journey.

export function shouldShowBackupReminder(args: {
  hasEarnedEntry: boolean;
  dismissed: boolean;
  exported: boolean;
}): boolean {
  return args.hasEarnedEntry && !args.dismissed && !args.exported;
}

const DISMISSED_KEY = "the-long-road:backup-reminder-dismissed";
const EXPORTED_KEY = "the-long-road:backup-exported";

// localStorage can be absent or sealed (private mode); the reminder then
// simply shows again, which is harmless.
function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Nothing to do: the flag is a convenience, never load-bearing.
  }
}

export function readReminderFlags(): { dismissed: boolean; exported: boolean } {
  return { dismissed: readFlag(DISMISSED_KEY), exported: readFlag(EXPORTED_KEY) };
}

export function markReminderDismissed(): void {
  writeFlag(DISMISSED_KEY);
}

export function markBackupExported(): void {
  writeFlag(EXPORTED_KEY);
}
