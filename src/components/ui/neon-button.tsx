import React from "react";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";

const buttonVariants = cva(
  "relative group border text-foreground mx-auto text-center rounded-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-blue-500/5 hover:bg-blue-500/0 border-blue-500/20",
        solid:
          "bg-blue-500 hover:bg-blue-600 text-white border-transparent hover:border-foreground/50",
        primary:
          "bg-primary hover:bg-primary/90 text-black border-primary/40 hover:border-primary font-bold shadow-[0_0_24px_rgba(16,185,129,0.2)]",
        ghost:
          "border-transparent bg-transparent hover:border-zinc-600 hover:bg-white/10",
        nav: "mx-0 w-full justify-start gap-3 px-4 py-3 rounded-xl border-transparent bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white font-medium text-sm",
        navActive:
          "mx-0 w-full justify-start gap-3 px-4 py-3 rounded-xl bg-primary/15 border-primary/40 text-primary font-medium text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)]",
        navTab:
          "mx-0 w-full text-left px-4 py-3 rounded-xl border-transparent text-white/50 hover:bg-white/5 hover:text-white text-sm font-normal",
        navTabActive:
          "mx-0 w-full text-left px-4 py-3 rounded-xl bg-primary/20 border-primary/40 text-primary text-sm font-bold shadow-[0_0_16px_rgba(16,185,129,0.2)]",
        success:
          "mx-0 w-full bg-primary/15 border-primary/40 text-primary font-bold hover:bg-primary/25 hover:border-primary/60",
        destructive:
          "mx-0 w-full bg-red-500/10 border-red-500/30 text-red-400 font-bold hover:bg-red-500/20 hover:border-red-500/50",
      },
      size: {
        default: "px-7 py-1.5",
        sm: "px-4 py-0.5",
        lg: "px-10 py-2.5",
        nav: "px-4 py-3",
        block: "px-4 py-3",
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
  /** Keep neon lines visible (active nav / selected tab) */
  active?: boolean;
  neonColor?: "primary" | "destructive";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      neon = true,
      active = false,
      neonColor = "primary",
      size,
      variant,
      children,
      ...props
    },
    ref
  ) => {
    const glowVia =
      neonColor === "destructive" ? "via-red-500" : "via-primary";

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        data-active={active || undefined}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-px w-3/4 mx-auto bg-gradient-to-r from-transparent to-transparent hidden",
            glowVia,
            neon && "block",
            active
              ? "opacity-80"
              : "opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          )}
        />
        {children}
        <span
          className={cn(
            "pointer-events-none absolute inset-x-0 -bottom-px h-px w-3/4 mx-auto bg-gradient-to-r from-transparent to-transparent hidden",
            glowVia,
            neon && "block",
            active
              ? "opacity-50"
              : "opacity-0 group-hover:opacity-50 transition-opacity duration-500"
          )}
        />
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
