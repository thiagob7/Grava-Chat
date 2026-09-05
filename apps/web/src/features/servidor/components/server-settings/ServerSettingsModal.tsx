import React, { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Trash2, X } from "lucide-react";
import type { GuildMember, Permission } from "@gravae/shared";

import type { GuildDetailModel } from "~/@core/domain/models/guild-model";
import { DeleteGuildSection } from "~/features/servidor/components/server-settings/DeleteGuildSection";
import { InvitesSection } from "~/features/servidor/components/server-settings/InvitesSection";
import { MembersSection } from "~/features/servidor/components/server-settings/MembersSection";
import { IntegrationsSection } from "~/features/servidor/components/server-settings/IntegrationsSection";
import { AuditLogSection } from "~/features/servidor/components/server-settings/AuditLogSection";
import { AutoModSection } from "~/features/servidor/components/server-settings/AutoModSection";
import { BansSection } from "~/features/servidor/components/server-settings/BansSection";
import { EmblemasSection } from "~/features/servidor/components/server-settings/EmblemasSection";
import { DescobertaSection } from "~/features/servidor/components/server-settings/DescobertaSection";
import { EngagementSection } from "~/features/servidor/components/server-settings/EngagementSection";
import {
  EmojiSection,
  SoundboardSection,
  StickersSection,
} from "~/features/servidor/components/server-settings/ExpressionsSections";
import { RolesSection } from "~/features/servidor/components/server-settings/RolesSection";
import { ServerTagSection } from "~/features/servidor/components/server-settings/ServerTagSection";
import { ServerProfileSection } from "~/features/servidor/components/server-settings/ServerProfileSection";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export type Secao =
  | "perfil"
  | "tag"
  | "engajamento"
  | "explorar"
  | "emoji"
  | "figurinhas"
  | "sons"
  | "emblemas"
  | "membros"
  | "cargos"
  | "convites"
  | "integracoes"
  | "auditoria"
  | "banimentos"
  | "automod"
  | "excluir";

const GRUPOS: { titulo: string | null; itens: Secao[] }[] = [
  { titulo: null, itens: ["perfil", "tag", "engajamento", "explorar"] },
  { titulo: "servidor.abas.expressoes", itens: ["emoji", "figurinhas", "sons", "emblemas"] },
  { titulo: "servidor.abas.pessoas", itens: ["membros", "cargos", "convites"] },
  { titulo: "servidor.abas.apps", itens: ["integracoes"] },
  { titulo: "servidor.abas.moderacao", itens: ["auditoria", "banimentos", "automod"] },
];

const ROTULOS: Record<Secao, string> = {
  perfil: "servidor.perfil.titulo",
  tag: "servidor.etiqueta.titulo",
  engajamento: "servidor.engajamento.titulo",
  explorar: "servidor.explorar.titulo",
  emoji: "comum.emoji",
  figurinhas: "servidor.expressoes.figurinhas",
  sons: "servidor.expressoes.sons",
  emblemas: "servidor.emblemas.titulo",
  membros: "servidor.auditoria.filtroMembros",
  cargos: "servidor.cargos.titulo",
  convites: "servidor.convites.titulo",
  integracoes: "servidor.integracoes.titulo",
  auditoria: "servidor.auditoria.titulo",
  banimentos: "servidor.abas.banimentos",
  automod: "servidor.automod.titulo",
  excluir: "servidor.excluir.titulo",
};

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
  permissoes: Set<string>;
  secaoInicial?: Secao | null;
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
  permissoes,
  secaoInicial,
}) => {
  const { t } = useTranslation();
  const pode = (p: string) =>
    permissoes.has("ADMINISTRATOR") || permissoes.has(p);
  const [secao, setSecao] = useState<Secao>(canManage ? "perfil" : "membros");

  useEffect(() => {
    if (open && secaoInicial) setSecao(secaoInicial);
  }, [open, secaoInicial]);

  const minhaPosicao = isOwner
    ? Number.POSITIVE_INFINITY
    : (() => {
        const meus =
          detail.members.find((m) => m.user.id === currentUserId)?.roleIds ??
          [];
        return detail.roles
          .filter((r) => meus.includes(r.id))
          .reduce((maior, r) => Math.max(maior, r.position), 0);
      })();

  const visivel: Record<Secao, boolean> = {
    perfil: canManage,
    tag: canManage,
    engajamento: canManage,
    explorar: canManage,
    emoji: true,
    figurinhas: true,
    sons: true,
    emblemas: true,
    membros: true,
    cargos: canManageRoles,
    convites: true,
    integracoes: canManageWebhooks,
    auditoria: pode("VIEW_AUDIT_LOG"),
    banimentos: pode("BAN_MEMBERS"),
    automod: canManage,
    excluir: isOwner,
  };

  return (
    <DialogPrimitive.Root data-gc="servidor.server-settings.server-settings-modal.dialog-primitiveroot"
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay data-gc="servidor.server-settings.server-settings-modal.dialog-primitiveoverlay" className="fixed inset-0 z-50 bg-surface-2" />
        <DialogPrimitive.Content data-gc="servidor.server-settings.server-settings-modal.dialog-primitivecontent"
          className="regiao-sem-arrasto fixed inset-0 z-50 flex outline-none"
          aria-label={t("servidor.titulo")}
        >
          <DialogPrimitive.Title data-gc="servidor.server-settings.server-settings-modal.dialog-primitivetitle" className="sr-only">
            Configurações de {detail.guild.name}
          </DialogPrimitive.Title>

          <nav data-gc="servidor.server-settings.server-settings-modal.nav" className="w-60 shrink-0 overflow-y-auto bg-surface-1 px-3 py-12">
            <p data-gc="servidor.server-settings.server-settings-modal.p" className="mb-2 truncate px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {detail.guild.name}
            </p>

            {GRUPOS.map((grupo) => {
              const itens = grupo.itens.filter((id) => visivel[id]);
              if (!itens.length) return null;

              return (
                <div data-gc="servidor.server-settings.server-settings-modal.div" key={grupo.titulo ?? "principal"} className="mb-3">
                  {grupo.titulo && (
                    <p data-gc="servidor.server-settings.server-settings-modal.p--2" className="mb-1 mt-3 px-2 text-11 font-semibold uppercase tracking-wide text-ink-faint">
                      {t(grupo.titulo)}
                    </p>
                  )}

                  {itens.map((id) => (
                    <button data-gc="servidor.server-settings.server-settings-modal.button"
                      key={id}
                      onClick={() => setSecao(id)}
                      className={cn(
                        "mb-0.5 flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-sm transition",
                        secao === id
                          ? "bg-surface-4 text-ink"
                          : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                      )}
                    >
                      {t(ROTULOS[id])}
                    </button>
                  ))}
                </div>
              );
            })}

            {visivel.excluir && (
              <button data-gc="servidor.server-settings.server-settings-modal.button--2"
                onClick={() => setSecao("excluir")}
                className="mt-2 flex w-full items-center justify-between rounded border-t border-line px-2.5 py-1.5 pt-3 text-left text-sm text-danger transition hover:bg-danger/10"
              >
                {t(ROTULOS.excluir)}
                <Trash2 data-gc="servidor.server-settings.server-settings-modal.trash2" size={14} />
              </button>
            )}
          </nav>

          <div data-gc="servidor.server-settings.server-settings-modal.div--2" className="flex-1 overflow-y-auto bg-surface-2 px-10 py-12">
            {secao === "perfil" && (
              <ServerProfileSection data-gc="servidor.server-settings.server-settings-modal.server-profile-section" guild={detail.guild} />
            )}

            {secao === "tag" && <ServerTagSection data-gc="servidor.server-settings.server-settings-modal.server-tag-section" guild={detail.guild} />}

            {secao === "explorar" && <DescobertaSection data-gc="servidor.server-settings.server-settings-modal.descoberta-section" guild={detail.guild} />}

            {secao === "engajamento" && (
              <EngagementSection data-gc="servidor.server-settings.server-settings-modal.engagement-section"
                guild={detail.guild}
                channels={detail.channels}
              />
            )}

            {secao === "emoji" && (
              <EmojiSection data-gc="servidor.server-settings.server-settings-modal.emoji-section"
                guildId={detail.guild.id}
                podeGerenciar={pode("MANAGE_EXPRESSIONS")}
              />
            )}

            {secao === "figurinhas" && (
              <StickersSection data-gc="servidor.server-settings.server-settings-modal.stickers-section"
                guildId={detail.guild.id}
                podeGerenciar={pode("MANAGE_EXPRESSIONS")}
              />
            )}

            {secao === "sons" && (
              <SoundboardSection data-gc="servidor.server-settings.server-settings-modal.soundboard-section"
                guildId={detail.guild.id}
                podeGerenciar={pode("MANAGE_EXPRESSIONS")}
              />
            )}

            {secao === "auditoria" && (
              <AuditLogSection data-gc="servidor.server-settings.server-settings-modal.audit-log-section" guildId={detail.guild.id} members={members} />
            )}

            {secao === "banimentos" && (
              <BansSection data-gc="servidor.server-settings.server-settings-modal.bans-section" guildId={detail.guild.id} />
            )}

            {secao === "automod" && (
              <AutoModSection data-gc="servidor.server-settings.server-settings-modal.auto-mod-section"
                guildId={detail.guild.id}
                channels={detail.channels}
                roles={detail.roles}
              />
            )}

            {secao === "emblemas" && (
              <EmblemasSection data-gc="servidor.server-settings.server-settings-modal.emblemas-section"
                guildId={detail.guild.id}
                emblemas={detail.emblemas}
                editavel={canManage}
              />
            )}

            {secao === "membros" && (
              <MembersSection data-gc="servidor.server-settings.server-settings-modal.members-section"
                guild={detail.guild}
                members={members}
                roles={detail.roles}
                currentUserId={currentUserId}
                canKick={pode("KICK_MEMBERS")}
                canBan={pode("BAN_MEMBERS")}
                canTimeout={pode("MODERATE_MEMBERS")}
                canManageRoles={canManageRoles}
              />
            )}

            {secao === "convites" && (
              <InvitesSection data-gc="servidor.server-settings.server-settings-modal.invites-section" guildId={detail.guild.id} />
            )}

            {secao === "excluir" && (
              <DeleteGuildSection data-gc="servidor.server-settings.server-settings-modal.delete-guild-section.on-close" guild={detail.guild} onClose={onClose} />
            )}

            {secao === "cargos" && (
              <RolesSection data-gc="servidor.server-settings.server-settings-modal.roles-section"
                guildId={detail.guild.id}
                members={members}
                minhasPermissoes={detail.permissions as Permission[]}
                minhaPosicao={minhaPosicao}
                isOwner={isOwner}
              />
            )}

            {secao === "integracoes" && (
              <IntegrationsSection data-gc="servidor.server-settings.server-settings-modal.integrations-section"
                guildId={detail.guild.id}
                channels={detail.channels}
              />
            )}
          </div>

          <button data-gc="servidor.server-settings.server-settings-modal.button.on-close"
            onClick={onClose}
            aria-label={t("comum.fechar")}
            className="absolute right-10 top-12 flex flex-col items-center gap-1 text-ink-muted transition hover:text-ink"
          >
            <span data-gc="servidor.server-settings.server-settings-modal.span" className="flex size-9 items-center justify-center rounded-full border-2 border-ink-faint">
              <X data-gc="servidor.server-settings.server-settings-modal.x" size={18} />
            </span>
            <span data-gc="servidor.server-settings.server-settings-modal.span--2" className="text-10 font-semibold">ESC</span>
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
