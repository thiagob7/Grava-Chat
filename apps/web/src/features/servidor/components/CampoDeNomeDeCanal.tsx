import React, { useEffect, useRef } from "react";
import { Smile } from "lucide-react";
import type { FonteDeNome } from "@gravae/shared";

import { SeletorDeEmoji } from "~/features/expressao/components/SeletorDeEmoji";
import { IconeDeFonte } from "~/components/SeletorDeFonte";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tooltip } from "~/components/ui/tooltip";
import { campoNu, grupoDeCampo } from "~/components/ui/input";
import { FONTES } from "~/features/perfil/lib/catalogo";
import { carregarTodasAsFontes, familiaDaFonte } from "~/features/perfil/lib/fontes";
import { cn } from "~/lib/utils";

interface CampoDeNomeDeCanalProps {
  id?: string;
  valor: string;
  onMudar: (valor: string) => void;
  fonte: FonteDeNome;
  onFonte: (fonte: FonteDeNome) => void;
  ehVoz: boolean;
  icone?: React.ReactNode;
  placeholder?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}

export const CampoDeNomeDeCanal: React.FC<CampoDeNomeDeCanalProps> = ({
  id,
  valor,
  onMudar,
  fonte,
  onFonte,
  ehVoz,
  icone,
  placeholder,
  autoFocus,
  onEnter,
}) => {
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => carregarTodasAsFontes(), []);

  const normalizar = (bruto: string) => bruto.replace(/\s+/g, ehVoz ? " " : "-");

  const inserirEmoji = (emoji: string) => {
    const el = campo.current;
    const corte = el?.selectionStart ?? valor.length;
    onMudar(normalizar(valor.slice(0, corte) + emoji + valor.slice(corte)));

    requestAnimationFrame(() => {
      el?.focus();
      const fim = corte + emoji.length;
      el?.setSelectionRange(fim, fim);
    });
  };

  return (
    <div data-gc="servidor.campo-de-nome-de-canal.div" className={grupoDeCampo}>
      {icone}

      <input data-gc="servidor.campo-de-nome-de-canal.input"
        ref={campo}
        id={id}
        value={valor}
        maxLength={48}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onMudar(normalizar(e.target.value))}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        style={{ fontFamily: familiaDaFonte(fonte) ?? undefined }}
        className={campoNu}
      />

      <SeletorDeEmoji data-gc="servidor.campo-de-nome-de-canal.seletor-de-emoji.inserir-emoji" onEscolher={inserirEmoji}>
        <button data-gc="servidor.campo-de-nome-de-canal.button"
          type="button"
          aria-label="Emoji no nome"
          className="flex size-7 shrink-0 items-center justify-center rounded text-ink-faint transition hover:bg-surface-3 hover:text-ink"
        >
          <Smile data-gc="servidor.campo-de-nome-de-canal.smile" size={16} />
        </button>
      </SeletorDeEmoji>

      <DropdownMenu data-gc="servidor.campo-de-nome-de-canal.dropdown-menu">
        <Tooltip data-gc="servidor.campo-de-nome-de-canal.tooltip" label="Fonte do nome">
          <DropdownMenuTrigger data-gc="servidor.campo-de-nome-de-canal.dropdown-menu-trigger" asChild>
            <button data-gc="servidor.campo-de-nome-de-canal.button--2"
              type="button"
              aria-label="Fonte do nome"
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded transition hover:bg-surface-3",
                fonte === "padrao" ? "text-ink-faint hover:text-ink" : "text-brand",
              )}
            >
              <IconeDeFonte data-gc="servidor.campo-de-nome-de-canal.icone-de-fonte" size={16} />
            </button>
          </DropdownMenuTrigger>
        </Tooltip>

        <DropdownMenuContent data-gc="servidor.campo-de-nome-de-canal.dropdown-menu-content" align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
          {FONTES.map((opcao) => (
            <DropdownMenuItem data-gc="servidor.campo-de-nome-de-canal.dropdown-menu-item"
              key={opcao.id}
              onSelect={() => onFonte(opcao.id)}
              className={cn("text-base", opcao.id === fonte && "text-brand")}
              style={{ fontFamily: familiaDaFonte(opcao.id) ?? undefined }}
            >
              {opcao.rotulo}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
