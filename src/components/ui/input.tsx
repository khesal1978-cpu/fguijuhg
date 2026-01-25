import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-base text-foreground",
          // Ring and focus styles
          "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 focus-visible:border-primary/30",
          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder styles
          "placeholder:text-muted-foreground/60",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Native app optimizations - prevent iOS zoom on focus
          "text-[16px] md:text-sm",
          // Touch optimization
          "touch-manipulation",
          // Transition
          "transition-all duration-150",
          className,
        )}
        ref={ref}
        // Prevent iOS zoom
        style={{ fontSize: '16px' }}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
