import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "~/lib/utils";

export const Breadcrumb = (props: React.ComponentProps<"nav">) => (
  <nav data-gc="ui.breadcrumb.nav" aria-label="breadcrumb" {...props} />
);

export const BreadcrumbList = ({ className, ...props }: React.ComponentProps<"ol">) => (
  <ol data-gc="ui.breadcrumb.ol"
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-ink-faint sm:gap-2.5",
      className,
    )}
    {...props}
  />
);

export const BreadcrumbItem = ({ className, ...props }: React.ComponentProps<"li">) => (
  <li data-gc="ui.breadcrumb.li" className={cn("inline-flex items-center gap-1.5", className)} {...props} />
);

export const BreadcrumbLink = ({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp data-gc="ui.breadcrumb.comp"
      className={cn(
        "rounded transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
        className,
      )}
      {...props}
    />
  );
};

export const BreadcrumbPage = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span data-gc="ui.breadcrumb.span"
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-medium text-ink", className)}
    {...props}
  />
);

export const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li data-gc="ui.breadcrumb.li--2"
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:size-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight data-gc="ui.breadcrumb.chevron-right" />}
  </li>
);

export const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span data-gc="ui.breadcrumb.span--2"
    role="presentation"
    aria-hidden="true"
    className={cn("flex size-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal data-gc="ui.breadcrumb.more-horizontal" className="size-4" />
    <span data-gc="ui.breadcrumb.span--3" className="sr-only">Mais</span>
  </span>
);
