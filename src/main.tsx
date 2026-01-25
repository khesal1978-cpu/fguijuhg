import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Performance: Register error boundary for production
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Native app behaviors
const setupNativeApp = () => {
  // Disable context menu (long press menu)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable text selection on non-input elements
  document.addEventListener('selectstart', (e) => {
    const target = e.target as HTMLElement;
    if (!['INPUT', 'TEXTAREA'].includes(target.tagName) && 
        !target.isContentEditable) {
      e.preventDefault();
    }
  });

  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // Prevent pinch zoom
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });

  // Handle iOS status bar taps (scroll to top)
  window.addEventListener('scroll', () => {
    if (window.scrollY < 0) {
      window.scrollTo(0, 0);
    }
  });
};

// Initialize native behaviors
setupNativeApp();

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
