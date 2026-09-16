import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Importer } from "./Importer";
import { MAX_CSV_BYTES } from "./csv";
import { MAX_HEALTH_XML_BYTES, type AbortFlag, type XmlResult } from "./appleHealth";
import type { DailyLogEntry } from "../state/types";

// A real File with an overridden size for the boundary checks (the size-cap
// checks return before any read, so the content never matters).
function sizedFile(name: string, size: number): File {
  const file = new File(["x"], name);
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function csvFile(content: string, name = "walks.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

function xmlFile(content: string, name = "export.xml"): File {
  return new File([content], name, { type: "application/xml" });
}

function renderImporter(
  overrides: Partial<React.ComponentProps<typeof Importer>> = {},
) {
  const props = {
    dailyLog: [] as DailyLogEntry[],
    onImport: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<Importer {...props} />);
  return props;
}

describe("Importer opening surface (AC6.2, AC6.8)", () => {
  it("states the two formats and the on-device promise, with a labelled input", () => {
    renderImporter();
    expect(
      screen.getByText(/Drop a date,miles CSV or an Apple Health export\.xml\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/Everything is read on this device\./)).toBeInTheDocument();
    expect(screen.getByLabelText("Choose a file")).toBeInTheDocument();
  });

  it("moves focus to the view heading on open", () => {
    renderImporter();
    expect(document.activeElement).toBe(
      screen.getByRole("heading", { name: "Add miles from a file" }),
    );
  });
});

describe("boundary rejections change no state (AC6.3)", () => {
  it("rejects a .zip with the unzip message", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { onImport } = renderImporter();
    await user.upload(screen.getByLabelText("Choose a file"), sizedFile("export.zip", 100));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unzip export.zip first, then choose the export.xml inside.",
    );
    expect(onImport).not.toHaveBeenCalled();
  });

  it("rejects an unsupported extension with the formats message", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderImporter();
    await user.upload(screen.getByLabelText("Choose a file"), sizedFile("notes.txt", 100));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose a date,miles CSV or an Apple Health export.xml.",
    );
  });

  it("rejects an over-cap CSV with the size message", async () => {
    const user = userEvent.setup();
    renderImporter();
    await user.upload(screen.getByLabelText("Choose a file"), sizedFile("big.csv", MAX_CSV_BYTES + 1));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That CSV is larger than this app can read.",
    );
  });

  it("rejects an over-cap XML with the size message", async () => {
    const user = userEvent.setup();
    renderImporter();
    await user.upload(screen.getByLabelText("Choose a file"), sizedFile("big.xml", MAX_HEALTH_XML_BYTES + 1));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That export is larger than this app can read.",
    );
  });

  it("rejects a CSV that fails the shape sniff", async () => {
    const user = userEvent.setup();
    renderImporter();
    await user.upload(screen.getByLabelText("Choose a file"), csvFile("hello, world, not a walk log"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This does not look like a date,miles CSV.",
    );
  });

  it("rejects an XML whose head lacks the Apple markers", async () => {
    const user = userEvent.setup();
    renderImporter();
    await user.upload(screen.getByLabelText("Choose a file"), xmlFile("<something><else/></something>"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This does not look like an Apple Health export.",
    );
  });
});

describe("preview and confirm (AC6.4)", () => {
  it("shows the adds line and per-reason skip counts, confirms with the adds", async () => {
    const user = userEvent.setup();
    const dailyLog: DailyLogEntry[] = [{ date: "2024-01-02", miles: 1 }];
    const { onImport } = renderImporter({ dailyLog });

    await user.upload(
      screen.getByLabelText("Choose a file"),
      csvFile("date,miles\n2024-01-01,3\n2024-01-02,4\n2024-01-03,5"),
    );

    expect(
      await screen.findByText("Add 2 days, 8 miles, from January 1, 2024 to January 3, 2024."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("1 day you already logged stay as you logged them."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add these miles" }));
    expect(onImport).toHaveBeenCalledWith([
      { date: "2024-01-01", miles: 3 },
      { date: "2024-01-03", miles: 5 },
    ]);
  });

  it("offers no confirm control when every day is already logged", async () => {
    const user = userEvent.setup();
    const dailyLog: DailyLogEntry[] = [{ date: "2024-01-01", miles: 9 }];
    renderImporter({ dailyLog });

    await user.upload(screen.getByLabelText("Choose a file"), csvFile("2024-01-01,3"));
    expect(await screen.findByText("These miles are already on your trail.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add these miles" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to the trail" })).toBeInTheDocument();
  });
});

describe("scanning progress and cancel (AC6.6)", () => {
  it("shows byte progress with a working Cancel", async () => {
    const user = userEvent.setup();
    const scan = (
      _file: File,
      onProgress: (read: number, total: number) => void,
      _signal: AbortFlag,
    ): Promise<XmlResult> => {
      onProgress(8 * 1024 * 1024, 24 * 1024 * 1024);
      return new Promise(() => {}); // pends; Cancel drives the UI
    };
    renderImporter({ scan });

    await user.upload(screen.getByLabelText("Choose a file"), xmlFile("<?xml version='1.0'?><HealthData/>"));
    expect(await screen.findByText("Reading your export. 8 of 24 MB.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      await screen.findByText(/Drop a date,miles CSV or an Apple Health export\.xml\./),
    ).toBeInTheDocument();
  });

  it("Escape closes the view and aborts a running scan", async () => {
    const user = userEvent.setup();
    let captured: AbortFlag | null = null;
    const scan = (
      _file: File,
      onProgress: (read: number, total: number) => void,
      signal: AbortFlag,
    ): Promise<XmlResult> => {
      captured = signal;
      onProgress(1024 * 1024, 10 * 1024 * 1024);
      return new Promise(() => {});
    };
    const { onClose } = renderImporter({ scan });

    await user.upload(screen.getByLabelText("Choose a file"), xmlFile("<?xml version='1.0'?><HealthData/>"));
    await screen.findByRole("button", { name: "Cancel" });

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
    expect(captured!.aborted).toBe(true);
  });
});
