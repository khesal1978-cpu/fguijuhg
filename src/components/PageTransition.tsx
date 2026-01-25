import { memo, ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
}

// Ultra-smooth 60fps page transition - GPU accelerated
const pageTransition = {
  type: "tween" as const,
  duration: 0.12, // Faster for snappier feel
  ease: "easeOut" as const,
};

// Use forwardRef to fix React warnings with AnimatedRoutes
export const PageTransition = memo(forwardRef<HTMLDivElement, PageTransitionProps>(
  function PageTransition({ children }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={pageTransition}
        className="w-full h-full will-change-[opacity] transform-gpu"
        style={{ 
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {children}
      </motion.div>
    );
  }
));

// Slide from right (for forward navigation)
export const SlideInPage = memo(forwardRef<HTMLDivElement, PageTransitionProps>(
  function SlideInPage({ children }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={pageTransition}
        className="w-full h-full will-change-[opacity,transform] transform-gpu"
        style={{ 
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {children}
      </motion.div>
    );
  }
));

// Scale up (for modal-like pages)
export const ScaleInPage = memo(forwardRef<HTMLDivElement, PageTransitionProps>(
  function ScaleInPage({ children }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={pageTransition}
        className="w-full h-full will-change-[opacity,transform] transform-gpu"
        style={{ 
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {children}
      </motion.div>
    );
  }
));
