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
    return <aside className="hidden w-64 shrink-0 border-l border-divisor bg-surface-1 lg:block" />;
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-l border-divisor bg-surface-1 lg:flex">
      <div
        className="h-16 shrink-0 bg-surface-3"
        style={perfil.perfil?.bannerCor ? { backgroundColor: perfil.perfil.bannerCor } : undefined}
      />

      <div className="-mt-8 px-4">
        <Avatar
          id={perfil.id}
          name={perfil.displayName}
          url={perfil.avatarUrl}
          size={64}
          enfeites={perfil.perfil ? undefined : undefined}
        />

        <h2 className="mt-2 truncate text-lg font-bold">{perfil.displayName}</h2>
        <p className="truncate text-sm text-ink-muted">@{perfil.username}</p>

        {perfil.statusPersonalizado?.texto && (
          <p className="mt-2 break-words text-sm text-ink-muted">
            {perfil.statusPersonalizado.emoji} {perfil.statusPersonalizado.texto}
          </p>
        )}

        {perfil.bio && <p className="mt-3 whitespace-pre-wrap break-words text-sm">{perfil.bio}</p>}

        <dl className="mt-4 space-y-2 border-t border-divisor pt-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {t("perfil.membroDesde")}
            </dt>
            <dd className="mt-0.5">
              {new Date(perfil.createdAt).toLocaleDateString(idiomaAtual(), {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>

          {perfil.mutualFriends > 0 && (
            <div className="text-ink-muted">
              {perfil.mutualFriends} {perfil.mutualFriends === 1 ? "amigo" : "amigos"} em comum
            </div>
          )}

          {perfil.mutualGuilds > 0 && (
            <div className="text-ink-muted">
              {perfil.mutualGuilds} {perfil.mutualGuilds === 1 ? "servidor" : "servidores"} em comum
            </div>
          )}
        </dl>

        <Button variant="surface" className="mb-4 mt-4 w-full" onClick={() => setCompleto(true)}>
          {t("perfil.verCompleto")}
        </Button>
      </div>

      <FullProfileModal open={completo} perfil={perfil} onClose={() => setCompleto(false)} />
    </aside>
  );
};
