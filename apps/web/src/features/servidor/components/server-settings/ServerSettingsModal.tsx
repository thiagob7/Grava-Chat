import React, { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  AudioLines,
  Award,
  Ban,
  Compass,
  Globe,
  IdCard,
  Link2,
  ScrollText,
  Search,
  Shield,
  ShieldAlert,
  Smile,
  Sticker,
  Sparkles,
  Tag,
  Trash2,
  Users,
  Webhook,
  X,
} from "lucide-react";
import type { GuildMember, Permission } from "@gravae/shared";

import type { GuildDetailModel } from "~/@core/domain/models/guild-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { ErrorBoundary } from "~/features/app/components/ErrorBoundary";
import { Input } from "~/components/ui/input";
import { DeleteGuildSection } from "~/features/servidor/components/server-settings/DeleteGuildSection";
import { InvitesSection } from "~/features/servidor/components/server-settings/InvitesSection";
import { MembersSection } from "~/features/servidor/components/server-settings/MembersSection";
import { IntegrationsSection } from "~/features/servidor/components/server-settings/IntegrationsSection";
import { AuditLogSection } from "~/features/servidor/components/server-settings/AuditLogSection";
import { AutoModSection } from "~/features/servidor/components/server-settings/AutoModSection";
import { CommunitySection } from "~/features/servidor/components/server-settings/ComunidadeSection";
import { BansSection } from "~/features/servidor/components/server-settings/BansSection";
import { BadgesSection } from "~/features/servidor/components/server-settings/EmblemasSection";
import { DiscoverySection } from "~/features/servidor/components/server-settings/DescobertaSection";
import { EngagementSection } from "~/features/servidor/components/server-settings/EngagementSection";
import {
  EmojiSection,
  SoundboardSection,
  StickersSection,
} from "~/features/servidor/components/server-settings/ExpressionsSections";
import { RolesSection } from "~/features/servidor/components/server-settings/RolesSection";
import { ServerTagSection } from "~/features/servidor/components/server-settings/ServerTagSection";
import { ServerProfileSection } from "~/features/servidor/components/server-settings/ServerProfileSection";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export type Section =
  | "profile"
  | "tag"
  | "engagement"
  | "explore"
  | "emoji"
  | "stickers"
  | "sounds"
  | "badges"
  | "members"
  | "roles"
  | "invites"
  | "integrations"
  | "audit"
  | "bans"
  | "automod"
  | "community"
  | "doDelete";

type Icon = React.ComponentType<{ size?: number; className?: string }>;

const GROUPS: { title: string | null; items: Section[] }[] = [
  { title: null, items: ["profile", "tag", "engagement", "explore"] },
  { title: "servidor.abas.expressoes", items: ["emoji", "stickers", "sounds", "badges"] },
  { title: "servidor.abas.pessoas", items: ["members", "roles", "invites"] },
  { title: "servidor.abas.apps", items: ["integrations"] },
  { title: "servidor.abas.moderacao", items: ["audit", "bans", "automod"] },
  { title: "servidor.abas.comunidade", items: ["community"] },
];

const LABELS: Record<Section, string> = {
  profile: "servidor.perfil.titulo",
  tag: "servidor.etiqueta.titulo",
  engagement: "servidor.engajamento.titulo",
  explore: "servidor.explorar.titulo",
  emoji: "comum.emoji",
  stickers: "servidor.expressoes.figurinhas",
  sounds: "servidor.expressoes.sons",
  badges: "servidor.emblemas.titulo",
  members: "servidor.auditoria.filtroMembros",
  roles: "servidor.cargos.titulo",
  invites: "servidor.convites.titulo",
  integrations: "servidor.integracoes.titulo",
  audit: "servidor.auditoria.titulo",
  bans: "servidor.abas.banimentos",
  automod: "servidor.automod.titulo",
  community: "servidor.comunidade.titulo",
  doDelete: "servidor.excluir.titulo",
};

const ICONS: Record<Section, Icon> = {
  profile: IdCard,
  tag: Tag,
  engagement: Sparkles,
  explore: Compass,
  emoji: Smile,
  stickers: Sticker,
  sounds: AudioLines,
  badges: Award,
  members: Users,
  roles: Shield,
  invites: Link2,
  integrations: Webhook,
  audit: ScrollText,
  bans: Ban,
  automod: ShieldAlert,
  community: Globe,
  doDelete: Trash2,
};

const WIDTHS: Partial<Record<Section, string>> = {
  members: "max-w-[max(48rem,min(96%,72rem))]",
  roles: "max-w-[max(48rem,min(96%,72rem))]",
  audit: "max-w-[max(48rem,min(96%,68rem))]",
  emoji: "max-w-[max(44rem,min(94%,64rem))]",
  stickers: "max-w-[max(44rem,min(94%,64rem))]",
  sounds: "max-w-[max(44rem,min(94%,64rem))]",
};

const DEFAULT_WIDTH = "max-w-[max(40rem,min(92%,54rem))]";

interface ServerSettingsModalProps {
  open: boolean;
  onClose: () => void;
  detail: GuildDetailModel;
  members: GuildMember[];
  currentUserId: string | undefined;
  isOwner: boolean;
  canManage: boolean;
  canManageRoles: boolean;
  canManageWebhooks: boolean;
  permissions: Set<string>;
  initialSection?: Section | null;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  open,
  onClose,
  detail,
  members,
  currentUserId,
  isOwner,
  canManage,
  canManageRoles,
  canManageWebhooks,
  permissions,
  initialSection,
}) => {
  const { t } = useTranslation();
  const can = (p: string) =>
    permissions.has("ADMINISTRATOR") || permissions.has(p);
  const [section, setSection] = useState<Section>(canManage ? "profile" : "members");
  const [contentIsOpen, setContentIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setContentIsOpen(false);
      setSearch("");
    }
    if (open && initialSection) setSection(initialSection);
  }, [open, initialSection]);

  const myPosition = isOwner
    ? Number.POSITIVE_INFINITY
    : (() => {
        const mine =
          detail.members.find((m) => m.user.id === currentUserId)?.roleIds ??
          [];
        return detail.roles
          .filter((r) => mine.includes(r.id))
          .reduce((larger, r) => Math.max(larger, r.position), 0);
      })();

  const visible: Record<Section, boolean> = {
    profile: canManage,
    tag: canManage,
    engagement: canManage,
    explore: canManage,
    emoji: true,
    stickers: true,
    sounds: true,
    badges: true,
    members: true,
    roles: canManageRoles,
    invites: true,
    integrations: canManageWebhooks,
    audit: can("VIEW_AUDIT_LOG"),
    bans: can("BAN_MEMBERS"),
    automod: canManage,
    community: canManage,
    doDelete: isOwner,
  };

  const term = search.trim().toLowerCase();

  const groups = useMemo(
    () =>
      GROUPS.map((group) => ({
        title: group.title,
        items: group.items.filter(
          (id) => visible[id] && (!term || t(LABELS[id]).toLowerCase().includes(term)),
        ),
      })).filter((group) => group.items.length),
    [term, t, canManage, canManageRoles, canManageWebhooks, isOwner, permissions],
  );

  const pick = (id: Section) => {
    setSection(id);
    setContentIsOpen(true);
  };

  const deleteVisible =
    visible.doDelete && (!term || t(LABELS.doDelete).toLowerCase().includes(term));

  return (
    <DialogPrimitive.Root data-gc="servidor.server-settings.server-settings-modal.dialog-primitiveroot"
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay data-gc="servidor.server-settings.server-settings-modal.dialog-primitiveoverlay" className="fixed inset-0 z-50 bg-veu" />
        <DialogPrimitive.Content data-gc="servidor.server-settings.server-settings-modal.dialog-primitivecontent"
          className={cn(
            "regiao-sem-arrasto fixed inset-0 z-50 m-auto flex h-full w-full overflow-hidden bg-surface-1 shadow-2xl outline-none md:h-[min(60rem,92vh)] md:w-[min(87.5rem,94vw)] md:rounded-xl",
            flxCls("settingsWindow"),
          )}
          aria-label={t("servidor.titulo")}
        >
          <DialogPrimitive.Title data-gc="servidor.server-settings.server-settings-modal.dialog-primitivetitle" className="sr-only">
            {t("servidor.titulo")}
          </DialogPrimitive.Title>

          <nav data-gc="servidor.server-settings.server-settings-modal.nav" {...flx("settingsSide", cn(
              "w-full shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface-4 px-3 pb-0 pt-4",
              "md:flex md:w-[max(15.75rem,min(24svw,20rem))]",
              contentIsOpen ? "hidden" : "flex",
              flxCls("settingsSideInternal"),
            ))} {...flxAttr("settingsSideInternal")}>
            <div data-gc="servidor.server-settings.server-settings-modal.div" className="flex items-center justify-between gap-2 md:hidden">
              <span data-gc="servidor.server-settings.server-settings-modal.span" className="text-base font-semibold">
                {t("servidor.titulo")}
              </span>

              <DialogPrimitive.Close
                aria-label={t("comum.fechar")}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-faint transition hover:bg-hover hover:text-ink"
              >
                <X data-gc="servidor.server-settings.server-settings-modal.x" size={20} />
              </DialogPrimitive.Close>
            </div>

            <div data-gc="servidor.server-settings.server-settings-modal.div--2" className="flex items-center gap-2.5 px-2 py-1">
              <Avatar data-gc="servidor.server-settings.server-settings-modal.avatar"
                id={detail.guild.id}
                name={detail.guild.name}
                url={detail.guild.iconUrl}
                size={36}
              />
              <span data-gc="servidor.server-settings.server-settings-modal.span--2" className="min-w-0 flex-1">
                <span data-gc="servidor.server-settings.server-settings-modal.span--3" className="block truncate text-sm font-semibold">
                  {detail.guild.name}
                </span>
                <span data-gc="servidor.server-settings.server-settings-modal.span--4" className="block truncate text-xs text-ink-muted">
                  {t("servidor.descoberta.membros", { quantos: detail.guild.memberCount })}
                </span>
              </span>
            </div>

            <div data-gc="servidor.server-settings.server-settings-modal.div--3" className="relative">
              <Search data-gc="servidor.server-settings.server-settings-modal.search"
                size={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Input data-gc="servidor.server-settings.server-settings-modal.input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("servidor.abas.pesquisar")}
                aria-label={t("servidor.abas.pesquisar")}
                className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-line-sutil focus-visible:ring-0"
              />
            </div>

            <div data-gc="servidor.server-settings.server-settings-modal.div--4" className="flex flex-col gap-2">
              {groups.map((group) => (
                <div data-gc="servidor.server-settings.server-settings-modal.div--5" key={group.title ?? "principal"} {...flx("settingsGroup", "flex flex-col gap-[3px]")}>
                  {group.title && (
                    <p data-gc="servidor.server-settings.server-settings-modal.p" {...flx("groupSettingsTitle", "truncate px-2.5 pb-[3px] pt-1 text-11 font-semibold uppercase leading-4 tracking-[0.02em] text-ink-faint")}>
                      {t(group.title)}
                    </p>
                  )}

                  {group.items.map((id) => {
                    const Icon = ICONS[id];
                    const active = section === id;

                    return (
                      <button data-gc="servidor.server-settings.server-settings-modal.button"
                        key={id}
                        onClick={() => pick(id)}
                        aria-current={active}
                        className={cn(
                          flxCls("settingsItem"),
                          "flex w-full items-center gap-2 rounded-lg border px-2.5 py-[5px] text-left text-sm transition",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foco-anel",
                          active
                            ? cn("border-transparent bg-selecionado font-medium text-ink", flxCls("settingsActiveItem"))
                            : "border-transparent text-ink-muted hover:bg-hover hover:text-ink",
                        )}
                      >
                        <Icon data-gc="servidor.server-settings.server-settings-modal.icon"
                          size={20}
                          className={cn(
                            flxCls("itemSettingsIcon"),
                            "shrink-0 transition",
                            active ? "text-ink" : "text-ink-faint",
                          )}
                        />
                        <span data-gc="servidor.server-settings.server-settings-modal.span--5" {...flx("itemSettingsLabel", "min-w-0 flex-1 truncate")}>
                          {t(LABELS[id])}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}

              {!groups.length && !deleteVisible && (
                <p data-gc="servidor.server-settings.server-settings-modal.p--2" className="px-2.5 py-2 text-xs text-ink-faint">
                  {t("servidor.abas.semResultado")}
                </p>
              )}
            </div>

            {deleteVisible && (
              <div data-gc="servidor.server-settings.server-settings-modal.div--6" className="mt-auto flex flex-col border-t border-line pb-3 pt-2">
                <button data-gc="servidor.server-settings.server-settings-modal.button--2"
                  onClick={() => pick("doDelete")}
                  aria-current={section === "doDelete"}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition",
                    section === "doDelete"
                      ? "bg-danger-fundo text-danger"
                      : "text-danger hover:bg-danger-fundo",
                  )}
                >
                  <Trash2 data-gc="servidor.server-settings.server-settings-modal.trash2" size={16} className="shrink-0" />
                  {t(LABELS.doDelete)}
                </button>
              </div>
            )}
          </nav>

          <div data-gc="servidor.server-settings.server-settings-modal.div--7" {...flx("settingsContent", cn("min-w-0 flex-1 flex-col md:flex", contentIsOpen ? "flex" : "hidden"))}>
            <div data-gc="servidor.server-settings.server-settings-modal.div--8" {...flx("settingsTop", cn("flex h-15 shrink-0 items-center justify-between gap-4 border-b border-line px-4", flxCls("windowSettingsTop")))}>
              <h2 data-gc="servidor.server-settings.server-settings-modal.h2" className="flex min-w-0 items-center gap-1.5 text-lg font-semibold">
                <button data-gc="servidor.server-settings.server-settings-modal.button--3"
                  type="button"
                  onClick={() => setContentIsOpen(false)}
                  aria-label={t("comum.voltar")}
                  className="-ml-1 shrink-0 rounded p-1 text-ink-muted transition hover:bg-hover hover:text-ink md:hidden"
                >
                  <ArrowLeft data-gc="servidor.server-settings.server-settings-modal.arrow-left" size={18} />
                </button>
                <span data-gc="servidor.server-settings.server-settings-modal.span--6" className="truncate">{t(LABELS[section])}</span>
              </h2>

              <DialogPrimitive.Close
                aria-label={t("comum.fechar")}
                className="flex size-[34px] shrink-0 items-center justify-center rounded-lg text-ink-faint transition hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foco-anel"
              >
                <X data-gc="servidor.server-settings.server-settings-modal.x--2" size={20} />
              </DialogPrimitive.Close>
            </div>

            <div data-gc="servidor.server-settings.server-settings-modal.div--9" className="min-h-0 flex-1 overflow-y-auto">
              <div data-gc="servidor.server-settings.server-settings-modal.div--10" className={cn(
                "mx-auto w-full px-[clamp(1rem,3vw,1.5rem)] pb-10 pt-5",
                WIDTHS[section] ?? DEFAULT_WIDTH,
              )}>
                <ErrorBoundary key={section} where={`servidor · ${section}`} compact>
                  {section === "profile" && (
                    <ServerProfileSection data-gc="servidor.server-settings.server-settings-modal.server-profile-section" guild={detail.guild} />
                  )}

                  {section === "tag" && <ServerTagSection data-gc="servidor.server-settings.server-settings-modal.server-tag-section" guild={detail.guild} />}

                  {section === "explore" && <DiscoverySection data-gc="servidor.server-settings.server-settings-modal.discovery-section" guild={detail.guild} />}

                  {section === "engagement" && (
                    <EngagementSection data-gc="servidor.server-settings.server-settings-modal.engagement-section"
                      guild={detail.guild}
                      channels={detail.channels}
                    />
                  )}

                  {section === "emoji" && (
                    <EmojiSection data-gc="servidor.server-settings.server-settings-modal.emoji-section"
                      guildId={detail.guild.id}
                      canManage={can("MANAGE_EXPRESSIONS")}
                    />
                  )}

                  {section === "stickers" && (
                    <StickersSection data-gc="servidor.server-settings.server-settings-modal.stickers-section"
                      guildId={detail.guild.id}
                      canManage={can("MANAGE_EXPRESSIONS")}
                    />
                  )}

                  {section === "sounds" && (
                    <SoundboardSection data-gc="servidor.server-settings.server-settings-modal.soundboard-section"
                      guildId={detail.guild.id}
                      canManage={can("MANAGE_EXPRESSIONS")}
                    />
                  )}

                  {section === "audit" && (
                    <AuditLogSection data-gc="servidor.server-settings.server-settings-modal.audit-log-section" guildId={detail.guild.id} members={members} />
                  )}

                  {section === "bans" && (
                    <BansSection data-gc="servidor.server-settings.server-settings-modal.bans-section" guildId={detail.guild.id} />
                  )}

                  {section === "automod" && (
                    <AutoModSection data-gc="servidor.server-settings.server-settings-modal.auto-mod-section"
                      guildId={detail.guild.id}
                      channels={detail.channels}
                      roles={detail.roles}
                    />
                  )}

                  {section === "badges" && (
                    <BadgesSection data-gc="servidor.server-settings.server-settings-modal.badges-section"
                      guildId={detail.guild.id}
                      badges={detail.badges}
                      editable={canManage}
                    />
                  )}

                  {section === "members" && (
                    <MembersSection data-gc="servidor.server-settings.server-settings-modal.members-section"
                      guild={detail.guild}
                      members={members}
                      roles={detail.roles}
                      currentUserId={currentUserId}
                      canKick={can("KICK_MEMBERS")}
                      canBan={can("BAN_MEMBERS")}
                      canTimeout={can("MODERATE_MEMBERS")}
                      canManageRoles={canManageRoles}
                    />
                  )}

                  {section === "invites" && (
                    <InvitesSection data-gc="servidor.server-settings.server-settings-modal.invites-section" guildId={detail.guild.id} />
                  )}

                  {section === "community" && (
                    <CommunitySection data-gc="servidor.server-settings.server-settings-modal.community-section"
                      guildId={detail.guild.id}
                      channels={detail.channels}
                    />
                  )}

                  {section === "doDelete" && (
                    <DeleteGuildSection data-gc="servidor.server-settings.server-settings-modal.delete-guild-section.on-close" guild={detail.guild} onClose={onClose} />
                  )}

                  {section === "roles" && (
                    <RolesSection data-gc="servidor.server-settings.server-settings-modal.roles-section"
                      guildId={detail.guild.id}
                      members={members}
                      minePermissions={detail.permissions as Permission[]}
                      myPosition={myPosition}
                      isOwner={isOwner}
                    />
                  )}

                  {section === "integrations" && (
                    <IntegrationsSection data-gc="servidor.server-settings.server-settings-modal.integrations-section"
                      guildId={detail.guild.id}
                      channels={detail.channels}
                    />
                  )}
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
