import React from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { cn } from "~/lib/utils";

export interface BarShortcut {
  id: string;
  title: string;
  icon: React.ReactNode;
}

interface BarSideProps {
  shortcuts: BarShortcut[];
  active: string | null;
  onIr: (id: string) => void;
}

export const BarSide: React.FC<BarSideProps> = ({ shortcuts, active, onIr }) => {
  const trail = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const nav = trail.current;
    if (!nav || !active) return;

    const target = nav.querySelector<HTMLElement>(`[data-secao="${active}"]`);
    if (!target) return;

    const above = target.offsetTop < nav.scrollTop;
    const below = target.offsetTop + target.offsetHeight > nav.scrollTop + nav.clientHeight;
    if (!above && !below) return;

    nav.scrollTo({
      top: target.offsetTop - nav.clientHeight / 2 + target.offsetHeight / 2,
      behavior: "smooth",
    });
  }, [active]);

  return (
    <nav data-gc="expressao.seletor.pecas.nav"
      ref={trail}
      className="flex w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-surface-0/60 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {shortcuts.map((shortcut) => (
        <button data-gc="expressao.seletor.pecas.button"
          key={shortcut.id}
          data-secao={shortcut.id}
          onClick={() => onIr(shortcut.id)}
          title={shortcut.title}
          aria-label={shortcut.title}
          aria-current={active === shortcut.id}
          className={cn(
            "relative flex size-8 shrink-0 items-center justify-center rounded-lg transition",
            active === shortcut.id
              ? "bg-surface-3 text-ink"
              : "text-ink-faint hover:bg-surface-3/60 hover:text-ink-muted",
          )}
        >
          {shortcut.icon}
        </button>
      ))}
    </nav>
  );
};

export const Footer: React.FC<{
  sample?: React.ReactNode;
  title?: string;
  detail?: string;
  right?: React.ReactNode;
  empty: string;
}> = ({ sample, title, detail, right, empty }) => (
  <footer data-gc="expressao.seletor.pecas.footer" className="flex h-12 shrink-0 items-center gap-2.5 border-t border-line bg-surface-0/60 px-3">
    <span data-gc="expressao.seletor.pecas.span" className="flex size-7 shrink-0 items-center justify-center text-2xl leading-none">
      {sample}
    </span>

    {title ? (
      <span data-gc="expressao.seletor.pecas.span--2" className="min-w-0 flex-1 truncate text-sm">
        <span data-gc="expressao.seletor.pecas.span--3" className="font-semibold text-ink">{title}</span>
        {detail && <span data-gc="expressao.seletor.pecas.span--4" className="ml-1.5 text-ink-faint">{detail}</span>}
      </span>
    ) : (
      <span data-gc="expressao.seletor.pecas.span--5" className="flex-1 truncate text-sm text-ink-faint">{empty}</span>
    )}

    {right && <span data-gc="expressao.seletor.pecas.span--6" className="shrink-0">{right}</span>}
  </footer>
);

export const ServerIcon: React.FC<{
  name: string;
  iconUrl: string | null;
  className?: string;
}> = ({ name, iconUrl, className = "size-6" }) =>
  iconUrl ? (
    <img data-gc="expressao.seletor.pecas.img" src={iconUrl} alt="" className={cn("rounded-full object-cover", className)} />
  ) : (
    <span data-gc="expressao.seletor.pecas.span--7"
      className={cn(
        "flex items-center justify-center rounded-full bg-surface-4 text-10 font-bold uppercase text-ink",
        className,
      )}
    >
      {name.slice(0, 2)}
    </span>
  );

export const Section: React.FC<{
  title: string;
  icon?: React.ReactNode;
  closed?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}> = ({ title, icon, closed = false, onToggle, children }) => (
  <section data-gc="expressao.seletor.pecas.section" className="mb-3">
    <h4 data-gc="expressao.seletor.pecas.h4" className="sticky top-0 z-10 -mx-3 mb-1 bg-surface-1/95 backdrop-blur">
      <button data-gc="expressao.seletor.pecas.button.on-toggle"
        type="button"
        onClick={onToggle}
        disabled={!onToggle}
        aria-expanded={!closed}
        className={cn(
          "flex w-full items-center gap-1.5 px-3 py-1 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint transition",
          onToggle && "hover:text-ink-muted",
        )}
      >
        {icon}
        <span data-gc="expressao.seletor.pecas.span--8" className="min-w-0 truncate">{title}</span>

        {onToggle && (
          <ChevronDown data-gc="expressao.seletor.pecas.chevron-down"
            size={12}
            className={cn("ml-auto shrink-0 transition-transform", closed && "-rotate-90")}
          />
        )}
      </button>
    </h4>

    {!closed && children}
  </section>
);

export const Loading: React.FC = () => (
  <div data-gc="expressao.seletor.pecas.div" className="flex justify-center py-10 text-ink-faint">
    <Loader2 data-gc="expressao.seletor.pecas.loader2" size={20} className="animate-spin" />
  </div>
);

export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p data-gc="expressao.seletor.pecas.p" className="px-6 py-10 text-center text-sm text-ink-faint">{children}</p>
);
