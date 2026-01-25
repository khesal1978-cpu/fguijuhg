import { useEffect, useCallback } from 'react';

// Disable bounce/overscroll on iOS
export function useDisableOverscroll() {
  useEffect(() => {
    const preventOverscroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollable = target.closest('[data-scrollable]');
      
      if (!scrollable) {
        // Allow default for scrollable containers
        const isScrollable = target.scrollHeight > target.clientHeight;
        if (!isScrollable) {
          // Prevent overscroll bounce on non-scrollable elements
          if (e.touches.length === 1) {
            const touch = e.touches[0];
            const startY = touch.clientY;
            
            const moveHandler = (moveEvent: TouchEvent) => {
              const currentY = moveEvent.touches[0].clientY;
              const deltaY = currentY - startY;
              
              // Prevent pull-to-refresh
              if (deltaY > 0 && window.scrollY === 0) {
                moveEvent.preventDefault();
              }
            };
            
            document.addEventListener('touchmove', moveHandler, { passive: false });
            document.addEventListener('touchend', () => {
              document.removeEventListener('touchmove', moveHandler);
            }, { once: true });
          }
        }
      }
    };

    document.addEventListener('touchstart', preventOverscroll, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', preventOverscroll);
    };
  }, []);
}

// Prevent text selection on long press
export function useDisableLongPress() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      input, textarea {
        -webkit-user-select: text;
        user-select: text;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
}

// Prevent context menu on long press
export function useDisableContextMenu() {
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      return false;
    };
    
    document.addEventListener('contextmenu', handler);
    
    return () => {
      document.removeEventListener('contextmenu', handler);
    };
  }, []);
}

// Combined hook for all native gestures
export function useNativeGestures() {
  useDisableOverscroll();
  useDisableLongPress();
  useDisableContextMenu();
}

// Pull to refresh hook (for future use with Capacitor)
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const handleRefresh = useCallback(async () => {
    await onRefresh();
  }, [onRefresh]);

  return { handleRefresh };
}
