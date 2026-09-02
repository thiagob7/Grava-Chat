import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { SpeakerHigh } from "@phosphor-icons/react";

import type { VozNoServidor } from "@gravae/shared";
import { Avatar } from "~/components/Avatar";

interface DicaDoServidorProps {
  nome: string;
  vozes: VozNoServidor[];
  children: React.ReactNode;
}

/// Quantos rostos cabem antes de virar "+N". Seis já ocupam a largura da dica;
/// além disso o cartão fica mais largo que o próprio trilho.
const ROSTOS = 6;

/*
  A dica de um servidor no trilho — o nome e quem está em chamada lá dentro.

  Era só o nome. Saber que tem gente conversando num servidor que você não
  abriu é justamente a informação que faz alguém entrar, e ela não existia em
  lugar nenhum da tela: a bolinha de não-lido fala de mensagem, não de voz.

  Não usa o `Tooltip` comum porque ele recebe `label: string`. Aqui o conteúdo
  tem estrutura, e espremê-lo numa frase ("3 pessoas em Sala 1, 2 em Sala 2")
  seria pedir pra pessoa LER o que ela reconheceria de relance pelos rostos.
*/
export const DicaDoServidor: React.FC<DicaDoServidorProps> = ({ nome, vozes, children }) => (
  <TooltipPrimitive.Root delayDuration={300}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>

    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side="right"
        sideOffset={8}
        className="z-50 max-w-64 rounded-md border border-line bg-surface-4 px-3 py-2.5 shadow-[0_0.5rem_1rem_rgba(0,0,0,0.22)] data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0"
      >
        <p className="truncate text-sm font-semibold text-ink">{nome}</p>

        {vozes.map((canal) => (
          <div key={canal.channelId} className="mt-2.5">
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <SpeakerHigh size={13} weight="fill" className="shrink-0 text-ink-faint" />
              <span className="truncate">{canal.channelName}</span>
            </p>

            {/*
              Rostos encavalados, e não uma lista de nomes: numa dica que some
              ao tirar o mouse, reconhecer é mais rápido do que ler. O anel da
              cor do fundo é o que separa um rosto do outro na sobreposição.
            */}
            <div className="mt-1.5 flex items-center pl-[3px]">
              {canal.pessoas.slice(0, ROSTOS).map((pessoa) => (
                <div key={pessoa.userId} className="-ml-[3px] rounded-full ring-2 ring-surface-4">
                  <Avatar
                    id={pessoa.userId}
                    name={pessoa.displayName}
                    url={pessoa.avatarUrl}
                    size={22}
                  />
                </div>
              ))}

              {canal.pessoas.length > ROSTOS && (
                <span className="ml-1.5 text-xs tabular-nums text-ink-faint">
                  +{canal.pessoas.length - ROSTOS}
                </span>
              )}
            </div>
          </div>
        ))}

        <TooltipPrimitive.Arrow width={12} height={6} className="fill-surface-4" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
);
