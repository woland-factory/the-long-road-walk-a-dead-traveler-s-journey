import { ErrorBoundary } from "./ErrorBoundary";
import { Trail } from "./trail/Trail";
import { muirPack } from "./packs/muir";

export function App() {
  return (
    <ErrorBoundary>
      <Trail pack={muirPack} />
    </ErrorBoundary>
  );
}
