import React from "react";
import { GifIcon, ImageIcon, Sticker, Smiley } from "@phosphor-icons/react";

import { Tooltip } from "~/components/ui/tooltip";
import { ATALHOS, escreverCombo } from "~/features/configuracoes/lib/atalhos";
import { cn } from "~/lib/utils";

/*
  Os botões do canto direito da caixa.

  Todos no mesmo quadrado, com o mesmo fundo no hover: em fila, tamanho
  diferente entre eles lê como erro. O que muda de um para o outro é só o
  desenho.
*/
export const BotaoDaCaixa: React.FC<{
  rotulo: string;
  atalho?: string[];
  ativo?: boolean;
  desligado?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ rotulo, atalho, ativo, desligado, onClick, children }) => (
  <Tooltip data-gc="conversa.acoes-da-caixa.tooltip" label={rotulo} atalho={atalho}>
    <button data-gc="conversa.acoes-da-caixa.button.on-click"
      type="button"
      onClick={onClick}
      disabled={desligado}
      aria-label={rotulo}
      aria-pressed={ativo}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md transition",
        "disabled:cursor-not-allowed disabled:opacity-30",
        ativo ? "bg-hover text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
      )}
    >
      {children}
    </button>
  </Tooltip>
);

const atalhoDe = (id: string) => {
  const achado = ATALHOS.find((a) => a.id === id);

  return achado ? escreverCombo(achado.padrao).split(" ") : undefined;
};

interface AcoesDaCaixaProps {
  podeAnexar: boolean;
  aberto: "gifs" | "figurinhas" | "emoji" | null;
  onAbrir: (aba: "gifs" | "figurinhas" | "emoji") => void;
  onAnexar: () => void;
}

export const AcoesDaCaixa: React.FC<AcoesDaCaixaProps> = ({
  podeAnexar,
  aberto,
  onAbrir,
  onAnexar,
}) => (
  <>
    <BotaoDaCaixa data-gc="conversa.acoes-da-caixa.botao-da-caixa" rotulo="GIFs" ativo={aberto === "gifs"} onClick={() => onAbrir("gifs")}>
      <GifIcon data-gc="conversa.acoes-da-caixa.gif-icon" size={20} />
    </BotaoDaCaixa>

    <BotaoDaCaixa data-gc="conversa.acoes-da-caixa.botao-da-caixa.on-anexar" rotulo="Enviar arquivo" desligado={!podeAnexar} onClick={onAnexar}>
      <ImageIcon data-gc="conversa.acoes-da-caixa.image-icon" size={20} />
    </BotaoDaCaixa>

    <BotaoDaCaixa data-gc="conversa.acoes-da-caixa.botao-da-caixa--2"
      rotulo="Figurinhas"
      ativo={aberto === "figurinhas"}
      onClick={() => onAbrir("figurinhas")}
    >
      <Sticker data-gc="conversa.acoes-da-caixa.sticker" size={20} />
    </BotaoDaCaixa>

    <BotaoDaCaixa data-gc="conversa.acoes-da-caixa.botao-da-caixa--3"
      rotulo="Emojis"
      atalho={atalhoDe("expressoes")}
      ativo={aberto === "emoji"}
      onClick={() => onAbrir("emoji")}
    >
      <Smiley data-gc="conversa.acoes-da-caixa.smiley" size={20} />
    </BotaoDaCaixa>
  </>
);
