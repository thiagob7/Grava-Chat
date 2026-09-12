import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";

const buttonVariants = cva(
  cn(
    flxCls("button"),
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foco-anel disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        primary: cn("bg-brand text-sobre-marca hover:brightness-110", flxCls("buttonPrimary")),
        success: "bg-online text-sobre-marca hover:brightness-110",
        danger: cn("bg-danger text-sobre-marca hover:brightness-110", flxCls("dangerButton")),
        surface: cn(
          "bg-surface-3 text-ink-muted hover:bg-surface-4 hover:text-ink",
          flxCls("secondaryButton"),
        ),
        outline: cn(
          "border border-line bg-surface-4 text-ink hover:bg-[color-mix(in_srgb,var(--color-surface-4)_94%,var(--color-ink)_6%)]",
          flxCls("buttonInverted"),
        ),
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

export const boxButtonClass = cn(
  "gc-icone flex shrink-0 items-center justify-center rounded-md transition",
  "size-[var(--textarea-button-height)] [&>svg]:size-[var(--textarea-button-icon-size)]",
  "disabled:cursor-not-allowed disabled:opacity-30",
);
