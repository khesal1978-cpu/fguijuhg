import { useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { haptic } from '@/lib/haptics';

// Navigation order for swipe between pages
const navOrder = ['/', '/games', '/team', '/wallet', '/settings'];

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isHorizontalSwipe.current) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current;

    // Must be primarily horizontal and above threshold
    if (Math.abs(deltaX) < 100 || Math.abs(deltaY) > Math.abs(deltaX) * 0.5) {
      return;
    }

    const currentIndex = navOrder.indexOf(location.pathname);
    if (currentIndex === -1) return;

    if (deltaX > 0 && currentIndex > 0) {
      // Swipe right - go to previous
      haptic('selection');
      navigate(navOrder[currentIndex - 1]);
    } else if (deltaX < 0 && currentIndex < navOrder.length - 1) {
      // Swipe left - go to next
      haptic('selection');
      navigate(navOrder[currentIndex + 1]);
    }
  }, [location.pathname, navigate]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const deltaX = Math.abs(e.touches[0].clientX - startX.current);
    const deltaY = Math.abs(e.touches[0].clientY - startY.current);
    
    // Determine if this is a horizontal swipe
    if (deltaX > 20 && deltaX > deltaY * 1.5) {
      isHorizontalSwipe.current = true;
    }
  }, []);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

// Hook to detect swipe direction
export function useSwipeDetection(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) {
  const startX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX.current;

    if (deltaX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (deltaX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
  }, [threshold, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
