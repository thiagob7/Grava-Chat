import React from "react";
import { Check, ChevronDown, Plus } from "lucide-react";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { ServerTag } from "~/features/perfil/components/ServerTag";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface SeletorDeEtiquetaProps {
  atual: string | null | undefined;
  onEscolher: (guildId: string | null) => void;
}

export const SeletorDeEtiqueta: React.FC<SeletorDeEtiquetaProps> = ({ atual, onEscolher }) => {
  const { t } = useTranslation();
  const { data: guilds } = useFindManyGuilds(true);
  const comEtiqueta = (guilds ?? []).filter((g) => g.tag);

  const escolhido = comEtiqueta.find((g) => g.id === atual);

  return (
    <DropdownMenu data-gc="perfil.cartao.seletor-de-etiqueta.dropdown-menu">
      <DropdownMenuTrigger data-gc="perfil.cartao.seletor-de-etiqueta.dropdown-menu-trigger" asChild>
        <button data-gc="perfil.cartao.seletor-de-etiqueta.button"
          className="flex items-center gap-1 rounded px-1 py-0.5 transition hover:bg-surface-3"
          aria-label={t("perfil.etiqueta.escolher")}
        >
          {escolhido ? (
            <ServerTag data-gc="perfil.cartao.seletor-de-etiqueta.server-tag"
              etiqueta={{ guildId: escolhido.id, tag: escolhido.tag!, tagIcon: escolhido.tagIcon ?? null }}
            />
          ) : (
            <span data-gc="perfil.cartao.seletor-de-etiqueta.span" className="flex items-center gap-0.5 text-xs text-ink-faint">
              <Plus data-gc="perfil.cartao.seletor-de-etiqueta.plus" size={11} /> tag
            </span>
          )}
          <ChevronDown data-gc="perfil.cartao.seletor-de-etiqueta.chevron-down" size={12} className="text-ink-faint" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent data-gc="perfil.cartao.seletor-de-etiqueta.dropdown-menu-content" align="start" className="w-64">
        <DropdownMenuItem data-gc="perfil.cartao.seletor-de-etiqueta.dropdown-menu-item" onSelect={() => onEscolher(null)}>
          <span data-gc="perfil.cartao.seletor-de-etiqueta.span--2" className={cn("flex-1 italic", !atual && "text-ink")}>{t("perfil.etiqueta.nenhuma")}</span>
          {!atual && <Check data-gc="perfil.cartao.seletor-de-etiqueta.check" size={14} />}
        </DropdownMenuItem>

        {comEtiqueta.map((guild) => (
          <DropdownMenuItem data-gc="perfil.cartao.seletor-de-etiqueta.dropdown-menu-item--2" key={guild.id} onSelect={() => onEscolher(guild.id)}>
            <span data-gc="perfil.cartao.seletor-de-etiqueta.span--3" className="min-w-0 flex-1 truncate">{guild.name}</span>
            <ServerTag data-gc="perfil.cartao.seletor-de-etiqueta.server-tag--2"
              etiqueta={{ guildId: guild.id, tag: guild.tag!, tagIcon: guild.tagIcon ?? null }}
            />
            {atual === guild.id && <Check data-gc="perfil.cartao.seletor-de-etiqueta.check--2" size={14} />}
          </DropdownMenuItem>
        ))}

        {!comEtiqueta.length && (
          <DropdownMenuItem data-gc="perfil.cartao.seletor-de-etiqueta.dropdown-menu-item--3" disabled>{t("perfil.etiqueta.semEtiqueta")}</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
