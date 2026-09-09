import React, { useEffect } from "react";
import { Mic, Send, Trash2 } from "lucide-react";

import { OndaDeVoz } from "~/features/conversa/components/OndaDeVoz";
import { useGravadorDeVoz, type RecadoGravado } from "~/features/conversa/hooks/use-gravador-de-voz";
import { duracaoEscrita, LIMITE_MS } from "~/features/conversa/lib/gravador-de-voz";
import { BotaoDaCaixa } from "~/features/conversa/components/AcoesDaCaixa";
import { cn } from "~/lib/utils";

export const BarraDeGravacao: React.FC<{
  desligado?: boolean;
  onPronto: (recado: RecadoGravado) => void;
  onGravandoMudou?: (gravando: boolean) => void;
}> = ({ desligado, onPronto, onGravandoMudou }) => {
  const { gravando, ms, picos, erro, comecar, parar } = useGravadorDeVoz();

  useEffect(() => onGravandoMudou?.(gravando), [gravando, onGravandoMudou]);

  const encerrar = async (guardar: boolean) => {
    const recado = await parar(guardar);
    if (recado) onPronto(recado);
  };

  if (!gravando) {
    return (
      <BotaoDaCaixa data-gc="conversa.barra-de-gravacao.botao-da-caixa" rotulo="Gravar um recado" desligado={desligado} onClick={() => void comecar()}>
        <Mic data-gc="conversa.barra-de-gravacao.mic" size={20} />
      </BotaoDaCaixa>
    );
  }

  const perto = ms > LIMITE_MS - 15_000;

  return (
    <div data-gc="conversa.barra-de-gravacao.div" className="flex flex-1 items-center gap-3 px-2">
      <button data-gc="conversa.barra-de-gravacao.button"
        type="button"
        onClick={() => void encerrar(false)}
        aria-label="Descartar o recado"
        className="shrink-0 rounded p-1.5 text-ink-faint transition hover:bg-hover hover:text-danger"
      >
        <Trash2 data-gc="conversa.barra-de-gravacao.trash2" size={18} />
      </button>

      <span data-gc="conversa.barra-de-gravacao.span" className="flex size-2 shrink-0 items-center justify-center">
        <span data-gc="conversa.barra-de-gravacao.span--2" className="size-2 animate-pulse rounded-full bg-danger" />
      </span>

      <OndaDeVoz data-gc="conversa.barra-de-gravacao.onda-de-voz" picos={picos} />

      <span data-gc="conversa.barra-de-gravacao.span--3" className={cn("shrink-0 tabular-nums text-xs", perto ? "text-danger" : "text-ink-faint")}>
        {duracaoEscrita(ms)} / {duracaoEscrita(LIMITE_MS)}
      </span>

      <button data-gc="conversa.barra-de-gravacao.button--2"
        type="button"
        onClick={() => void encerrar(true)}
        aria-label="Mandar o recado"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sobre-marca transition hover:brightness-110"
      >
        <Send data-gc="conversa.barra-de-gravacao.send" size={15} />
      </button>

      {erro && <span data-gc="conversa.barra-de-gravacao.span--4" className="shrink-0 text-xs text-danger">{erro}</span>}
    </div>
  );
};
