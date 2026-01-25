import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Performance: Register error boundary for production
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Create root with concurrent features
const root = createRoot(rootElement);

// Render app
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Performance: Preload critical assets after initial render
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    // Preload logo
    const logo = new Image();
    logo.src = "/src/assets/pingcaset-logo.png";
  });
}
