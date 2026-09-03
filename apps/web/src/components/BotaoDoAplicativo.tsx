import React from "react";
import { ArrowClockwise, DownloadSimple } from "@phosphor-icons/react";

import { Tooltip } from "~/components/ui/tooltip";
import { ehDesktop } from "~/lib/desktop";
import { useAtualizacao } from "~/hooks/use-atualizacao";
import { useConfiguracoes } from "~/stores/configuracoes";
import { cn } from "~/lib/utils";

/*
  O botão verde no fim do cabeçalho, que muda de função conforme onde você está.

  No navegador ele convida a baixar o aplicativo. No aplicativo instalado ele
  vira o botão de INSTALAR A ATUALIZAÇÃO — antes ele simplesmente sumia ali, e
  o slot ficava vazio justamente para quem pode atualizar. Quem já baixou não
  precisa de download; precisa da versão nova sem reinstalar na mão.

  Verde nos dois casos, e de propósito: é a única coisa da fileira que não age
  sobre a conversa aberta. A cor separa "isto muda o que você está vendo" de
  "isto mexe no aplicativo".

  Em dia, ele some. Um botão permanente que não faz nada ensina a ignorar o
  lugar — e é justamente esse lugar que precisa ser notado no dia em que houver
  o que instalar.
*/
export const BotaoDoAplicativo: React.FC = () => {
  const abrirConfiguracoes = useConfiguracoes((s) => s.abrir);
  const { estado, ponte, temNovidade, baixando, pronta, instalando } = useAtualizacao();

  if (!ehDesktop()) {
    return (
      <Tooltip label="Baixar o aplicativo">
        <button
          onClick={() => abrirConfiguracoes("aplicativo")}
          aria-label="Baixar o aplicativo"
          className="text-online transition hover:brightness-125"
        >
          <DownloadSimple size={20} weight="bold" />
        </button>
      </Tooltip>
    );
  }

  if (!ponte || !temNovidade) return null;

  /*
    Baixado é INSTALAR; ainda não baixado é BAIXAR.

    O `instalar` do lado de lá não faz nada se a fase não for "pronta" —
    escolher a ação pela fase é o que garante que o botão sempre cumpra o que o
    balão promete. Enquanto instala não há terceira ação: o botão trava, senão
    o clique cairia no `baixar` e a versão seria baixada de novo do zero.
  */
  const aoClicar = () => void (pronta ? ponte.instalar() : ponte.baixar());

  return (
    <Tooltip
      label={
        instalando
          ? `Instalando a versão ${estado?.disponivel}…`
          : estado?.erro && pronta
            ? `${estado.erro} Clique para tentar de novo.`
            : pronta
              ? `Instalar a versão ${estado?.disponivel} e reiniciar`
              : baixando
                ? `Baixando a versão ${estado?.disponivel}…`
                : `Saiu a versão ${estado?.disponivel} — clique para baixar`
      }
    >
      <button
        onClick={aoClicar}
        disabled={baixando || instalando}
        aria-label="Atualização do aplicativo"
        className={cn(
          "relative transition hover:brightness-125 disabled:cursor-default",
          /// o vermelho é do erro que já aconteceu; o verde, do que ainda pode dar certo
          estado?.erro && pronta ? "text-danger" : "text-online",
          baixando && "animate-pulse",
        )}
      >
        {pronta || instalando ? (
          <ArrowClockwise size={20} weight="bold" className={cn(instalando && "animate-spin")} />
        ) : (
          <DownloadSimple size={20} weight="bold" />
        )}

        {/*
          A bolinha só na fase pronta: enquanto baixa, o pulso já diz que tem
          coisa acontecendo, e dois sinais ao mesmo tempo viram barulho.
        */}
        {pronta && (
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-online" />
        )}
      </button>
    </Tooltip>
  );
};
