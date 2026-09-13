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
        xs: "rounded-md px-2.5 py-1 text-xs",
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
  loading?: boolean;
}

export const LoadingDots: React.FC<{ className?: string }> = ({ className }) => (
  <span data-gc="ui.button.span" aria-hidden className={cn("inline-flex items-center gap-1", className)}>
    {[0, 150, 300].map((delay) => (
      <span data-gc="ui.button.span--2"
        key={delay}
        className="gc-ponto-digitando size-1.5 rounded-full bg-current"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </span>
);

export const Button = ({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  if (asChild) {
    return (
      <Slot data-gc="ui.button.slot" className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button data-gc="ui.button.button"
      className={cn(buttonVariants({ variant, size }), loading && "relative disabled:cursor-wait disabled:opacity-80", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span data-gc="ui.button.span--3" className="invisible inline-flex items-center gap-2">{children}</span>
          <span data-gc="ui.button.span--4" className="absolute inset-0 flex items-center justify-center">
            <LoadingDots data-gc="ui.button.loading-dots" />
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

const iconButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md transition outline-none focus-visible:ring-2 focus-visible:ring-foco-anel disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        ghost: "text-ink-muted hover:bg-hover hover:text-ink",
        surface: "bg-surface-3 text-ink-muted hover:bg-surface-4 hover:text-ink",
        danger: "text-danger hover:bg-danger hover:text-sobre-marca",
        brand: "text-brand hover:bg-brand/15",
        primary: "bg-brand text-sobre-marca hover:brightness-110",
        soft: "bg-surface-4 text-ink-muted hover:bg-line hover:text-ink",
        softDanger: "bg-surface-4 text-ink-muted hover:bg-danger hover:text-sobre-marca",
      },
      size: {
        xs: "size-6 [&_svg]:size-3.5",
        sm: "size-8 [&_svg]:size-4",
        md: "size-9 [&_svg]:size-5",
      },
      round: {
        true: "rounded-full",
        false: "",
      },
    },
    defaultVariants: { variant: "ghost", size: "sm", round: false },
  },
);

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">,
    VariantProps<typeof iconButtonVariants> {
  label: string;
}

export const IconButton = ({ className, variant, size, round, label, type = "button", ...props }: IconButtonProps) => (
  <button data-gc="ui.button.button--2"
    type={type}
    aria-label={label}
    className={cn(iconButtonVariants({ variant, size, round }), className)}
    {...props}
  />
);

export { buttonVariants, iconButtonVariants };

export const boxButtonClass = cn(
  "gc-icone flex shrink-0 items-center justify-center rounded-md transition",
  "size-[var(--textarea-button-height)] [&>svg]:size-[var(--textarea-button-icon-size)]",
  "disabled:cursor-not-allowed disabled:opacity-30",
);
