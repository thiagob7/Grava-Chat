"use client";

import { Apple, Globe, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

import { LINK_MAC, LINK_WINDOWS } from "~/lib/release";

const APP = "https://gravae-chat.vercel.app";

/*
  Oferece PRIMEIRO o sistema de quem está lendo.

  Uma fileira com "Windows, macOS, Linux" faz todo mundo procurar o próprio
  nome antes de clicar. Aqui o botão principal já vem com o sistema certo, e os
  outros continuam à mão logo abaixo — quem baixa pra outra máquina não fica
  sem saída.

  A detecção só acontece depois de montar: `navigator` não existe na hora de
  gerar o HTML, e um site estático que tentasse adivinhar isso na build
  entregaria o palpite errado pra metade das visitas.
*/
export const BotoesDeDownload = () => {
  const [sistema, setSistema] = useState<"mac" | "windows" | null>(null);

  useEffect(() => {
    const agente = navigator.userAgent;
    setSistema(/Mac|iPhone|iPad/.test(agente) ? "mac" : /Win/.test(agente) ? "windows" : null);
  }, []);

  const mac = { href: LINK_MAC, rotulo: "Baixar para macOS", icone: <Apple size={16} /> };
  const windows = { href: LINK_WINDOWS, rotulo: "Baixar para Windows", icone: <Monitor size={16} /> };

  const principal = sistema === "windows" ? windows : mac;
  const outro = sistema === "windows" ? mac : windows;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <a
        href={principal.href}
        className="flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        {principal.icone} {principal.rotulo}
      </a>

      <a
        href={APP}
        className="flex items-center gap-2 rounded-lg bg-surface-3 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-surface-4"
      >
        <Globe size={16} /> Abrir no navegador
      </a>

      <a
        href={outro.href}
        className="text-sm text-ink-muted underline-offset-4 transition hover:text-ink hover:underline"
      >
        ou {outro.rotulo.replace("Baixar para ", "")}
      </a>
    </div>
  );
};
