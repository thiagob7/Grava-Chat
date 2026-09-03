import React, { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Trash2, X } from "lucide-react";
import type { GuildMember, Permission } from "@gravae/shared";

import type { GuildDetailModel } from "~/@core/domain/models/guild-model";
import { DeleteGuildSection } from "~/components/server-settings/DeleteGuildSection";
import { InvitesSection } from "~/components/server-settings/InvitesSection";
import { MembersSection } from "~/components/server-settings/MembersSection";
import { IntegrationsSection } from "~/components/server-settings/IntegrationsSection";
import { AuditLogSection } from "~/components/server-settings/AuditLogSection";
import { AutoModSection } from "~/components/server-settings/AutoModSection";
import { BansSection } from "~/components/server-settings/BansSection";
import { EmblemasSection } from "~/components/server-settings/EmblemasSection";
import { EngagementSection } from "~/components/server-settings/EngagementSection";
import {
  EmojiSection,
  SoundboardSection,
  StickersSection,
} from "~/components/server-settings/ExpressionsSections";
import { RolesSection } from "~/components/server-settings/RolesSection";
import { ServerTagSection } from "~/components/server-settings/ServerTagSection";
import { ServerProfileSection } from "~/components/server-settings/ServerProfileSection";
import { cn } from "~/lib/utils";

export type Secao =
  | "perfil"
  | "tag"
  | "engajamento"
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
  { titulo: null, itens: ["perfil", "tag", "engajamento"] },
  { titulo: "Expressões", itens: ["emoji", "figurinhas", "sons", "emblemas"] },
  { titulo: "Pessoas", itens: ["membros", "cargos", "convites"] },
  { titulo: "Apps", itens: ["integracoes"] },
  { titulo: "Moderação", itens: ["auditoria", "banimentos", "automod"] },
];

const ROTULOS: Record<Secao, string> = {
  perfil: "Perfil do servidor",
  tag: "Tag do servidor",
  engajamento: "Engajamento",
  emoji: "Emoji",
  figurinhas: "Figurinhas",
  sons: "Painel de efeitos sonoros",
  emblemas: "Emblemas",
  membros: "Membros",
  cargos: "Cargos",
  convites: "Convites",
  integracoes: "Integrações",
  auditoria: "Registro de auditoria",
  banimentos: "Banimentos",
  automod: "AutoMod",
  excluir: "Excluir servidor",
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
  /// Onde cair ao abrir. Quem chama de longe — o "Adicionar emoji" do seletor
  /// de expressões — quer a tela de emoji, não o Perfil do servidor.
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
  const pode = (p: string) =>
    permissoes.has("ADMINISTRATOR") || permissoes.has(p);
  const [secao, setSecao] = useState<Secao>(canManage ? "perfil" : "membros");

  /// Só na abertura. Aplicar a cada render desfaria o clique de quem navega
  /// pela lista da esquerda: escolher "Cargos" voltaria sozinho para a seção
  /// pedida lá atrás.
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
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-surface-2" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex outline-none"
          aria-label="Configurações do servidor"
        >
          <DialogPrimitive.Title className="sr-only">
            Configurações de {detail.guild.name}
          </DialogPrimitive.Title>

          <nav className="w-60 shrink-0 overflow-y-auto bg-surface-1 px-3 py-12">
            <p className="mb-2 truncate px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {detail.guild.name}
            </p>

            {GRUPOS.map((grupo) => {
              const itens = grupo.itens.filter((id) => visivel[id]);
              if (!itens.length) return null;

              return (
                <div key={grupo.titulo ?? "principal"} className="mb-3">
                  {grupo.titulo && (
                    <p className="mb-1 mt-3 px-2 text-11 font-semibold uppercase tracking-wide text-ink-faint">
                      {grupo.titulo}
                    </p>
                  )}

                  {itens.map((id) => (
                    <button
                      key={id}
                      onClick={() => setSecao(id)}
                      className={cn(
                        "mb-0.5 flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-sm transition",
                        secao === id
                          ? "bg-surface-4 text-ink"
                          : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                      )}
                    >
                      {ROTULOS[id]}
                    </button>
                  ))}
                </div>
              );
            })}

            {visivel.excluir && (
              <button
                onClick={() => setSecao("excluir")}
                className="mt-2 flex w-full items-center justify-between rounded border-t border-line px-2.5 py-1.5 pt-3 text-left text-sm text-danger transition hover:bg-danger/10"
              >
                {ROTULOS.excluir}
                <Trash2 size={14} />
              </button>
            )}
          </nav>

          <div className="flex-1 overflow-y-auto bg-surface-2 px-10 py-12">
            {secao === "perfil" && (
              <ServerProfileSection guild={detail.guild} />
            )}

            {secao === "tag" && <ServerTagSection guild={detail.guild} />}

            {secao === "engajamento" && (
              <EngagementSection
                guild={detail.guild}
                channels={detail.channels}
              />
            )}

            {secao === "emoji" && (
              <EmojiSection
                guildId={detail.guild.id}
                podeGerenciar={pode("MANAGE_EXPRESSIONS")}
              />
            )}

            {secao === "figurinhas" && (
              <StickersSection
                guildId={detail.guild.id}
                podeGerenciar={pode("MANAGE_EXPRESSIONS")}
              />
            )}

            {secao === "sons" && (
              <SoundboardSection
                guildId={detail.guild.id}
                podeGerenciar={pode("MANAGE_EXPRESSIONS")}
              />
            )}

            {secao === "auditoria" && (
              <AuditLogSection guildId={detail.guild.id} members={members} />
            )}

            {secao === "banimentos" && (
              <BansSection guildId={detail.guild.id} />
            )}

            {secao === "automod" && (
              <AutoModSection
                guildId={detail.guild.id}
                channels={detail.channels}
                roles={detail.roles}
              />
            )}

            {secao === "emblemas" && (
              <EmblemasSection
                guildId={detail.guild.id}
                emblemas={detail.emblemas}
                editavel={canManage}
              />
            )}

            {secao === "membros" && (
              <MembersSection
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
              <InvitesSection guildId={detail.guild.id} />
            )}

            {secao === "excluir" && (
              <DeleteGuildSection guild={detail.guild} onClose={onClose} />
            )}

            {secao === "cargos" && (
              <RolesSection
                guildId={detail.guild.id}
                members={members}
                minhasPermissoes={detail.permissions as Permission[]}
                minhaPosicao={minhaPosicao}
                isOwner={isOwner}
              />
            )}

            {secao === "integracoes" && (
              <IntegrationsSection
                guildId={detail.guild.id}
                channels={detail.channels}
              />
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-10 top-12 flex flex-col items-center gap-1 text-ink-muted transition hover:text-ink"
          >
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-ink-faint">
              <X size={18} />
            </span>
            <span className="text-10 font-semibold">ESC</span>
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
