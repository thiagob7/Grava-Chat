import React, { useEffect } from "react";
import { Type } from "lucide-react";
import { FONTES_DE_NOME, type FonteDeNome } from "@gravae/shared";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tooltip } from "~/components/ui/tooltip";
import { FONTES } from "~/lib/cosmeticos/catalogo";
import { carregarTodasAsFontes, familiaDaFonte } from "~/lib/cosmeticos/fontes";
import { cn } from "~/lib/utils";

const CHAVE = "gravae:fonte-da-mensagem";

export function lerFonteSalva(): FonteDeNome {
  try {
    const salva = localStorage.getItem(CHAVE);
    return FONTES_DE_NOME.includes(salva as FonteDeNome) ? (salva as FonteDeNome) : "padrao";
  } catch {
    return "padrao";
  }
}

export function guardarFonte(fonte: FonteDeNome) {
  try {
    localStorage.setItem(CHAVE, fonte);
  } catch {
    /* modo privado: a escolha vale só nesta aba */
  }
}

export const IconeDeFonte: React.FC<{ size: number }> = ({ size }) => (
  <Type size={size * 1.25} strokeWidth={1.6} />
);

interface SeletorDeFonteProps {
  fonte: FonteDeNome;
  onEscolher: (fonte: FonteDeNome) => void;
  disabled?: boolean;
}

export const SeletorDeFonte: React.FC<SeletorDeFonteProps> = ({
  fonte,
  onEscolher,
  disabled,
}) => {
  useEffect(() => carregarTodasAsFontes(), []);

  const rotulo = FONTES.find((f) => f.id === fonte)?.rotulo ?? "Padrão";

  return (
    <DropdownMenu>
      <Tooltip label={`Fonte da mensagem — ${rotulo}`}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            aria-label="Fonte da mensagem"
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded transition disabled:cursor-not-allowed disabled:opacity-50",
              fonte === "padrao" ? "text-ink-faint hover:text-ink" : "text-brand",
            )}
          >
            <IconeDeFonte size={20} />
          </button>
        </DropdownMenuTrigger>
      </Tooltip>

      <DropdownMenuContent
        side="top"
        align="end"
        className="min-w-44"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {FONTES.map((opcao) => (
          <DropdownMenuItem
            key={opcao.id}
            onSelect={() => onEscolher(opcao.id)}
            className={cn("text-base", opcao.id === fonte && "text-brand")}
            style={{ fontFamily: familiaDaFonte(opcao.id) ?? undefined }}
          >
            {opcao.rotulo}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
