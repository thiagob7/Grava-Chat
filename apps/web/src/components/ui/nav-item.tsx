import * as React from "react";

import { cn } from "~/lib/utils";

export interface NavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export const NavItem = ({ active = false, icon, badge, className, children, type = "button", ...props }: NavItemProps) => (
  <button data-gc="ui.nav-item.button"
    type={type}
    aria-current={active || undefined}
    className={cn(
      "flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left text-sm font-medium transition",
      "outline-none focus-visible:ring-2 focus-visible:ring-foco-anel",
      active ? "bg-selecionado text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
      className,
    )}
    {...props}
  >
    {icon && <span data-gc="ui.nav-item.span" className="flex shrink-0 text-ink-faint [&_svg]:size-5">{icon}</span>}
    <span data-gc="ui.nav-item.span--2" className="min-w-0 flex-1 truncate">{children}</span>
    {badge}
  </button>
);

export const CountBadge: React.FC<{ count: number; className?: string }> = ({ count, className }) =>
  count > 0 ? (
    <span data-gc="ui.nav-item.span--3" className={cn("shrink-0 rounded-full bg-danger px-1.5 text-xs font-semibold text-sobre-marca", className)}>
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

export interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const TabButton = ({ active = false, className, type = "button", ...props }: TabButtonProps) => (
  <button data-gc="ui.nav-item.button--2"
    type={type}
    role="tab"
    aria-selected={active}
    className={cn(
      "shrink-0 rounded-md px-2 py-1 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-foco-anel",
      active ? "bg-selecionado text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
      className,
    )}
    {...props}
  />
);
