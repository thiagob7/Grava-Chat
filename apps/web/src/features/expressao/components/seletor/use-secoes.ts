import { useCallback, useRef, useState } from "react";

export function useSections(initial: string | null = null) {
  const container = useRef<HTMLDivElement | null>(null);
  const sections = useRef(new Map<string, HTMLElement>());
  const [active, setActive] = useState<string | null>(initial);

  const register = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) sections.current.set(id, el);
      else sections.current.delete(id);
    },
    [],
  );

  const irFor = useCallback((id: string) => {
    const target = sections.current.get(id);
    if (!target || !container.current) return;

    container.current.scrollTop = target.offsetTop;
    setActive(id);
  }, []);

  const onScroll = useCallback(() => {
    const el = container.current;
    if (!el) return;

    const limit = el.scrollTop + 12;
    let current: string | null = null;

    for (const [id, section] of sections.current) {
      if (section.offsetTop <= limit) current = id;
    }

    setActive(current ?? sections.current.keys().next().value ?? null);
  }, []);

  return { container, register, irFor, onScroll, active };
}
