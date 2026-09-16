import { useEffect, useRef, useState } from "react";
import type { DailyLogEntry } from "../state/types";
import { todayISO } from "../trail/validate";
import { dateline } from "../trail/dateline";
import { readFileText } from "../lib/readFileText";
import { parseWalksCsv, MAX_CSV_BYTES, type DayTotal } from "./csv";
import {
  scanHealthExport,
  MAX_HEALTH_XML_BYTES,
  HEALTH_MESSAGES,
  type XmlResult,
  type AbortFlag,
} from "./appleHealth";
import { planMerge, type MergePlan } from "./mergeDays";

// The import view: a second input path reachable from the Trail. It lists the
// two supported formats and the on-device promise where the file is chosen,
// validates at the boundary in order, previews the honest merge plan, and only
// changes state once the walker confirms. Everything is read on this device.

interface ImporterProps {
  dailyLog: DailyLogEntry[];
  onImport: (adds: DayTotal[]) => void;
  onClose: () => void;
  // Injectable only so the scanning/cancel UI is testable without a huge file.
  scan?: (
    file: File,
    onProgress: (read: number, total: number) => void,
    signal: AbortFlag,
  ) => Promise<XmlResult>;
}

const MESSAGES = {
  zip: "Unzip export.zip first, then choose the export.xml inside.",
  unsupported: "Choose a date,miles CSV or an Apple Health export.xml.",
  csvTooLarge: "That CSV is larger than this app can read. Choose a file under 1 MB.",
  csvShape:
    "This does not look like a date,miles CSV. The first line should be date,miles or a row like 2026-06-01,3.5.",
  xmlShape: "This does not look like an Apple Health export. Choose the export.xml from your export.",
} as const;

type Phase =
  | { kind: "choose"; error: string | null }
  | { kind: "scanning"; read: number; total: number }
  | { kind: "preview"; plan: MergePlan; skippedRecords: number };

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

function looksLikeCsv(text: string): boolean {
  const first = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l !== "");
  if (!first) return false;
  if (/^date\s*,\s*miles$/i.test(first)) return true;
  const parts = first.split(",");
  return parts.length === 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0].trim());
}

function readSlice(file: File, bytes: number): Promise<string> {
  return readFileText(file.slice(0, bytes) as File);
}

function countDays(n: number): string {
  return n === 1 ? "1 day" : `${n} days`;
}

function mb(bytes: number): number {
  return Math.round(bytes / (1024 * 1024));
}

export function Importer({ dailyLog, onImport, onClose, scan = scanHealthExport }: ImporterProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "choose", error: null });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const abortRef = useRef<AbortFlag>({ aborted: false });

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function showError(message: string) {
    setPhase({ kind: "choose", error: message });
  }

  function showPreview(days: DayTotal[], skippedRecords: number) {
    setPhase({ kind: "preview", plan: planMerge(days, dailyLog, todayISO()), skippedRecords });
  }

  async function handleCsv(file: File) {
    if (file.size > MAX_CSV_BYTES) return showError(MESSAGES.csvTooLarge);
    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      return showError(MESSAGES.csvShape);
    }
    if (!looksLikeCsv(text)) return showError(MESSAGES.csvShape);
    const parsed = parseWalksCsv(text);
    if (!parsed.ok) return showError(parsed.message);
    showPreview(parsed.days, 0);
  }

  async function handleXml(file: File) {
    if (file.size > MAX_HEALTH_XML_BYTES) return showError(HEALTH_MESSAGES.tooLarge);
    let head: string;
    try {
      head = await readSlice(file, 64 * 1024);
    } catch {
      return showError(MESSAGES.xmlShape);
    }
    if (!/<\?xml|<HealthData/.test(head)) return showError(MESSAGES.xmlShape);

    const signal: AbortFlag = { aborted: false };
    abortRef.current = signal;
    setPhase({ kind: "scanning", read: 0, total: file.size });
    const result = await scan(
      file,
      (read, total) =>
        setPhase((prev) => (prev.kind === "scanning" ? { kind: "scanning", read, total } : prev)),
      signal,
    );
    if (signal.aborted) {
      setPhase({ kind: "choose", error: null }); // cancelled: back to the chooser
      return;
    }
    if (!result.ok) return showError(result.message);
    showPreview(result.days, result.skippedRecords);
  }

  async function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const ext = extOf(file.name);
    if (ext === "zip") return showError(MESSAGES.zip);
    if (ext === "csv") return handleCsv(file);
    if (ext === "xml") return handleXml(file);
    showError(MESSAGES.unsupported);
  }

  function cancelScan() {
    abortRef.current.aborted = true;
    setPhase({ kind: "choose", error: null });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      abortRef.current.aborted = true;
      onClose();
    }
  }

  return (
    <section className="importer" aria-labelledby="importer-heading" onKeyDown={onKeyDown}>
      <div className="importer-top no-print">
        <button type="button" className="importer-back" onClick={onClose}>
          Back to the trail
        </button>
      </div>

      <h1 id="importer-heading" className="importer-heading" tabIndex={-1} ref={headingRef}>
        Add miles from a file
      </h1>

      {phase.kind === "choose" && (
        <div className="importer-choose">
          <p className="importer-formats">
            Drop a date,miles CSV or an Apple Health export.xml. Everything is read on this device.
          </p>
          <label className="importer-file">
            Choose a file
            <input
              type="file"
              accept=".csv,.xml,text/csv,text/xml,application/xml"
              className="backup-file"
              onChange={(e) => void onFileChosen(e)}
            />
          </label>
          {phase.error && (
            <p className="importer-error" role="alert">
              {phase.error}
            </p>
          )}
        </div>
      )}

      {phase.kind === "scanning" && (
        <div className="importer-scanning" role="status">
          <p>
            Reading your export. {mb(phase.read)} of {mb(phase.total)} MB.
          </p>
          <button type="button" className="importer-cancel" onClick={cancelScan}>
            Cancel
          </button>
        </div>
      )}

      {phase.kind === "preview" && (
        <Preview
          plan={phase.plan}
          skippedRecords={phase.skippedRecords}
          onConfirm={() => onImport(phase.plan.adds)}
          onClose={onClose}
        />
      )}
    </section>
  );
}

function Preview({
  plan,
  skippedRecords,
  onConfirm,
  onClose,
}: {
  plan: MergePlan;
  skippedRecords: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { adds, addedMiles } = plan;
  const skipLines: string[] = [];
  if (plan.skippedExisting > 0)
    skipLines.push(`${countDays(plan.skippedExisting)} you already logged stay as you logged them.`);
  if (plan.skippedFuture > 0)
    skipLines.push(`${countDays(plan.skippedFuture)} were after today and were left out.`);
  if (plan.skippedOverMax > 0)
    skipLines.push(`${countDays(plan.skippedOverMax)} were above 200 miles and were left out.`);
  if (plan.skippedEmpty > 0)
    skipLines.push(`${countDays(plan.skippedEmpty)} had no miles and were left out.`);
  if (skippedRecords > 0)
    skipLines.push(
      `${skippedRecords === 1 ? "1 record was" : `${skippedRecords} records were`} in a form this app does not read.`,
    );

  return (
    <div className="importer-preview">
      {adds.length > 0 ? (
        <p className="importer-adds">
          Add {countDays(adds.length)}, {addedMiles} miles, from {dateline(adds[0].date)} to{" "}
          {dateline(adds[adds.length - 1].date)}.
        </p>
      ) : (
        <p className="importer-adds">These miles are already on your trail.</p>
      )}

      {skipLines.length > 0 && (
        <ul className="importer-skips">
          {skipLines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}

      <div className="importer-preview-actions">
        {adds.length > 0 && (
          <button type="button" className="importer-confirm" onClick={onConfirm}>
            Add these miles
          </button>
        )}
        <button type="button" className="importer-back-preview" onClick={onClose}>
          Back to the trail
        </button>
      </div>
    </div>
  );
}
