import { createRoot } from "react-dom/client";
import App, { ErrorBoundary } from "./app/App";
import "./styles/global.css";
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
