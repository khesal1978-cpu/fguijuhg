import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Performance: Register error boundary for production
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Native app behaviors - comprehensive setup
const setupNativeApp = () => {
  // Disable context menu (long press menu)
  document.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement;
    // Allow context menu on inputs for paste functionality
    if (!['INPUT', 'TEXTAREA'].includes(target.tagName)) {
      e.preventDefault();
      return false;
    }
  });

  // Disable text selection on non-input elements
  document.addEventListener('selectstart', (e) => {
    const target = e.target as HTMLElement;
    if (!['INPUT', 'TEXTAREA'].includes(target.tagName) && 
        !target.isContentEditable &&
        !target.closest('.selectable')) {
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

  // Prevent wheel zoom (Ctrl+scroll)
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, { passive: false });

  // Handle keyboard showing/hiding on mobile
  const handleVisualViewport = () => {
    const viewport = window.visualViewport;
    if (viewport) {
      const updateViewport = () => {
        // Adjust for keyboard
        document.documentElement.style.setProperty(
          '--viewport-height',
          `${viewport.height}px`
        );
      };
      viewport.addEventListener('resize', updateViewport);
      updateViewport();
    }
  };
  handleVisualViewport();

  // Prevent iOS elastic scrolling on body
  document.body.addEventListener('touchmove', (e) => {
    if (e.target === document.body) {
      e.preventDefault();
    }
  }, { passive: false });

  // Handle back button for Android (basic implementation)
  window.addEventListener('popstate', () => {
    // This allows native back behavior
    // Custom handling can be added in components
  });

  // Optimize for 60fps scrolling
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Detect if running as standalone app (PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  
  if (isStandalone) {
    document.documentElement.classList.add('standalone');
  }

  // Add touch device class
  if ('ontouchstart' in window) {
    document.documentElement.classList.add('touch-device');
  }
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
    
    // Request idle callback for non-critical tasks
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        // Prefetch other pages for faster navigation
        const links = document.querySelectorAll('link[rel="prefetch"]');
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (href) {
            const prefetch = document.createElement('link');
            prefetch.rel = 'prefetch';
            prefetch.href = href;
            document.head.appendChild(prefetch);
          }
        });
      });
    }
  });
}
