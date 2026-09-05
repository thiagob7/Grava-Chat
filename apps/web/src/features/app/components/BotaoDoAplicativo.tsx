import React from "react";
import { ArrowClockwise, DownloadSimple } from "@phosphor-icons/react";

import { Tooltip } from "~/components/ui/tooltip";
import { ehDesktop } from "~/lib/desktop";
import { useAtualizacao } from "~/features/app/hooks/use-atualizacao";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { cn } from "~/lib/utils";

export const BotaoDoAplicativo: React.FC = () => {
  const abrirConfiguracoes = useConfiguracoes((s) => s.abrir);
  const { estado, ponte, temNovidade, baixando, pronta, instalando } = useAtualizacao();

  if (!ehDesktop()) {
    return (
      <Tooltip data-gc="app.botao-do-aplicativo.tooltip" label="Baixar o aplicativo">
        <button data-gc="app.botao-do-aplicativo.button"
          onClick={() => abrirConfiguracoes("aplicativo")}
          aria-label="Baixar o aplicativo"
          className="text-online transition hover:brightness-125"
        >
          <DownloadSimple data-gc="app.botao-do-aplicativo.download-simple" size={20} weight="bold" />
        </button>
      </Tooltip>
    );
  }

  if (!ponte || !temNovidade) return null;

  const aoClicar = () => void (pronta ? ponte.instalar() : ponte.baixar());

  return (
    <Tooltip data-gc="app.botao-do-aplicativo.tooltip--2"
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
      <button data-gc="app.botao-do-aplicativo.button.ao-clicar"
        onClick={aoClicar}
        disabled={baixando || instalando}
        aria-label="Atualização do aplicativo"
        className={cn(
          "relative transition hover:brightness-125 disabled:cursor-default",
          estado?.erro && pronta ? "text-danger" : "text-online",
          baixando && "animate-pulse",
        )}
      >
        {pronta || instalando ? (
          <ArrowClockwise data-gc="app.botao-do-aplicativo.arrow-clockwise" size={20} weight="bold" className={cn(instalando && "animate-spin")} />
        ) : (
          <DownloadSimple data-gc="app.botao-do-aplicativo.download-simple--2" size={20} weight="bold" />
        )}

        {pronta && (
          <span data-gc="app.botao-do-aplicativo.span" className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-online" />
        )}
      </button>
    </Tooltip>
  );
};
