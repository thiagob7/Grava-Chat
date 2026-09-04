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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1 rounded px-1 py-0.5 transition hover:bg-surface-3"
          aria-label={t("perfil.etiqueta.escolher")}
        >
          {escolhido ? (
            <ServerTag
              etiqueta={{ guildId: escolhido.id, tag: escolhido.tag!, tagIcon: escolhido.tagIcon ?? null }}
            />
          ) : (
            <span className="flex items-center gap-0.5 text-xs text-ink-faint">
              <Plus size={11} /> tag
            </span>
          )}
          <ChevronDown size={12} className="text-ink-faint" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem onSelect={() => onEscolher(null)}>
          <span className={cn("flex-1 italic", !atual && "text-ink")}>{t("perfil.etiqueta.nenhuma")}</span>
          {!atual && <Check size={14} />}
        </DropdownMenuItem>

        {comEtiqueta.map((guild) => (
          <DropdownMenuItem key={guild.id} onSelect={() => onEscolher(guild.id)}>
            <span className="min-w-0 flex-1 truncate">{guild.name}</span>
            <ServerTag
              etiqueta={{ guildId: guild.id, tag: guild.tag!, tagIcon: guild.tagIcon ?? null }}
            />
            {atual === guild.id && <Check size={14} />}
          </DropdownMenuItem>
        ))}

        {!comEtiqueta.length && (
          <DropdownMenuItem disabled>{t("perfil.etiqueta.semEtiqueta")}</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
