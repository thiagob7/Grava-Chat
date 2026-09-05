import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-fluxer";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand text-ink hover:bg-brand-hover",
        success: "bg-online text-white hover:brightness-110",
        danger: "bg-danger text-white hover:brightness-110",
        surface: cn(
          "bg-surface-3 text-ink-muted hover:bg-surface-4 hover:text-ink",
          flxCls("botaoSecundario"),
        ),
        outline:
          "border border-line bg-surface-4 text-ink hover:bg-[color-mix(in_srgb,var(--color-surface-4)_94%,var(--color-ink)_6%)]",
        ghost: "text-ink-muted hover:bg-surface-3 hover:text-ink",
        link: "text-brand hover:underline",
      },
      size: {
        sm: "min-h-[2.125rem] min-w-14 px-2.5 py-1.5 text-13",
        md: "px-4 py-2.5 text-sm",
        lg: "px-5 py-3 text-sm",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return <Comp data-gc="ui.button.comp" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
};

export { buttonVariants };
