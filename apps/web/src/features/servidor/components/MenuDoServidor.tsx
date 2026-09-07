import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { CheckCheck, Copy, DoorOpen, Settings, UserPlus, UserRoundPen } from "lucide-react";

import { useMe } from "~/@core/application/queries/auth/use-me";
import { useMarcarServidorLido } from "~/@core/application/queries/guild/use-marcar-servidor-lido";
import { useRemoveMember } from "~/@core/application/queries/guild/use-remove-member";
import type { GuildSummaryModel } from "~/@core/domain/models/guild-model";
import { useConfirmar } from "~/components/ui/confirm";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { useServerSettingsStore } from "~/features/servidor/stores/server-settings-store";
import { copiarTexto } from "~/lib/copiar";

/*
  O menu do botão direito num servidor do trilho.

  Só oferece o que a pessoa pode fazer ali: convidar pede a permissão de
  convite, editar pede a de gerir, e sair não aparece para quem é dono —
  dono não sai, apaga ou passa adiante, e isso fica nas configurações.
*/
export const MenuDoServidor: React.FC<{
  guild: GuildSummaryModel;
  onConvidar: () => void;
  children: React.ReactNode;
}> = ({ guild, onConvidar, children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirmar = useConfirmar();
  const { data: eu } = useMe(true);
  const marcarLido = useMarcarServidorLido();
  const sair = useRemoveMember();
  const abrirConfiguracoes = useServerSettingsStore((s) => s.abrir);

  const pode = (permissao: string) => guild.isOwner || guild.permissions.includes(permissao as never);

  const sairDaComunidade = async () => {
    if (!eu) return;

    const { confirmado } = await confirmar({
      titulo: t("servidor.menu.sairTitulo", { nome: guild.name }),
      descricao: t("servidor.menu.sairDescricao"),
      acao: t("servidor.menu.sair"),
      destrutivo: true,
    });

    if (!confirmado) return;

    sair.mutate({ guildId: guild.id, userId: eu.id }, { onSuccess: () => navigate("/channels") });
  };

  return (
    <ContextMenu data-gc="servidor.menu-do-servidor.context-menu">
      <ContextMenuTrigger data-gc="servidor.menu-do-servidor.context-menu-trigger" asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent data-gc="servidor.menu-do-servidor.context-menu-content">
        <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item" onSelect={() => marcarLido.mutate(guild.id)}>
          {t("servidor.menu.marcarLida")} <CheckCheck data-gc="servidor.menu-do-servidor.check-check" size={14} />
        </ContextMenuItem>

        {pode("CREATE_INVITE") && (
          <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item.on-convidar" onSelect={onConvidar}>
            {t("servidor.menu.convidar")} <UserPlus data-gc="servidor.menu-do-servidor.user-plus" size={14} />
          </ContextMenuItem>
        )}

        <ContextMenuSeparator data-gc="servidor.menu-do-servidor.context-menu-separator" />

        {pode("MANAGE_GUILD") && (
          <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--2" onSelect={() => abrirConfiguracoes(guild.id, "perfil")}>
            {t("servidor.menu.editarPerfil")} <UserRoundPen data-gc="servidor.menu-do-servidor.user-round-pen" size={14} />
          </ContextMenuItem>
        )}

        <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--3" onSelect={() => abrirConfiguracoes(guild.id)}>
          {t("servidor.menu.configuracoes")} <Settings data-gc="servidor.menu-do-servidor.settings" size={14} />
        </ContextMenuItem>

        <ContextMenuSeparator data-gc="servidor.menu-do-servidor.context-menu-separator--2" />

        {!guild.isOwner && (
          <>
            <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--4" danger onSelect={() => void sairDaComunidade()}>
              {t("servidor.menu.sair")} <DoorOpen data-gc="servidor.menu-do-servidor.door-open" size={14} />
            </ContextMenuItem>
            <ContextMenuSeparator data-gc="servidor.menu-do-servidor.context-menu-separator--3" />
          </>
        )}

        <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--5"
          onSelect={() => {
            void copiarTexto(guild.id);
            toast.success(t("servidor.menu.idCopiado"));
          }}
        >
          {t("servidor.menu.copiarId")} <Copy data-gc="servidor.menu-do-servidor.copy" size={14} />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
