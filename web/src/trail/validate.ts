export const MAX_MILES_PER_CHECKIN = 200;

export type MileResult =
  | { ok: true; miles: number }
  | { ok: false; message: string };

// Validate the mile field at the boundary, before it touches state.
export function parseMiles(input: string): MileResult {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { ok: false, message: "Enter how many miles you walked today." };
  }
  // Digits with at most two decimal places.
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    if (/^-/.test(trimmed)) {
      return { ok: false, message: "Enter miles as a positive number." };
    }
    if (/\.\d{3,}$/.test(trimmed)) {
      return { ok: false, message: "Round to the nearest hundredth of a mile." };
    }
    return { ok: false, message: "Enter miles as a number, like 3 or 4.5." };
  }
  const miles = Number(trimmed);
  if (miles <= 0) {
    return { ok: false, message: "Enter miles as a positive number." };
  }
  if (miles > MAX_MILES_PER_CHECKIN) {
    return { ok: false, message: `That is a lot for one day. Enter ${MAX_MILES_PER_CHECKIN} miles or fewer.` };
  }
  return { ok: true, miles };
}

// Today's date as YYYY-MM-DD in local time.
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
