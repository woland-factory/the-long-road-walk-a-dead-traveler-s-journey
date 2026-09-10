import { ErrorBoundary } from "./ErrorBoundary";
import { Trail } from "./trail/Trail";
import { fixturePack } from "./packs/fixturePack";

export function App() {
  return (
    <ErrorBoundary>
      <Trail pack={fixturePack} />
    </ErrorBoundary>
  );
}
