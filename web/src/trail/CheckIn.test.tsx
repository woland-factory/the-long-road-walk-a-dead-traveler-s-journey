import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckIn } from "./CheckIn";
import { parseMiles } from "./validate";

describe("CheckIn valid submit (AC5.1)", () => {
  it("calls onLog with the parsed miles and clears the field", async () => {
    const user = userEvent.setup();
    const onLog = vi.fn();
    render(<CheckIn onLog={onLog} />);

    await user.type(screen.getByLabelText("Miles walked today"), "4.5");
    await user.click(screen.getByRole("button", { name: "Log miles" }));

    expect(onLog).toHaveBeenCalledTimes(1);
    expect(onLog).toHaveBeenCalledWith(4.5);
    expect(screen.getByLabelText("Miles walked today")).toHaveValue("");
  });
});

describe("CheckIn invalid submit (AC5.4)", () => {
  const invalid = ["", "abc", "-3", "0", "250", "4.567"];

  for (const value of invalid) {
    it(`shows an inline error and does not log for ${JSON.stringify(value)}`, async () => {
      const user = userEvent.setup();
      const onLog = vi.fn();
      render(<CheckIn onLog={onLog} />);

      const input = screen.getByLabelText("Miles walked today");
      if (value !== "") {
        await user.type(input, value);
      }
      await user.click(screen.getByRole("button", { name: "Log miles" }));

      expect(onLog).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  }
});

describe("parseMiles boundary (AC5.4)", () => {
  it("accepts positive numbers up to the cap with at most two decimals", () => {
    expect(parseMiles("3")).toEqual({ ok: true, miles: 3 });
    expect(parseMiles("199.99")).toEqual({ ok: true, miles: 199.99 });
    expect(parseMiles("200")).toEqual({ ok: true, miles: 200 });
  });

  it("rejects empty, non-numeric, negative, zero, over-cap, and over-precise", () => {
    expect(parseMiles("").ok).toBe(false);
    expect(parseMiles("abc").ok).toBe(false);
    expect(parseMiles("-1").ok).toBe(false);
    expect(parseMiles("0").ok).toBe(false);
    expect(parseMiles("201").ok).toBe(false);
    expect(parseMiles("1.234").ok).toBe(false);
  });
});
