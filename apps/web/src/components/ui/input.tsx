import * as React from "react";

import { cn } from "~/lib/utils";

export const Input = ({ className, ...props }: React.ComponentProps<"input">) => (
  <input
    className={cn(
      "w-full rounded bg-surface-0 px-3 py-2.5 text-sm text-ink outline-none ring-brand/60 transition placeholder:text-ink-faint focus:ring-2",
      className,
    )}
    {...props}
  />
);

export const Label = ({ className, ...props }: React.ComponentProps<"label">) => (
  <label
    className={cn("mb-1.5 block text-xs font-semibold uppercase text-ink-muted", className)}
    {...props}
  />
);
