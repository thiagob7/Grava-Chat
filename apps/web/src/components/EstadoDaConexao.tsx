import React, { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Splash } from "~/components/Splash";
import { Button } from "~/components/ui/button";
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

/// Tentativas antes de oferecer o recarregar na mão. O socket tenta a cada
/// poucos segundos; umas cinco falhas já significam "não é uma piscada".
const TENTATIVAS_ATE_OFERECER_RECARGA = 5;

type Fase = "oculto" | "caiu" | "voltou";

/*
  A tela de "reconectando", que faltava.

  A queda nunca derrubou o app — o socket.io sempre reconectou sozinho. O que
  não existia era alguém CONTANDO isso: sem aviso, uma queda de dez segundos é
  indistinguível de um app travado, e a pessoa fica clicando em coisa que não
  responde.

  Tela cheia, com a mesma marca da abertura: sem servidor, quase tudo que se vê
  atrás está velho ou não responde — a mensagem que você digitar não sai, e o
  que os outros mandarem não chega. Tapar é mais honesto que deixar clicar numa
  tela que não faz nada. É o mesmo desenho do Splash de propósito: quem já viu
  isso ao abrir reconhece na hora que o app está esperando o servidor.
*/
export const EstadoDaConexao: React.FC = () => {
  const { conectado, caiuEm, tentativas, jaConectou } = useConexaoStore();
  const [fase, setFase] = useState<Fase>("oculto");

  useEffect(() => {
    /// Antes da primeira conexão quem manda na tela já é o Splash das rotas;
    /// isto aqui só fala de conexão PERDIDA.
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

  if (fase === "voltou")
    return (
      <div
        role="status"
        className={cn(
          "pointer-events-none fixed inset-x-0 z-[110] flex justify-center",
          /// abaixo da faixa de título do aplicativo, que tem 32px
          ehDesktop() ? "top-10" : "top-3",
        )}
      >
        <span className="flex items-center gap-2 rounded-full bg-online px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          <Check size={14} /> Conectado de novo
        </span>
      </div>
    );

  return (
    <div
      role="status"
      /*
        Acima de tudo, inclusive da chuva de super-reação (z-100) e dos modais
        (z-50): uma tela de conexão perdida por baixo de uma janela aberta não
        cobre nada.

        No aplicativo a faixa de título fica de fora: é ela que arrasta a
        janela, e prender a pessoa numa tela cheia sem poder nem mover o app
        seria pior que o problema.
      */
      className={cn(
        "fixed inset-x-0 bottom-0 z-[110] bg-surface-2",
        ehDesktop() ? "top-8" : "top-0",
      )}
    >
      <Splash
        legenda={
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 size={14} className="animate-spin" />
              Reconectando
              {tentativas > 1 && ` · tentativa ${tentativas}`}
            </p>

            <p className="max-w-xs text-xs text-ink-faint">
              A conversa está a salvo no servidor. Isto volta sozinho assim que
              a conexão voltar.
            </p>

            {/*
              A saída manual só aparece depois de um tempo: oferecer "recarregar"
              de cara convida a atrapalhar uma reconexão que ia acontecer sozinha
              em dois segundos.
            */}
            {tentativas >= TENTATIVAS_ATE_OFERECER_RECARGA && (
              <Button variant="surface" size="sm" onClick={() => window.location.reload()}>
                Recarregar
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
};
