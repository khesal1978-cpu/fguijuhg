import { memo, ReactNode, useCallback, useState } from 'react';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[];
  initialSnap?: number;
}

export const BottomSheet = memo(function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const dragControls = useDragControls();

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Fast swipe down = close
    if (velocity > 500) {
      haptic('light');
      onClose();
      return;
    }

    // Slow drag - snap to nearest point
    const viewportHeight = window.innerHeight;
    const currentHeight = viewportHeight * snapPoints[currentSnap];
    const newHeight = currentHeight - offset;
    const newPercentage = newHeight / viewportHeight;

    // Find nearest snap point
    let nearestIndex = 0;
    let minDistance = Math.abs(snapPoints[0] - newPercentage);

    snapPoints.forEach((point, index) => {
      const distance = Math.abs(point - newPercentage);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    // If dragged below minimum, close
    if (newPercentage < snapPoints[0] * 0.5) {
      haptic('light');
      onClose();
    } else {
      setCurrentSnap(nearestIndex);
      haptic('selection');
    }
  }, [currentSnap, snapPoints, onClose]);

  const sheetHeight = `${snapPoints[currentSnap] * 100}%`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '90vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0, height: sheetHeight }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            {/* Handle */}
            <div 
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="size-5 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-safe">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

// Swipeable list item
interface SwipeableItemProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  threshold?: number;
}

export const SwipeableItem = memo(function SwipeableItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 100,
}: SwipeableItemProps) {
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > threshold || velocity > 500) {
      if (onSwipeRight) {
        haptic('medium');
        onSwipeRight();
      }
      setIsRevealed('right');
    } else if (offset < -threshold || velocity < -500) {
      if (onSwipeLeft) {
        haptic('medium');
        onSwipeLeft();
      }
      setIsRevealed('left');
    } else {
      setIsRevealed(null);
    }
  }, [threshold, onSwipeLeft, onSwipeRight]);

  return (
    <div className="relative overflow-hidden">
      {/* Left action background */}
      {leftAction && (
        <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-start pl-4 bg-success">
          {leftAction}
        </div>
      )}

      {/* Right action background */}
      {rightAction && (
        <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-4 bg-destructive">
          {rightAction}
        </div>
      )}

      {/* Content */}
      <motion.div
        className="relative bg-card z-10"
        drag="x"
        dragConstraints={{ left: rightAction ? -100 : 0, right: leftAction ? 100 : 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ x: isRevealed === 'left' ? -80 : isRevealed === 'right' ? 80 : 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </div>
  );
});
