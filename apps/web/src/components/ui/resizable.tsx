import React, { useEffect, useRef, useState } from "react";

import { THEME_APPLIED } from "~/features/configuracoes/lib/evento-de-tema";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

type Edge = "left" | "right";

interface Options {
  initial: number;
  min: number;
  max: number;
  edge: Edge;
  token?: string;
}

const storageKey = (name: string) => `gravae:largura:${name}`;
const heightKey = (name: string) => `gravae:altura:${name}`;

function measure(token: string | undefined, initial: number) {
  if (!token) return initial;

  try {
    const ruler = document.createElement("div");
    ruler.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:var(${token})`;
    document.body.appendChild(ruler);

    const measured = ruler.getBoundingClientRect().width;
    ruler.remove();

    return measured > 0 ? measured : initial;
  } catch {
    return initial;
  }
}

function stored(name: string) {
  try {
    const saved = Number(localStorage.getItem(storageKey(name)));
    return Number.isFinite(saved) && saved > 0 ? saved : null;
  } catch {
    return null;
  }
}

export function useResizableWidth(name: string, { initial, min, max, edge, token }: Options) {
  const [wanted, setWanted] = useState(() => measure(token, initial));

  const floorWidth = Math.min(min, wanted);
  const ceilWidth = Math.max(max, wanted);
  const clamp = (value: number) => Math.min(ceilWidth, Math.max(floorWidth, value));

  const [width, setWidth] = useState(() => stored(name) ?? wanted);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    if (!token) return;

    const remeasure = () => {
      const target = measure(token, initial);
      setWanted(target);

      if (stored(name) === null) setWidth(target);
    };

    remeasure();
    window.addEventListener(THEME_APPLIED, remeasure);

    return () => window.removeEventListener(THEME_APPLIED, remeasure);
  }, [name, token, initial]);

  useEffect(() => {
    if (!token || stored(name) === null) return;

    const root = document.documentElement;
    root.style.setProperty(token, `${Math.round(width)}px`);

    return () => {
      root.style.removeProperty(token);
    };
  }, [name, token, width]);

  const store = (value: number) => {
    try {
      localStorage.setItem(storageKey(name), String(value));
    } catch {
    }
  };

  const props = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { x: e.clientX, width };
      setDragging(true);
    },

    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!start.current) return;

      const delta = e.clientX - start.current.x;
      setWidth(clamp(start.current.width + (edge === "right" ? delta : -delta)));
    },

    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!start.current) return;

      e.currentTarget.releasePointerCapture(e.pointerId);
      start.current = null;
      setDragging(false);
      store(width);
    },

    onDoubleClick: () => {
      setWidth(initial);
      store(initial);
    },

    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.key === "ArrowLeft" ? -16 : e.key === "ArrowRight" ? 16 : 0;
      if (!step) return;

      e.preventDefault();
      const next = clamp(width + (edge === "right" ? step : -step));
      setWidth(next);
      store(next);
    },
  };

  return { width, dragging, handle: props, bounds: { min: floorWidth, max: ceilWidth } };
}

export const WidthHandle: React.FC<
  {
    edge: Edge;
    dragging: boolean;
    width: number;
    bounds: { min: number; max: number };
  } & React.ComponentProps<"div">
> = ({ edge, dragging, width, bounds, className, ...props }) => {
  const { t } = useTranslation();

  return (
    <div data-gc="ui.resizable.div"
      role="separator"
      aria-orientation="vertical"
      aria-label={t("comum.janela.ajustarLargura")}
      aria-valuenow={Math.round(width)}
      aria-valuemin={bounds.min}
      aria-valuemax={bounds.max}
      tabIndex={0}
      className={cn(
        "group/alca absolute inset-y-0 z-40 w-2 cursor-col-resize",
        edge === "right" ? "-right-1" : "-left-1",
        className,
      )}
      {...props}
    >
      <span data-gc="ui.resizable.span"
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full transition-all duration-150",
          dragging
            ? "w-0.5 bg-ink-faint/45"
            : "w-px bg-transparent group-hover/alca:w-0.5 group-hover/alca:bg-ink-faint/30 group-focus-visible/alca:w-0.5 group-focus-visible/alca:bg-ink-faint/45",
        )}
      />
    </div>
  );
};

export function useResizableHeight(
  name: string,
  { initial, min, max }: { initial: number; min: number; max: number },
) {
  const kept = (() => {
    try {
      const saved = Number(localStorage.getItem(heightKey(name)));
      return Number.isFinite(saved) && saved > 0 ? saved : null;
    } catch {
      return null;
    }
  })();

  const clamp = (value: number) => Math.min(max, Math.max(min, value));

  const [height, setHeight] = useState(() => clamp(kept ?? initial));
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ y: number; height: number } | null>(null);

  const keep = (value: number) => {
    try {
      localStorage.setItem(heightKey(name), String(value));
    } catch {}
  };

  const handle = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { y: e.clientY, height };
      setDragging(true);
    },

    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!start.current) return;
      setHeight(clamp(start.current.height - (e.clientY - start.current.y)));
    },

    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!start.current) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      start.current = null;
      setDragging(false);
      keep(height);
    },

    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.key === "ArrowUp" ? 16 : e.key === "ArrowDown" ? -16 : 0;
      if (!step) return;

      e.preventDefault();
      const next = clamp(height + step);
      setHeight(next);
      keep(next);
    },
  };

  return { height, dragging, handle, bounds: { min, max } };
}

export const HeightHandle: React.FC<
  { dragging: boolean; height: number; bounds: { min: number; max: number } } & React.ComponentProps<"div">
> = ({ dragging, height, bounds, className, ...props }) => {
  const { t } = useTranslation();

  return (
    <div data-gc="ui.resizable.div--2"
      role="separator"
      aria-orientation="horizontal"
      aria-label={t("comum.janela.ajustarAltura")}
      aria-valuenow={Math.round(height)}
      aria-valuemin={bounds.min}
      aria-valuemax={bounds.max}
      tabIndex={0}
      className={cn("group/alca absolute inset-x-0 -top-1 z-40 h-2 cursor-row-resize", className)}
      {...props}
    >
      <span data-gc="ui.resizable.span--2"
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full transition-all duration-150",
          dragging
            ? "h-0.5 bg-ink-faint/45"
            : "h-px bg-transparent group-hover/alca:h-0.5 group-hover/alca:bg-ink-faint/30 group-focus-visible/alca:h-0.5 group-focus-visible/alca:bg-ink-faint/45",
        )}
      />
    </div>
  );
};
