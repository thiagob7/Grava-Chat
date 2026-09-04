import React, { useState } from "react";
import { Search, ShieldOff } from "lucide-react";

import {
  useFindBans,
  useUnbanMember,
} from "~/@core/application/queries/moderation/use-moderation";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { formatTimestamp } from "~/lib/format";
import { useTranslation } from "~/traducao";

export const BansSection: React.FC<{ guildId: string }> = ({ guildId }) => {
  const { t } = useTranslation();
  const { data: bans = [], isLoading } = useFindBans(guildId);
  const desbanir = useUnbanMember(guildId);
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? bans.filter(
        (b) =>
          b.user.displayName.toLowerCase().includes(termo) ||
          b.user.username.toLowerCase().includes(termo),
      )
    : bans;

  return (
    <div className="max-w-2xl pb-10">
      <h2 className="text-xl font-semibold">{t("servidor.banimentos.titulo")}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {t("servidor.banimentos.descricao")}
      </p>

      <div className="mt-4 flex items-center gap-2 rounded bg-surface-0 px-3">
        <Search size={16} className="text-ink-faint" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={t("servidor.banimentos.procurar")}
          className="bg-transparent px-0"
        />
      </div>

      {isLoading && <p className="mt-6 text-sm text-ink-faint">{t("comum.carregando")}</p>}

      {!isLoading && !bans.length && (
        <div className="mt-6 rounded-lg border border-dashed border-line px-6 py-12 text-center">
          <ShieldOff size={28} className="mx-auto text-ink-faint" />
          <p className="mt-3 text-sm font-semibold">{t("servidor.banimentos.vazioTitulo")}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {t("servidor.banimentos.vazio")}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-px">
        {filtrados.map((ban) => (
          <div
            key={ban.user.id}
            className="flex items-center gap-3 border-t border-line px-2 py-3"
          >
            <Avatar
              id={ban.user.id}
              name={ban.user.displayName}
              url={ban.user.avatarUrl}
              size={36}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {ban.user.displayName}
              </p>
              <p className="truncate text-xs text-ink-faint">
                @{ban.user.username}
                {ban.reason ? ` · ${ban.reason}` : ""}
              </p>
            </div>

            <span className="shrink-0 text-xs text-ink-faint">
              {ban.moderator ? `por ${ban.moderator.displayName} · ` : ""}
              {formatTimestamp(ban.createdAt)}
            </span>

            <Button
              variant="surface"
              size="sm"
              disabled={desbanir.isPending}
              onClick={() => desbanir.mutate({ guildId, userId: ban.user.id })}
            >
              {t("servidor.banimentos.desbanir")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
