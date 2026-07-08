import React from "react";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";

const buttonVariants = cva(
  // Base: sharp corners to match --radius:0, Oxanium font, uppercase tracking
  "relative group border text-foreground mx-auto text-center font-sans tracking-wide transition-all duration-200",
  {
    variants: {
      variant: {
        // Active/selected item: glassy gray
        default:
          "bg-slate-900/[0.06] dark:bg-white/[0.08] hover:bg-slate-900/[0.1] dark:hover:bg-white/[0.12] border-slate-900/10 dark:border-white/10 text-foreground dark:text-foreground backdrop-blur-md",
        // CTA solid button: full crimson fill
        solid:
          "bg-primary hover:bg-primary/85 text-primary-foreground border-transparent shadow-[0_2px_4px_rgba(0,0,0,0.4)]",
        // Subtle ghost: no border until hovered
        ghost:
          "border-transparent bg-transparent hover:border-border hover:bg-card dark:hover:bg-card/60 text-foreground",
        // Secondary/olive accent
        secondary:
          "bg-secondary/15 hover:bg-secondary/25 border-secondary/30 text-secondary dark:text-secondary",
        // Accent / steel-blue
        accent:
          "bg-accent/15 hover:bg-accent/25 border-accent/30 text-accent dark:text-accent",
      },
      size: {
        default: "px-5 py-1.5 text-sm",
        sm: "px-3 py-1 text-xs",
        lg: "px-8 py-2.5 text-base",
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
  ({ className, neon = true, size, variant, children, ...props }, ref) => {
    const isDefault = variant === "default";
    const lineGradient = isDefault
      ? "dark:via-white/30 via-slate-900/20"
      : "dark:via-primary via-primary/90";

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 inset-y-0 bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent hidden",
            lineGradient,
            neon && "block"
          )}
        />
        {children}
        <span
          className={cn(
            "absolute group-hover:opacity-30 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent hidden",
            lineGradient,
            neon && "block"
          )}
        />
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
