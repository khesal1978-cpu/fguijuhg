import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Scroll to top on route change
export function useScrollRestoration() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top with native-like behavior
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
}

// Network status hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Could trigger a toast here
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

// Keyboard visibility hook for mobile
export function useKeyboardVisibility() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Use visualViewport API for accurate keyboard detection
    const viewport = window.visualViewport;
    
    if (!viewport) return;

    const handleResize = () => {
      // If viewport height is significantly less than window height, keyboard is open
      const keyboardOpen = viewport.height < window.innerHeight * 0.75;
      setIsKeyboardVisible(keyboardOpen);
    };

    viewport.addEventListener('resize', handleResize);
    
    return () => {
      viewport.removeEventListener('resize', handleResize);
    };
  }, []);

  return isKeyboardVisible;
}

// Back button handler for Android
export function useBackButton(onBack?: () => void) {
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (onBack) {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onBack]);
}

// Prevent iOS zoom on input focus
export function usePreventInputZoom() {
  useEffect(() => {
    // This is handled via CSS now, but we can add JS fallback
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);
}

// App visibility state
export function useAppVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

// Orientation lock detection
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth
      ? 'portrait'
      : 'landscape'
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

// Combined native features hook
export function useNativeApp() {
  useScrollRestoration();
  usePreventInputZoom();
  
  const { isOnline } = useNetworkStatus();
  const isKeyboardVisible = useKeyboardVisibility();
  const isAppVisible = useAppVisibility();
  const orientation = useOrientation();

  return {
    isOnline,
    isKeyboardVisible,
    isAppVisible,
    orientation,
  };
}
