import React from "react";
import { ArrowClockwise, DownloadSimple } from "@phosphor-icons/react";

import { Tooltip } from "~/components/ui/tooltip";
import { ehDesktop } from "~/lib/desktop";
import { useAtualizacao } from "~/hooks/use-atualizacao";
import { useConfiguracoes } from "~/stores/configuracoes";
import { cn } from "~/lib/utils";

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
          estado?.erro && pronta ? "text-danger" : "text-online",
          baixando && "animate-pulse",
        )}
      >
        {pronta || instalando ? (
          <ArrowClockwise size={20} weight="bold" className={cn(instalando && "animate-spin")} />
        ) : (
          <DownloadSimple size={20} weight="bold" />
        )}

        {pronta && (
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-online" />
        )}
      </button>
    </Tooltip>
  );
};
