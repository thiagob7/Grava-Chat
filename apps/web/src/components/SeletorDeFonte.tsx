import React, { useEffect } from "react";
import { TextAa } from "@phosphor-icons/react";
import { FONTES_DE_NOME, type FonteDeNome } from "@gravae/shared";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tooltip } from "~/components/ui/tooltip";
import { FONTES } from "~/features/perfil/lib/catalogo";
import { carregarTodasAsFontes, familiaDaFonte } from "~/features/perfil/lib/fontes";
import { cn } from "~/lib/utils";
import { classeDoBotaoDaCaixa } from "~/components/ui/button";

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

/// O "Aa" do Phosphor, e não o "T" do lucide: na fila da caixa ele é o único
/// vizinho dos outros quatro, que são todos Phosphor — e o T destoava.
export const IconeDeFonte: React.FC<{ size: number }> = ({ size }) => (
  <TextAa data-gc="seletor-de-fonte.text-aa" size={size} />
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
    <DropdownMenu data-gc="seletor-de-fonte.dropdown-menu">
      <Tooltip data-gc="seletor-de-fonte.tooltip" label={`Fonte da mensagem — ${rotulo}`}>
        <DropdownMenuTrigger data-gc="seletor-de-fonte.dropdown-menu-trigger" asChild disabled={disabled}>
          <button data-gc="seletor-de-fonte.button"
            aria-label="Fonte da mensagem"
            className={cn(
              classeDoBotaoDaCaixa,
              fonte === "padrao"
                ? "text-ink-muted hover:bg-hover hover:text-ink"
                : "text-brand hover:bg-hover",
            )}
          >
            <IconeDeFonte data-gc="seletor-de-fonte.icone-de-fonte" size={20} />
          </button>
        </DropdownMenuTrigger>
      </Tooltip>

      <DropdownMenuContent data-gc="seletor-de-fonte.dropdown-menu-content"
        side="top"
        align="end"
        className="min-w-44"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {FONTES.map((opcao) => (
          <DropdownMenuItem data-gc="seletor-de-fonte.dropdown-menu-item"
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
