import { useState, useRef, useCallback, ReactNode, memo } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Loader2 } from 'lucide-react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  
  // Transform for the pull indicator
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const indicatorOpacity = useTransform(y, [0, threshold * 0.5, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, threshold], [0.5, 1]);
  const indicatorRotate = useTransform(y, [0, threshold], [0, 180]);

  const handlePanStart = useCallback(() => {
    if (disabled || isRefreshing) return;
    
    // Only allow pull if at top
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop <= 0) {
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handlePan = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || isRefreshing || !isPulling) return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) {
      y.set(0);
      return;
    }

    // Only allow downward pull
    if (info.delta.y > 0) {
      // Apply resistance
      const resistance = 0.4;
      const currentY = y.get();
      const newY = Math.min(currentY + info.delta.y * resistance, threshold * 1.5);
      y.set(newY);
      
      // Haptic when crossing threshold
      if (currentY < threshold && newY >= threshold) {
        haptic('medium');
      }
    } else if (info.delta.y < 0 && y.get() > 0) {
      y.set(Math.max(0, y.get() + info.delta.y));
    }
  }, [disabled, isRefreshing, isPulling, y, threshold]);

  const handlePanEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    setIsPulling(false);
    
    const currentY = y.get();
    
    if (currentY >= threshold) {
      // Trigger refresh
      setIsRefreshing(true);
      haptic('success');
      
      // Keep at threshold position while refreshing
      y.set(threshold * 0.6);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        y.set(0);
      }
    } else {
      // Snap back
      y.set(0);
    }
  }, [disabled, isRefreshing, y, threshold, onRefresh]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center"
        style={{
          top: -40,
          y: useTransform(y, [0, threshold], [0, threshold + 20]),
          opacity: indicatorOpacity,
          scale: indicatorScale,
        }}
      >
        <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-lg">
          {isRefreshing ? (
            <Loader2 className="size-5 text-primary animate-spin" />
          ) : (
            <motion.svg
              className="size-5 text-primary"
              style={{ rotate: indicatorRotate }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </motion.svg>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        ref={containerRef}
        className="h-full overflow-y-auto overscroll-none"
        style={{ y }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        data-scrollable="true"
      >
        {children}
      </motion.div>
    </div>
  );
});
