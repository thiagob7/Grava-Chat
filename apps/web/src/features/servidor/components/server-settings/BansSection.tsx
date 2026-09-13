import { EmptyState } from "~/components/ui/empty-state";
import { Ban } from "lucide-react";
import React, { useState } from "react";
import { Search, ShieldOff } from "lucide-react";

import {
  useFindBans,
  useUnbanMember,
} from "~/@core/application/queries/moderation/use-moderation";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { Input, SearchField } from "~/components/ui/input";
import { formatTimestamp } from "~/lib/format";
import { useTranslation } from "~/traducao";

export const BansSection: React.FC<{ guildId: string }> = ({ guildId }) => {
  const { t } = useTranslation();
  const { data: bans = [], isLoading } = useFindBans(guildId);
  const unban = useUnbanMember(guildId);
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const filtered = term
    ? bans.filter(
        (b) =>
          b.user.displayName.toLowerCase().includes(term) ||
          b.user.username.toLowerCase().includes(term),
      )
    : bans;

  return (
    <div data-gc="servidor.server-settings.bans-section.div" className="max-w-2xl pb-10">
      <h2 data-gc="servidor.server-settings.bans-section.h2" className="text-xl font-semibold">{t("servidor.banimentos.titulo")}</h2>
      <p data-gc="servidor.server-settings.bans-section.p" className="mt-1 text-sm text-ink-muted">
        {t("servidor.banimentos.descricao")}
      </p>

      <SearchField data-gc="servidor.server-settings.bans-section.search-field"
        className="mt-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch("")}
        placeholder={t("servidor.banimentos.procurar")}
      />

      {isLoading && <p data-gc="servidor.server-settings.bans-section.p--2" className="mt-6 text-sm text-ink-faint">{t("comum.carregando")}</p>}

      {!isLoading && !bans.length && (
        <EmptyState data-gc="servidor.server-settings.bans-section.empty-state"
          className="mt-6"
          icon={<Ban data-gc="servidor.server-settings.bans-section.ban" />}
          title={t("servidor.banimentos.vazioTitulo")}
          description={t("servidor.banimentos.vazio")}
        />
      )}

      <div data-gc="servidor.server-settings.bans-section.div--2" className="mt-4 space-y-px">
        {filtered.map((ban) => (
          <div data-gc="servidor.server-settings.bans-section.div--3"
            key={ban.user.id}
            className="flex items-center gap-3 border-t border-line px-2 py-3"
          >
            <Avatar data-gc="servidor.server-settings.bans-section.avatar"
              id={ban.user.id}
              name={ban.user.displayName}
              url={ban.user.avatarUrl}
              size={36}
            />

            <div data-gc="servidor.server-settings.bans-section.div--4" className="min-w-0 flex-1">
              <p data-gc="servidor.server-settings.bans-section.p--3" className="truncate text-sm font-medium">
                {ban.user.displayName}
              </p>
              <p data-gc="servidor.server-settings.bans-section.p--4" className="truncate text-xs text-ink-faint">
                @{ban.user.username}
                {ban.reason ? ` · ${ban.reason}` : ""}
              </p>
            </div>

            <span data-gc="servidor.server-settings.bans-section.span" className="shrink-0 text-xs text-ink-faint">
              {ban.moderator ? `por ${ban.moderator.displayName} · ` : ""}
              {formatTimestamp(ban.createdAt)}
            </span>

            <Button data-gc="servidor.server-settings.bans-section.button"
              variant="surface"
              size="sm"
              disabled={unban.isPending}
              onClick={() => unban.mutate({ guildId, userId: ban.user.id })}
            >
              {t("servidor.banimentos.desbanir")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
