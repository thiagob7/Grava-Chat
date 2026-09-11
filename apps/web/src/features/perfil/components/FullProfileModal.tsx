import React, { useState } from "react";
import type { Role } from "@gravae/shared";

import type { ProfileModel } from "~/@core/domain/models/profile-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { useFindCommon } from "~/@core/application/queries/user/use-find-em-comum";
import { colorMoreHigh } from "~/features/perfil/lib/cargo";
import { cn } from "~/lib/utils";
import { avatarColor } from "~/lib/format";
import { currentLanguage, useTranslation } from "~/traducao";
import { flx, flxCls, type Places } from "~/lib/compat-de-tema";

interface FullProfileModalProps {
  open: boolean;
  profile: ProfileModel;
  roleList?: Role[];
  onClose: () => void;
}

type Tab = "geral" | "amigos" | "servidores";

const TrackMask: React.FC<{ id: string; place: Places; cx: number; radius: number }> = ({
  id,
  place,
  cx,
  radius,
}) => (
  <svg data-gc="perfil.full-profile-modal.svg" aria-hidden className={cn(flxCls(place), "absolute size-0")}>
    <mask data-gc="perfil.full-profile-modal.mask" id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
      <rect data-gc="perfil.full-profile-modal.rect" width="100%" height="100%" fill="white" />
      <circle data-gc="perfil.full-profile-modal.circle" cx={cx} cy="100%" r={radius} fill="black" />
    </mask>
  </svg>
);

export const FullProfileModal: React.FC<FullProfileModalProps> = ({
  open,
  profile,
  roleList = [],
  onClose,
}) => {
  const { t } = useTranslation();
  const maskId = React.useId();
  const [tab, setTab] = useState<Tab>("geral");
  const inCommon = useFindCommon(profile.id, tab !== "geral");

  const tabs: { id: Tab; label: string }[] = [
    { id: "geral" as const, label: t("perfil.visaoGeral") },
    ...(profile.mutualFriends > 0
      ? [{ id: "amigos" as const, label: t("perfil.amigosEmComum", { quantidade: profile.mutualFriends }) }]
      : []),
    ...(profile.mutualGuilds > 0
      ? [{ id: "servidores" as const, label: t("perfil.servidoresEmComum", { quantidade: profile.mutualGuilds }) }]
      : []),
  ];

  return (
  <Dialog data-gc="perfil.full-profile-modal.dialog" open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
    <DialogContent data-gc="perfil.full-profile-modal.dialog-content"
      className={cn("max-w-lg overflow-hidden border-2 border-brand p-0", flxCls("completeProfile"), flxCls("profileCompleteContent"))}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <TrackMask data-gc="perfil.full-profile-modal.track-mask" id={maskId} place="trackProfileMask" cx={72} radius={56} />
      <div data-gc="perfil.full-profile-modal.div"
        className="h-28 bg-cover bg-center"
        style={{
          mask: `url(#${maskId})`,
          WebkitMask: `url(#${maskId})`,
          backgroundColor: profile.profile?.bannerColor?.trim() || avatarColor(profile.id),
          ...(profile.profile?.bannerUrl
            ? { backgroundImage: `url(${profile.profile.bannerUrl})` }
            : null),
        }}
      />

      <div data-gc="perfil.full-profile-modal.div--2" {...flx("profileContent", "px-6 pb-6")}>
        <div data-gc="perfil.full-profile-modal.div--3" className="-mt-14 mb-4">
          <Avatar data-gc="perfil.full-profile-modal.avatar"
            id={profile.id}
            name={profile.displayName}
            url={profile.avatarUrl}
            size={96}
            status={profile.status}
            charms={profile.profile}
            animate
            className="rounded-full ring-[6px] ring-surface-3"
          />
        </div>

        <DialogTitle data-gc="perfil.full-profile-modal.dialog-title" className="text-2xl font-bold leading-tight">
          <UserName data-gc="perfil.full-profile-modal.user-name"
            name={profile.displayName}
            profile={profile.profile}
            roleColor={colorMoreHigh(roleList)}
            size="md"
            animate
            background="#27272a"
            isBot={profile.isBot}
            isSystem={profile.system}
          />
        </DialogTitle>
        <DialogDescription data-gc="perfil.full-profile-modal.dialog-description" className="text-base">@{profile.username}</DialogDescription>

        {tabs.length > 1 && (
          <div data-gc="perfil.full-profile-modal.div--4" {...flx("tabsFrame", "mt-4 flex gap-4 border-b border-line")}>
            {tabs.map((item) => (
              <button data-gc="perfil.full-profile-modal.button"
                key={item.id}
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id}
                className={cn(
                  "-mb-px border-b-2 pb-2 text-sm transition",
                  tab === item.id
                    ? "border-brand font-medium text-ink"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {tab !== "geral" && inCommon.isPending && (
          <p data-gc="perfil.full-profile-modal.p" className="py-8 text-center text-sm text-ink-faint">{t("perfil.carregando")}</p>
        )}

        {tab === "amigos" && inCommon.data && (
          <div data-gc="perfil.full-profile-modal.div--5" className="mt-4 space-y-1">
            {inCommon.data.friends.map((friend) => (
              <div data-gc="perfil.full-profile-modal.div--6" key={friend.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover">
                <Avatar data-gc="perfil.full-profile-modal.avatar--2"
                  id={friend.id}
                  name={friend.displayName}
                  url={friend.avatarUrl}
                  size={32}
                  status={friend.status}
                />
                <span data-gc="perfil.full-profile-modal.span" className="min-w-0 flex-1 truncate text-sm font-medium">
                  {friend.displayName}
                </span>
                <span data-gc="perfil.full-profile-modal.span--2" className="shrink-0 text-xs text-ink-faint">@{friend.username}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "servidores" && inCommon.data && (
          <div data-gc="perfil.full-profile-modal.div--7" className="mt-4 space-y-1">
            {inCommon.data.servers.map((server) => (
              <div data-gc="perfil.full-profile-modal.div--8" key={server.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover">
                {server.iconUrl ? (
                  <img data-gc="perfil.full-profile-modal.img" src={server.iconUrl} alt="" className="size-8 rounded-full object-cover" />
                ) : (
                  <span data-gc="perfil.full-profile-modal.span--3" className="flex size-8 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold">
                    {server.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span data-gc="perfil.full-profile-modal.span--4" className="min-w-0 flex-1 truncate text-sm font-medium">{server.name}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "geral" && profile.pronouns && (
          <p data-gc="perfil.full-profile-modal.p--2"
            className={cn("text-sm text-ink-faint", flxCls("pronounsProfile"))}
          >
            {profile.pronouns}
          </p>
        )}

        {tab === "geral" && profile.bio && (
          <Block data-gc="perfil.full-profile-modal.block" title={t("perfil.sobre")}>
            <p data-gc="perfil.full-profile-modal.p--3"
              className={cn("whitespace-pre-wrap text-sm text-ink-muted", flxCls("profileBio"))}
            >
              {profile.bio}
            </p>
          </Block>
        )}

        {tab === "geral" && roleList.length > 0 && (
          <Block data-gc="perfil.full-profile-modal.block--2" title={t("perfil.cargosTitulo")}>
            <div data-gc="perfil.full-profile-modal.div--9" className="flex flex-wrap gap-1.5">
              {roleList.map((role) => (
                <span data-gc="perfil.full-profile-modal.span--5"
                  key={role.id}
                  className={cn(
                    flxCls("roleSeal"),
                    "flex items-center gap-1.5 rounded bg-surface-1 px-2 py-1 text-xs",
                  )}
                >
                  <span data-gc="perfil.full-profile-modal.span--6"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: role.color || "#99aab5" }}
                  />
                  <span data-gc="perfil.full-profile-modal.span--7" className={flxCls("roleName")}>{role.name}</span>
                </span>
              ))}
            </div>
          </Block>
        )}

        {tab === "geral" && (
          <Block data-gc="perfil.full-profile-modal.block--3" title={t("perfil.membroDesde")}>
            <p data-gc="perfil.full-profile-modal.p--4" className="text-sm text-ink-muted">
              {new Intl.DateTimeFormat(currentLanguage(), { dateStyle: "long" }).format(
                new Date(profile.createdAt),
              )}
            </p>
          </Block>
        )}
      </div>
    </DialogContent>
  </Dialog>
  );
};

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section data-gc="perfil.full-profile-modal.section" className="mt-5">
    <h3 data-gc="perfil.full-profile-modal.h3" className="mb-1.5 text-sm font-bold text-ink">{title}</h3>
    {children}
  </section>
);
