import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "./observability/sentry";
import { ErrorState } from "./trail/states";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Top-level boundary: reports render failures to Sentry (when active) and
// shows the designed error state instead of a blank screen or a stack trace.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error);
    // Non-PII breadcrumb only; the component stack is developer context.
    if (import.meta.env.DEV) {
      console.error("Trail render error", info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="page">
          <section className="card">
            <ErrorState onRetry={() => window.location.reload()} />
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
