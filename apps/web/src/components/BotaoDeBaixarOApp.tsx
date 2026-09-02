import React from "react";
import { DownloadSimple } from "@phosphor-icons/react";

import { Tooltip } from "~/components/ui/tooltip";
import { ehDesktop } from "~/lib/desktop";
import { useConfiguracoes } from "~/stores/configuracoes";

/**
 * O convite pra baixar o aplicativo, no fim do cabeçalho.
 *
 * Verde de propósito: é a única coisa ali que não age sobre a conversa aberta,
 * e a cor é o que separa "isto muda o que você está vendo" de "isto te leva
 * pra fora".
 *
 * Some pra quem já está no app instalado — oferecer download a quem acabou de
 * baixar é um botão pra lugar nenhum. O mesmo critério do trilho.
 */
export const BotaoDeBaixarOApp: React.FC = () => {
  const abrirConfiguracoes = useConfiguracoes((s) => s.abrir);

  if (ehDesktop()) return null;

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
};
