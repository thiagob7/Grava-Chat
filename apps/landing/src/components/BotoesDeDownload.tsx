"use client";

import { Apple, Globe, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

import { LINK_MAC, LINK_WINDOWS } from "~/lib/release";

const APP = "https://gravae-chat.vercel.app";

export const DownloadButtons = () => {
  const [system, setSystem] = useState<"mac" | "windows" | null>(null);

  useEffect(() => {
    const agent = navigator.userAgent;
    setSystem(/Mac|iPhone|iPad/.test(agent) ? "mac" : /Win/.test(agent) ? "windows" : null);
  }, []);

  const mac = { href: LINK_MAC, label: "Baixar para macOS", icon: <Apple size={16} /> };
  const windows = { href: LINK_WINDOWS, label: "Baixar para Windows", icon: <Monitor size={16} /> };

  const principal = system === "windows" ? windows : mac;
  const other = system === "windows" ? mac : windows;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <a
        href={principal.href}
        className="flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        {principal.icon} {principal.label}
      </a>

      <a
        href={APP}
        className="flex items-center gap-2 rounded-lg bg-surface-3 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-surface-4"
      >
        <Globe size={16} /> Abrir no navegador
      </a>

      <a
        href={other.href}
        className="text-sm text-ink-muted underline-offset-4 transition hover:text-ink hover:underline"
      >
        ou {other.label.replace("Baixar para ", "")}
      </a>
    </div>
  );
};
