import React from "react";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";

const NEON_LINE_TOP =
  "absolute inset-x-0 top-0 h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent";
const NEON_LINE_BOTTOM =
  "absolute inset-x-0 -bottom-px h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-blue-600 to-transparent";

const buttonVariants = cva(
  "relative group border text-foreground mx-auto text-center rounded-full transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-blue-500/5 border-blue-500/20 text-zinc-200",
        solid:
          "bg-blue-600 hover:bg-blue-500 text-white border-transparent font-semibold shadow-[0_0_20px_rgba(37,99,235,0.35)]",
        ghost:
          "border-transparent bg-transparent text-zinc-300 hover:border-zinc-600 hover:bg-white/10",
        nav: "mx-0 w-full flex items-center justify-start gap-3 rounded-xl border border-transparent bg-zinc-800/70 text-zinc-400 font-medium text-sm hover:bg-zinc-800",
        navActive:
          "mx-0 w-full flex items-center justify-start gap-3 rounded-xl border border-blue-500/45 bg-blue-950/50 text-blue-400 font-medium text-sm",
        navTab:
          "mx-0 w-full text-left rounded-xl border border-transparent bg-zinc-800/70 text-zinc-400 text-sm hover:bg-zinc-800",
        navTabActive:
          "mx-0 w-full text-left rounded-xl border border-blue-500/45 bg-blue-950/50 text-blue-400 text-sm font-semibold",
        success:
          "mx-0 w-full rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-400 font-bold",
        destructive:
          "mx-0 w-full rounded-xl border border-red-500/35 bg-red-500/10 text-red-400 font-bold",
      },
      size: {
        default: "px-7 py-1.5",
        sm: "px-4 py-1",
        lg: "px-10 py-3",
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
  /** Show top/bottom neon lines */
  neon?: boolean;
  /** Lines always visible (selected nav tab) — not only on hover */
  active?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, neon = true, active = false, size, variant, children, ...props },
    ref
  ) => {
    const showNeon = neon && (active || variant === "navActive" || variant === "navTabActive");

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {showNeon && (
          <>
            <span
              className={cn(
                NEON_LINE_TOP,
                "pointer-events-none",
                active || variant === "navActive" || variant === "navTabActive"
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              )}
            />
            <span
              className={cn(
                NEON_LINE_BOTTOM,
                "pointer-events-none",
                active || variant === "navActive" || variant === "navTabActive"
                  ? "opacity-40"
                  : "opacity-0 group-hover:opacity-30 transition-opacity duration-500"
              )}
            />
          </>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
