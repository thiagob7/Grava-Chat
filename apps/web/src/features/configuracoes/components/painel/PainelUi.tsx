import React from "react";

import { cn } from "~/lib/utils";

/*
  As peças do painel de administração.

  Cada tela montava o próprio cartão, o próprio título e o próprio aviso, e o
  painel parecia uma colcha: bordas diferentes, alturas que esticavam, títulos
  repetidos. Aqui fica um jeito só de fazer cada coisa.
*/

export type Tone = "ok" | "warn" | "danger" | "neutral" | "brand";

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-online",
  warn: "text-aviso",
  danger: "text-danger",
  neutral: "text-ink-muted",
  brand: "text-brand",
};

const TONE_SOFT: Record<Tone, string> = {
  ok: "bg-online/12 text-online",
  warn: "bg-aviso/12 text-aviso",
  danger: "bg-danger/12 text-danger",
  neutral: "bg-surface-3 text-ink-muted",
  brand: "bg-brand/15 text-brand",
};

const TONE_DOT: Record<Tone, string> = {
  ok: "bg-online",
  warn: "bg-aviso",
  danger: "bg-danger",
  neutral: "bg-ink-faint",
  brand: "bg-brand",
};

export const Panel: React.FC<{
  title?: React.ReactNode;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, description, actions, className, bodyClassName, flush, children }) => (
  <section data-gc="configuracoes.painel.painel-ui.section" className={cn("overflow-hidden rounded-xl border border-line-sutil bg-surface-1", className)}>
    {(title || actions) && (
      <header data-gc="configuracoes.painel.painel-ui.header" className="flex items-center gap-3 border-b border-line-sutil px-4 py-3">
        {icon && <span data-gc="configuracoes.painel.painel-ui.span" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-ink-muted">{icon}</span>}
        <div data-gc="configuracoes.painel.painel-ui.div" className="min-w-0 flex-1">
          {title && <h3 data-gc="configuracoes.painel.painel-ui.h3" className="truncate text-sm font-semibold">{title}</h3>}
          {description && <p data-gc="configuracoes.painel.painel-ui.p" className="truncate text-xs text-ink-faint">{description}</p>}
        </div>
        {actions && <div data-gc="configuracoes.painel.painel-ui.div--2" className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
    )}

    <div data-gc="configuracoes.painel.painel-ui.div--3" className={cn(!flush && "p-4", bodyClassName)}>{children}</div>
  </section>
);

export const StatusPill: React.FC<{ tone: Tone; children: React.ReactNode; dot?: boolean; className?: string }> = ({
  tone,
  children,
  dot = true,
  className,
}) => (
  <span data-gc="configuracoes.painel.painel-ui.span--2" className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", TONE_SOFT[tone], className)}>
    {dot && <span data-gc="configuracoes.painel.painel-ui.span--3" className={cn("size-1.5 rounded-full", TONE_DOT[tone])} />}
    {children}
  </span>
);

export const StatTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: Tone;
  ratio?: number;
  badge?: React.ReactNode;
  /* Dentro de um Panel: um tom acima do cartão, para não virar caixa dentro de caixa. */
  inset?: boolean;
}> = ({ icon, label, value, detail, tone = "neutral", ratio, badge, inset }) => {
  const barTone: Tone = ratio === undefined ? tone : ratio > 0.85 ? "danger" : ratio > 0.6 ? "warn" : "ok";

  return (
    <div data-gc="configuracoes.painel.painel-ui.div--4" className={cn(
        "flex min-w-0 flex-col rounded-xl border border-line-sutil p-4",
        inset ? "bg-surface-2" : "bg-surface-1",
      )}>
      <div data-gc="configuracoes.painel.painel-ui.div--5" className="flex items-center gap-2 text-xs font-medium text-ink-muted">
        <span data-gc="configuracoes.painel.painel-ui.span--4" className={cn("shrink-0", TONE_TEXT[tone === "neutral" ? "neutral" : tone])}>{icon}</span>
        <span data-gc="configuracoes.painel.painel-ui.span--5" className="truncate">{label}</span>
        {badge && <span data-gc="configuracoes.painel.painel-ui.span--6" className="ml-auto">{badge}</span>}
      </div>

      <p data-gc="configuracoes.painel.painel-ui.p--2" className="mt-2 truncate text-2xl font-semibold tabular-nums text-ink">{value}</p>

      {ratio !== undefined && (
        <div data-gc="configuracoes.painel.painel-ui.div--6" className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div data-gc="configuracoes.painel.painel-ui.div--7"
            className={cn("h-full rounded-full transition-all", TONE_DOT[barTone])}
            style={{ width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%` }}
          />
        </div>
      )}

      {detail && <p data-gc="configuracoes.painel.painel-ui.p--3" className="mt-2 line-clamp-2 text-xs text-ink-faint">{detail}</p>}
    </div>
  );
};

export const Heading: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; actions?: React.ReactNode }> = ({
  icon,
  children,
  actions,
}) => (
  <div data-gc="configuracoes.painel.painel-ui.div--8" className="mb-3 flex items-center gap-2">
    <h3 data-gc="configuracoes.painel.painel-ui.h3--2" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {icon}
      {children}
    </h3>
    {actions && <div data-gc="configuracoes.painel.painel-ui.div--9" className="ml-auto flex items-center gap-2">{actions}</div>}
  </div>
);

export const Callout: React.FC<{
  tone: Exclude<Tone, "neutral" | "brand"> | "brand";
  icon: React.ReactNode;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}> = ({ tone, icon, title, children, className }) => (
  <div data-gc="configuracoes.painel.painel-ui.div--10"
    className={cn(
      "flex gap-3 rounded-xl border px-4 py-3",
      tone === "danger" && "border-danger/35 bg-danger/8",
      tone === "warn" && "border-aviso/35 bg-aviso/8",
      tone === "ok" && "border-online/30 bg-online/8",
      tone === "brand" && "border-brand/35 bg-brand/8",
      className,
    )}
  >
    <span data-gc="configuracoes.painel.painel-ui.span--7" className={cn("mt-0.5 shrink-0", TONE_TEXT[tone])}>{icon}</span>
    <div data-gc="configuracoes.painel.painel-ui.div--11" className="min-w-0 text-sm">
      {title && <p data-gc="configuracoes.painel.painel-ui.p--4" className={cn("font-medium", TONE_TEXT[tone])}>{title}</p>}
      {children && <div data-gc="configuracoes.painel.painel-ui.div--12" className={cn("leading-6 text-ink-muted", title && "mt-0.5 text-xs leading-5")}>{children}</div>}
    </div>
  </div>
);

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; detail?: string; className?: string }> = ({
  icon,
  title,
  detail,
  className,
}) => (
  <div data-gc="configuracoes.painel.painel-ui.div--13" className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
    <span data-gc="configuracoes.painel.painel-ui.span--8" className="flex size-12 items-center justify-center rounded-2xl bg-surface-3 text-ink-faint">{icon}</span>
    <div data-gc="configuracoes.painel.painel-ui.div--14">
      <p data-gc="configuracoes.painel.painel-ui.p--5" className="text-sm font-medium">{title}</p>
      {detail && <p data-gc="configuracoes.painel.painel-ui.p--6" className="mt-1 max-w-sm text-xs text-ink-faint">{detail}</p>}
    </div>
  </div>
);

export const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (value: T) => void;
}) => (
  <div data-gc="configuracoes.painel.painel-ui.div--15" className="inline-flex rounded-lg border border-line-sutil bg-surface-1 p-0.5">
    {options.map((option) => (
      <button data-gc="configuracoes.painel.painel-ui.button"
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition",
          value === option.value ? "bg-surface-3 text-ink shadow-sm" : "text-ink-muted hover:text-ink",
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);
