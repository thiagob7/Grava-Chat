import React, { useState } from "react";

import { useFindProfile } from "~/@core/application/queries/user/use-find-profile";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { FullProfileModal } from "~/features/perfil/components/FullProfileModal";
import { idiomaAtual, useTranslation } from "~/traducao";

export const PainelDePerfilDoDm: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useTranslation();
  const { data: perfil, isLoading } = useFindProfile(userId);
  const [completo, setCompleto] = useState(false);

  if (isLoading || !perfil) {
    return <aside data-gc="perfil.painel-de-perfil-do-dm.aside" className="hidden w-64 shrink-0 border-l border-divisor bg-surface-1 lg:block" />;
  }

  return (
    <aside data-gc="perfil.painel-de-perfil-do-dm.aside--2" className="hidden w-64 shrink-0 flex-col overflow-y-auto border-l border-divisor bg-surface-1 lg:flex">
      <div data-gc="perfil.painel-de-perfil-do-dm.div"
        className="h-16 shrink-0 bg-surface-3"
        style={perfil.perfil?.bannerCor ? { backgroundColor: perfil.perfil.bannerCor } : undefined}
      />

      <div data-gc="perfil.painel-de-perfil-do-dm.div--2" className="-mt-8 px-4">
        <Avatar data-gc="perfil.painel-de-perfil-do-dm.avatar"
          id={perfil.id}
          name={perfil.displayName}
          url={perfil.avatarUrl}
          size={64}
          enfeites={perfil.perfil ? undefined : undefined}
        />

        <h2 data-gc="perfil.painel-de-perfil-do-dm.h2" className="mt-2 truncate text-lg font-bold">{perfil.displayName}</h2>
        <p data-gc="perfil.painel-de-perfil-do-dm.p" className="truncate text-sm text-ink-muted">@{perfil.username}</p>

        {perfil.statusPersonalizado?.texto && (
          <p data-gc="perfil.painel-de-perfil-do-dm.p--2" className="mt-2 break-words text-sm text-ink-muted">
            {perfil.statusPersonalizado.emoji} {perfil.statusPersonalizado.texto}
          </p>
        )}

        {perfil.bio && <p data-gc="perfil.painel-de-perfil-do-dm.p--3" className="mt-3 whitespace-pre-wrap break-words text-sm">{perfil.bio}</p>}

        <dl data-gc="perfil.painel-de-perfil-do-dm.dl" className="mt-4 space-y-2 border-t border-divisor pt-3 text-sm">
          <div data-gc="perfil.painel-de-perfil-do-dm.div--3">
            <dt data-gc="perfil.painel-de-perfil-do-dm.dt" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {t("perfil.membroDesde")}
            </dt>
            <dd data-gc="perfil.painel-de-perfil-do-dm.dd" className="mt-0.5">
              {new Date(perfil.createdAt).toLocaleDateString(idiomaAtual(), {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>

          {perfil.mutualFriends > 0 && (
            <div data-gc="perfil.painel-de-perfil-do-dm.div--4" className="text-ink-muted">
              {perfil.mutualFriends} {perfil.mutualFriends === 1 ? "amigo" : "amigos"} em comum
            </div>
          )}

          {perfil.mutualGuilds > 0 && (
            <div data-gc="perfil.painel-de-perfil-do-dm.div--5" className="text-ink-muted">
              {perfil.mutualGuilds} {perfil.mutualGuilds === 1 ? "servidor" : "servidores"} em comum
            </div>
          )}
        </dl>

        <Button data-gc="perfil.painel-de-perfil-do-dm.button" variant="surface" className="mb-4 mt-4 w-full" onClick={() => setCompleto(true)}>
          {t("perfil.verCompleto")}
        </Button>
      </div>

      <FullProfileModal data-gc="perfil.painel-de-perfil-do-dm.full-profile-modal" open={completo} perfil={perfil} onClose={() => setCompleto(false)} />
    </aside>
  );
};
