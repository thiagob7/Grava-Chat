import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Minus, X } from "lucide-react";

import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import {
  fitOnScreen,
  storedGeometry,
  storeGeometry,
  type WindowGeometry,
} from "~/lib/window-geometry";

const TITLE_BAR = 36;

interface FloatingWindowProps {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const FloatingWindow: React.FC<FloatingWindowProps> = ({
  id,
  title,
  open,
  onClose,
  children,
}) => {
  const { t } = useTranslation();

  const [geometry, setGeometry] = useState<WindowGeometry>(() => storedGeometry(id));
  const [collapsed, setCollapsed] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const drag = useRef<{ x: number; y: number; base: WindowGeometry } | null>(null);

  useEffect(() => {
    if (!open) return;

    const refit = () => setGeometry((current) => fitOnScreen(current));

    window.addEventListener("resize", refit);
    return () => window.removeEventListener("resize", refit);
  }, [open]);

  if (!open) return null;

  const store = (next: WindowGeometry) => {
    setGeometry(next);
    storeGeometry(id, next);
  };

  const begin = (e: React.PointerEvent<HTMLElement>) => {
    if (maximized) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, base: geometry };
  };

  const finish = (e: React.PointerEvent<HTMLElement>) => {
    if (!drag.current) return;

    e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
    storeGeometry(id, geometry);
  };

  const move = (e: React.PointerEvent<HTMLElement>) => {
    const start = drag.current;
    if (!start) return;

    setGeometry(
      fitOnScreen({
        ...start.base,
        x: start.base.x + (e.clientX - start.x),
        y: start.base.y + (e.clientY - start.y),
      }),
    );
  };

  const resize = (e: React.PointerEvent<HTMLElement>) => {
    const start = drag.current;
    if (!start) return;

    setGeometry(
      fitOnScreen({
        ...start.base,
        width: start.base.width + (e.clientX - start.x),
        height: start.base.height + (e.clientY - start.y),
      }),
    );
  };

  const position = maximized
    ? { left: 8, top: 8, width: window.innerWidth - 16, height: window.innerHeight - 16 }
    : {
        left: geometry.x,
        top: geometry.y,
        width: geometry.width,
        height: collapsed ? TITLE_BAR : geometry.height,
      };

  return (
    <section data-gc="ui.floating-window.section"
      role="dialog"
      aria-label={title}
      style={position}
      className="janela-neutra regiao-sem-arrasto fixed z-40 flex flex-col overflow-hidden rounded-lg border border-line bg-surface-2 shadow-2xl"
    >
      <header data-gc="ui.floating-window.header.begin"
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        onDoubleClick={() => setMaximized((v) => !v)}
        style={{ height: TITLE_BAR, touchAction: "none" }}
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-line bg-surface-1 px-3",
          maximized ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        )}
      >
        <span data-gc="ui.floating-window.span" className="min-w-0 flex-1 truncate text-sm font-medium text-ink-muted">
          {title}
        </span>

        <BarButton data-gc="ui.floating-window.bar-button"
          label={collapsed ? "Voltar ao tamanho" : "Minimizar"}
          onClick={() => setCollapsed((v) => !v)}
        >
          <Minus data-gc="ui.floating-window.minus" size={14} />
        </BarButton>

        <BarButton data-gc="ui.floating-window.bar-button--2"
          label={maximized ? "Restaurar" : "Maximizar"}
          onClick={() => {
            setMaximized((v) => !v);
            setCollapsed(false);
          }}
        >
          <Maximize2 data-gc="ui.floating-window.maximize2" size={13} />
        </BarButton>

        <BarButton data-gc="ui.floating-window.bar-button.on-close" label="Fechar" danger onClick={onClose}>
          <X data-gc="ui.floating-window.x" size={14} />
        </BarButton>
      </header>

      {!collapsed && <div data-gc="ui.floating-window.div" className="flex min-h-0 flex-1">{children}</div>}

      {!collapsed && !maximized && (
        <span data-gc="ui.floating-window.span.begin"
          role="separator"
          aria-label={t("comum.janela.redimensionar")}
          onPointerDown={begin}
          onPointerMove={resize}
          onPointerUp={finish}
          onPointerCancel={finish}
          style={{ touchAction: "none" }}
          className="absolute bottom-0 right-0 size-4 cursor-nwse-resize"
        />
      )}
    </section>
  );
};

const BarButton: React.FC<{
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, danger, onClick, children }) => (
  <button data-gc="ui.floating-window.button.on-click"
    type="button"
    aria-label={label}
    title={label}
    onPointerDown={(e) => e.stopPropagation()}
    onClick={onClick}
    className={cn(
      "flex size-6 shrink-0 items-center justify-center rounded text-ink-faint transition",
      danger ? "hover:bg-danger hover:text-sobre-marca" : "hover:bg-hover hover:text-ink",
    )}
  >
    {children}
  </button>
);
