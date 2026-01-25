import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] will-change-transform select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        outline: "border border-white/20 bg-white/[0.06] text-foreground hover:bg-white/[0.12] active:bg-white/[0.16] hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        ghost: "text-foreground hover:bg-white/[0.08] active:bg-white/[0.12] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline active:opacity-70",
      },
      size: {
        default: "h-11 px-4 py-2 min-w-[44px]",
        sm: "h-10 rounded-md px-3 min-w-[44px]",
        lg: "h-12 rounded-md px-8 min-w-[44px]",
        icon: "h-11 w-11 min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      haptic('light');
      onClick?.(e);
    }, [onClick]);
    
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        onClick={handleClick}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        {...props} 
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
