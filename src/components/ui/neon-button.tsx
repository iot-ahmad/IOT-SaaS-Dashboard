import React from "react";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";

const buttonVariants = cva(
  "relative group border border-border text-foreground mx-auto text-center font-sans tracking-wide transition-all duration-150 rounded-xl cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-muted/40 hover:bg-muted/80 text-foreground border-border",
        solid:
          "bg-primary hover:bg-primary/85 text-primary-foreground border-border shadow-sm",
        ghost:
          "border-transparent bg-transparent hover:border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground",
        secondary:
          "bg-muted/60 hover:bg-muted text-foreground border-border",
        accent:
          "bg-muted/60 hover:bg-muted text-foreground border-border",
      },
      size: {
        default: "px-4 py-2 text-sm",
        sm: "px-3 py-1.5 text-xs",
        lg: "px-6 py-2.5 text-base",
        icon: "p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  neon?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, neon, size, variant, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
