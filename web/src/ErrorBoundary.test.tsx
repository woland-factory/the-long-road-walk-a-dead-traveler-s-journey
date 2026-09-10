import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): never {
  throw new Error("kaboom-secret-stack-detail");
}

describe("error boundary (AC6.3)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the designed error state with a next step and no stack trace", () => {
    // Silence React's expected error log for this render.
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Your trail paused")).toBeInTheDocument();
    expect(screen.getByText(/Reload to pick it up/)).toBeInTheDocument();
    // The raw error message must not reach the user.
    expect(screen.queryByText(/kaboom-secret-stack-detail/)).not.toBeInTheDocument();
  });
});
