import { describe, it, expect, beforeEach } from "vitest";
import {
  markBackupExported,
  markReminderDismissed,
  readReminderFlags,
  shouldShowBackupReminder,
} from "./reminder";

describe("shouldShowBackupReminder (AC6.1)", () => {
  it("is true only with an earned entry and neither flag set", () => {
    for (const hasEarnedEntry of [true, false]) {
      for (const dismissed of [true, false]) {
        for (const exported of [true, false]) {
          const expected = hasEarnedEntry && !dismissed && !exported;
          expect(
            shouldShowBackupReminder({ hasEarnedEntry, dismissed, exported }),
          ).toBe(expected);
        }
      }
    }
  });
});

describe("the device-local flags", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("start unset", () => {
    expect(readReminderFlags()).toEqual({ dismissed: false, exported: false });
  });

  it("dismiss persists permanently", () => {
    markReminderDismissed();
    expect(readReminderFlags().dismissed).toBe(true);
  });

  it("exported persists permanently", () => {
    markBackupExported();
    expect(readReminderFlags().exported).toBe(true);
  });
});
