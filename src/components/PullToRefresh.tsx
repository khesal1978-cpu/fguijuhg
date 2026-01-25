import { useState, useRef, useCallback, ReactNode, memo, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export const PullToRefresh = memo(function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  className = '',
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollableRef = useRef<HTMLElement | null>(null);
  const y = useMotionValue(0);
  const hasTriggeredHaptic = useRef(false);
  
  // Transform for the pull indicator
  const indicatorOpacity = useTransform(y, [0, threshold * 0.3, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, threshold], [0.6, 1]);
  const indicatorRotate = useTransform(y, [0, threshold], [0, 180]);
  const contentY = useTransform(y, (value) => Math.min(value, threshold * 1.2));

  // Find scrollable element
  useEffect(() => {
    const scrollable = containerRef.current?.querySelector('[data-scrollable="true"]');
    scrollableRef.current = scrollable as HTMLElement;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const scrollable = scrollableRef.current;
    const scrollTop = scrollable?.scrollTop || 0;
    
    // Only start tracking if at top of scroll
    if (scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
      currentYRef.current = 0;
      hasTriggeredHaptic.current = false;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const scrollable = scrollableRef.current;
    const scrollTop = scrollable?.scrollTop || 0;
    
    // Only allow pull if at top
    if (scrollTop > 0) {
      if (isPulling) {
        setIsPulling(false);
        y.set(0);
      }
      return;
    }

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;

    // Only allow downward pull
    if (deltaY > 0) {
      if (!isPulling) {
        setIsPulling(true);
      }
      
      // Apply resistance - more resistance as we pull further
      const resistance = 0.5 * (1 - Math.min(deltaY / (threshold * 3), 0.7));
      const pullDistance = Math.min(deltaY * resistance, threshold * 1.5);
      currentYRef.current = pullDistance;
      y.set(pullDistance);
      
      // Haptic when crossing threshold
      if (!hasTriggeredHaptic.current && pullDistance >= threshold) {
        haptic('medium');
        hasTriggeredHaptic.current = true;
      }
      
      // Prevent default scrolling while pulling
      if (pullDistance > 5) {
        e.preventDefault();
      }
    }
  }, [disabled, isRefreshing, isPulling, y, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    const pullDistance = currentYRef.current;
    setIsPulling(false);
    
    if (pullDistance >= threshold) {
      // Trigger refresh
      setIsRefreshing(true);
      haptic('success');
      
      // Animate to loading position
      animate(y, threshold * 0.6, { type: 'spring', stiffness: 400, damping: 30 });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
      }
    } else {
      // Snap back
      animate(y, 0, { type: 'spring', stiffness: 500, damping: 35 });
    }
    
    startYRef.current = 0;
    currentYRef.current = 0;
    hasTriggeredHaptic.current = false;
  }, [disabled, isRefreshing, y, threshold, onRefresh]);

  // Attach touch listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-30 flex items-center justify-center pointer-events-none"
        style={{
          top: 8,
          y: useTransform(y, [0, threshold], [-50, 10]),
          opacity: indicatorOpacity,
          scale: indicatorScale,
        }}
      >
        <div className="w-11 h-11 rounded-full bg-card/95 backdrop-blur-sm border border-border/50 flex items-center justify-center shadow-xl shadow-black/20">
          {isRefreshing ? (
            <Loader2 className="size-5 text-primary animate-spin" />
          ) : (
            <motion.div style={{ rotate: indicatorRotate }}>
              <ArrowDown className="size-5 text-primary" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Content wrapper with pull effect */}
      <motion.div
        className="h-full"
        style={{ y: contentY }}
      >
        {children}
      </motion.div>
    </div>
  );
});
