import { useCallback, useRef, useState } from 'react';
import { haptic } from '@/lib/haptics';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number;
  hapticFeedback?: boolean;
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
  hapticFeedback = true,
}: UseLongPressOptions) {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsLongPressing(true);
      if (hapticFeedback) {
        haptic('heavy');
      }
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold, hapticFeedback]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsLongPressing(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!isLongPressRef.current && onClick) {
      onClick();
    }
  }, [onClick]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleClick,
    isLongPressing,
  };
}

// Hook for double tap detection
export function useDoubleTap(
  onDoubleTap: () => void,
  delay = 300
) {
  const lastTapRef = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < delay) {
      onDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onDoubleTap, delay]);

  return { onClick: handleTap };
}

// Hook for pinch gesture detection
export function usePinchGesture(
  onPinch: (scale: number) => void
) {
  const initialDistanceRef = useRef(0);

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistanceRef.current > 0) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistanceRef.current;
      onPinch(scale);
    }
  }, [onPinch]);

  const handleTouchEnd = useCallback(() => {
    initialDistanceRef.current = 0;
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}
