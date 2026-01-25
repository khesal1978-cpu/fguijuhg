import { useState, useCallback, memo, ReactNode, MouseEvent, TouchEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TouchRippleProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  color?: string;
}

export const TouchRipple = memo(function TouchRipple({
  children,
  className = '',
  disabled = false,
  color = 'rgba(255, 255, 255, 0.2)',
}: TouchRippleProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  const createRipple = useCallback((event: MouseEvent | TouchEvent) => {
    if (disabled) return;

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    let x: number, y: number;
    
    if ('touches' in event) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    const size = Math.max(rect.width, rect.height) * 2;
    const id = Date.now();

    setRipples(prev => [...prev, { id, x, y, size }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  }, [disabled]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseDown={createRipple}
      onTouchStart={createRipple}
    >
      {children}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

// Simple ripple button wrapper
interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const RippleButton = memo(function RippleButton({
  children,
  onClick,
  className = '',
  disabled = false,
}: RippleButtonProps) {
  return (
    <TouchRipple className={className} disabled={disabled}>
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full h-full"
      >
        {children}
      </button>
    </TouchRipple>
  );
});
