import { memo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
}

// Fast, smooth page transition - minimal delay
const pageTransition = {
  type: "tween" as const,
  duration: 0.15,
  ease: "easeOut" as const,
};

export const PageTransition = memo(function PageTransition({ 
  children 
}: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={pageTransition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
});

// Slide from right (for forward navigation)
export const SlideInPage = memo(function SlideInPage({ 
  children 
}: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={pageTransition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
});

// Scale up (for modal-like pages)
export const ScaleInPage = memo(function ScaleInPage({ 
  children 
}: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={pageTransition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
});
