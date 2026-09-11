import React, { useState } from "react";

import { useFindProfile } from "~/@core/application/queries/user/use-find-profile";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { FullProfileModal } from "~/features/perfil/components/FullProfileModal";
import { avatarColor } from "~/lib/format";
import { currentLanguage, useTranslation } from "~/traducao";

const Shell: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <aside data-gc="perfil.painel-de-perfil-do-dm.aside" className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-divisor bg-surface-1 lg:flex">
    {children}
  </aside>
);

export const ProfileDmPanel: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useTranslation();
  const { data: profile, isLoading, isError } = useFindProfile(userId);
  const [complete, setComplete] = useState(false);

  if (isError) return null;

  if (isLoading || !profile) {
    return (
      <Shell data-gc="perfil.painel-de-perfil-do-dm.shell">
        <Skeleton data-gc="perfil.painel-de-perfil-do-dm.skeleton" className="h-20 shrink-0 rounded-none" />

        <div data-gc="perfil.painel-de-perfil-do-dm.div" className="-mt-9 px-4">
          <Skeleton data-gc="perfil.painel-de-perfil-do-dm.skeleton--2" className="size-[72px] rounded-full" />
          <Skeleton data-gc="perfil.painel-de-perfil-do-dm.skeleton--3" className="mt-3 h-5 w-2/3 rounded" />
          <Skeleton data-gc="perfil.painel-de-perfil-do-dm.skeleton--4" className="mt-2 h-3 w-1/2 rounded" />
          <Skeleton data-gc="perfil.painel-de-perfil-do-dm.skeleton--5" className="mt-5 h-16 w-full rounded-lg" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell data-gc="perfil.painel-de-perfil-do-dm.shell--2">
      <div data-gc="perfil.painel-de-perfil-do-dm.div--2"
        className="h-20 shrink-0"
        style={{ backgroundColor: profile.profile?.bannerColor?.trim() || avatarColor(profile.id) }}
      />

      <div data-gc="perfil.painel-de-perfil-do-dm.div--3" className="px-4 pb-4">
        <span data-gc="perfil.painel-de-perfil-do-dm.span" className="-mt-9 inline-block rounded-full border-[5px] border-surface-1 bg-surface-1">
          <Avatar data-gc="perfil.painel-de-perfil-do-dm.avatar"
            id={profile.id}
            name={profile.displayName}
            url={profile.avatarUrl}
            size={72}
            status={profile.status}
            charms={profile.profile}
          />
        </span>

        <h2 data-gc="perfil.painel-de-perfil-do-dm.h2" className="mt-2 min-w-0 text-lg font-bold">
          <UserName data-gc="perfil.painel-de-perfil-do-dm.user-name"
            name={profile.displayName}
            profile={profile.profile}
            isBot={profile.isBot}
            isSystem={profile.system}
            className="truncate"
          />
        </h2>

        <p data-gc="perfil.painel-de-perfil-do-dm.p" className="truncate text-sm text-ink-muted">@{profile.username}</p>

        {profile.customStatus?.text && (
          <p data-gc="perfil.painel-de-perfil-do-dm.p--2" className="mt-2 break-words text-sm text-ink-muted">
            {profile.customStatus.emoji} {profile.customStatus.text}
          </p>
        )}

        <div data-gc="perfil.painel-de-perfil-do-dm.div--4" className="mt-4 space-y-4 rounded-lg bg-surface-2 p-3.5">
          {profile.bio && (
            <div data-gc="perfil.painel-de-perfil-do-dm.div--5">
              <p data-gc="perfil.painel-de-perfil-do-dm.p--3" className="text-11 font-semibold uppercase tracking-wide text-ink-faint">
                {t("perfil.sobre")}
              </p>
              <p data-gc="perfil.painel-de-perfil-do-dm.p--4" className="mt-1 whitespace-pre-wrap break-words text-sm">
                {profile.bio}
              </p>
            </div>
          )}

          <div data-gc="perfil.painel-de-perfil-do-dm.div--6">
            <p data-gc="perfil.painel-de-perfil-do-dm.p--5" className="text-11 font-semibold uppercase tracking-wide text-ink-faint">
              {t("perfil.membroDesde")}
            </p>
            <p data-gc="perfil.painel-de-perfil-do-dm.p--6" className="mt-1 text-sm">
              {new Date(profile.createdAt).toLocaleDateString(currentLanguage(), {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {(profile.mutualFriends > 0 || profile.mutualGuilds > 0) && (
            <div data-gc="perfil.painel-de-perfil-do-dm.div--7">
              <div data-gc="perfil.painel-de-perfil-do-dm.div--8" className="mt-1 space-y-0.5 text-sm text-ink-muted">
                {profile.mutualGuilds > 0 && (
                  <p data-gc="perfil.painel-de-perfil-do-dm.p--7">
                    {t("servidor.descoberta.quantosServidoresEmComum", { quantos: profile.mutualGuilds })}
                  </p>
                )}

                {profile.mutualFriends > 0 && (
                  <p data-gc="perfil.painel-de-perfil-do-dm.p--8">
                    {t("perfil.amigosEmComum", { quantidade: profile.mutualFriends })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <Button data-gc="perfil.painel-de-perfil-do-dm.button" variant="surface" className="mt-4 w-full" onClick={() => setComplete(true)}>
          {t("perfil.verCompleto")}
        </Button>
      </div>

      <FullProfileModal data-gc="perfil.painel-de-perfil-do-dm.full-profile-modal" open={complete} profile={profile} onClose={() => setComplete(false)} />
    </Shell>
  );
};
