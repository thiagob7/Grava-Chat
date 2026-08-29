import React, { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { ehDesktop } from "~/lib/desktop";
import { useConexaoStore } from "~/stores/conexao-store";
import { cn } from "~/lib/utils";

/*
  Quanto tempo de queda antes de avisar.

  Uma reconexão que dura meio segundo não é notícia — é o socket fazendo o
  trabalho dele. Avisar de cada piscada treina a pessoa a ignorar o aviso,
  e aí ele não serve mais pra queda de verdade.
*/
const SILENCIO_MS = 1_500;

/// Quanto tempo o "de volta" fica na tela antes de sumir sozinho.
const ALIVIO_MS = 2_500;

type Fase = "oculto" | "caiu" | "voltou";

/*
  A faixa de "reconectando", que faltava.

  A queda nunca derrubou o app — o socket.io sempre reconectou sozinho. O que
  não existia era alguém CONTANDO isso: sem aviso, uma queda de dez segundos é
  indistinguível de um app travado, e a pessoa fica clicando em coisa que não
  responde. Deliberadamente uma faixa, e não uma tela cheia: dá pra continuar
  lendo a conversa enquanto a conexão volta.
*/
export const EstadoDaConexao: React.FC = () => {
  const { conectado, caiuEm, tentativas, jaConectou } = useConexaoStore();
  const [fase, setFase] = useState<Fase>("oculto");

  useEffect(() => {
    /// Antes da primeira conexão quem manda na tela é o Splash; a faixa só
    /// fala de conexão PERDIDA.
    if (!jaConectou) return;

    if (conectado) {
      setFase((atual) => (atual === "caiu" ? "voltou" : "oculto"));
      return;
    }

    if (caiuEm === null) return;

    /// Caiu de novo antes do alívio sumir: some com o verde na hora, senão a
    /// tela diz "conectado" durante uma queda.
    setFase((atual) => (atual === "voltou" ? "oculto" : atual));

    const relogio = setTimeout(
      () => setFase("caiu"),
      Math.max(0, SILENCIO_MS - (Date.now() - caiuEm)),
    );

    return () => clearTimeout(relogio);
  }, [conectado, caiuEm, jaConectou]);

  /*
    O temporizador do alívio mora num efeito só dele, olhando a própria fase.

    Junto com o efeito de cima ele se matava sozinho: a mudança de fase
    disparava a limpeza do `setTimeout` antes de ele correr, e o "conectado de
    novo" ficava na tela pra sempre. Só apareceu rodando de verdade.
  */
  useEffect(() => {
    if (fase !== "voltou") return;

    const relogio = setTimeout(() => setFase("oculto"), ALIVIO_MS);
    return () => clearTimeout(relogio);
  }, [fase]);

  if (fase === "oculto") return null;

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none fixed inset-x-0 z-50 flex justify-center",
        /// abaixo da faixa de título do aplicativo, que tem 32px
        ehDesktop() ? "top-10" : "top-3",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg",
          fase === "voltou" ? "bg-online text-white" : "bg-amber-500 text-black",
        )}
      >
        {fase === "voltou" ? (
          <>
            <Check size={14} /> Conectado de novo
          </>
        ) : (
          <>
            <Loader2 size={14} className="animate-spin" />
            Reconectando
            {tentativas > 1 && ` · tentativa ${tentativas}`}
          </>
        )}
      </span>
    </div>
  );
};
