import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Bell, BellOff, Check, CheckCheck, Copy, DoorOpen, EyeOff, Flag, Settings, UserPlus, UserRoundPen } from "lucide-react";

import { useMe } from "~/@core/application/queries/auth/use-me";
import { useReportGuild } from "~/@core/application/queries/guild/use-denunciar-guild";
import { useMarkServerRead } from "~/@core/application/queries/guild/use-marcar-servidor-lido";
import { useRemoveMember } from "~/@core/application/queries/guild/use-remove-member";
import { REPORT_REASONS, type ReportReason } from "~/@core/application/requests/guild/denunciar-guild";
import type { GuildSummaryModel } from "~/@core/domain/models/guild-model";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label, Textarea } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import { useServerSettingsStore } from "~/features/servidor/stores/server-settings-store";
import { copyText } from "~/lib/copiar";
import { serverMuted, useNotices, type ChannelMode } from "~/stores/notificacoes";

const MINUTE = 60_000;
const DURATIONS: { key: string; ms: number }[] = [
  { key: "porQuinze", ms: 15 * MINUTE },
  { key: "porUmaHora", ms: 60 * MINUTE },
  { key: "porOitoHoras", ms: 8 * 60 * MINUTE },
  { key: "porUmDia", ms: 24 * 60 * MINUTE },
  { key: "ateReativar", ms: -1 },
];

const Brand: React.FC<{ on: boolean }> = ({ on }) => (
  <Check data-gc="servidor.menu-do-servidor.check" size={14} className={on ? "text-brand" : "opacity-0"} />
);

export const ServerMenu: React.FC<{
  guild: GuildSummaryModel;
  onInvite: () => void;
  children: React.ReactNode;
}> = ({ guild, onInvite, children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: eu } = useMe(true);
  const markRead = useMarkServerRead();
  const leave = useRemoveMember();
  const openSettings = useServerSettingsStore((s) => s.open);
  const prefs = useNotices((s) => s.byServer[guild.id]);
  const muted = useNotices((s) => serverMuted(s, guild.id));
  const setServer = useNotices((s) => s.setServer);
  const [reporting, setReporting] = useState(false);

  const can = (permission: string) => guild.isOwner || guild.permissions.includes(permission as never);

  const leaveCommunity = async () => {
    if (!eu) return;

    const { confirmed } = await confirm({
      title: t("servidor.menu.sairTitulo", { nome: guild.name }),
      description: t("servidor.menu.sairDescricao"),
      action: t("servidor.menu.sair"),
      destructive: true,
    });

    if (!confirmed) return;

    leave.mutate({ guildId: guild.id, userId: eu.id }, { onSuccess: () => navigate("/channels") });
  };

  const modes: { mode: ChannelMode | null; key: string }[] = [
    { mode: null, key: "padrao" },
    { mode: "tudo", key: "todas" },
    { mode: "mencoes", key: "soMencoes" },
    { mode: "nada", key: "nada" },
  ];

  return (
    <>
      <ContextMenu data-gc="servidor.menu-do-servidor.context-menu">
        <ContextMenuTrigger data-gc="servidor.menu-do-servidor.context-menu-trigger" asChild>{children}</ContextMenuTrigger>

        <ContextMenuContent data-gc="servidor.menu-do-servidor.context-menu-content">
          <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item" onSelect={() => markRead.mutate(guild.id)}>
            {t("servidor.menu.marcarLida")} <CheckCheck data-gc="servidor.menu-do-servidor.check-check" size={14} />
          </ContextMenuItem>

          {can("CREATE_INVITE") && (
            <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item.on-invite" onSelect={onInvite}>
              {t("servidor.menu.convidar")} <UserPlus data-gc="servidor.menu-do-servidor.user-plus" size={14} />
            </ContextMenuItem>
          )}

          <ContextMenuSeparator data-gc="servidor.menu-do-servidor.context-menu-separator" />

          {muted ? (
            <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--2" onSelect={() => setServer(guild.id, { mutedUntil: null })}>
              {t("servidor.menu.reativar")} <Bell data-gc="servidor.menu-do-servidor.bell" size={14} />
            </ContextMenuItem>
          ) : (
            <ContextMenuSub data-gc="servidor.menu-do-servidor.context-menu-sub">
              <ContextMenuSubTrigger data-gc="servidor.menu-do-servidor.context-menu-sub-trigger">
                {t("servidor.menu.silenciar")} <BellOff data-gc="servidor.menu-do-servidor.bell-off" size={14} />
              </ContextMenuSubTrigger>
              <ContextMenuSubContent data-gc="servidor.menu-do-servidor.context-menu-sub-content">
                {DURATIONS.map((d) => (
                  <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--3"
                    key={d.key}
                    onSelect={() => setServer(guild.id, { mutedUntil: d.ms === -1 ? -1 : Date.now() + d.ms })}
                  >
                    {t(`servidor.menu.${d.key}`)}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}

          <ContextMenuSub data-gc="servidor.menu-do-servidor.context-menu-sub--2">
            <ContextMenuSubTrigger data-gc="servidor.menu-do-servidor.context-menu-sub-trigger--2">
              {t("servidor.menu.notificacoes")} <Bell data-gc="servidor.menu-do-servidor.bell--2" size={14} />
            </ContextMenuSubTrigger>
            <ContextMenuSubContent data-gc="servidor.menu-do-servidor.context-menu-sub-content--2">
              {modes.map((m) => (
                <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--4" key={m.key} onSelect={() => setServer(guild.id, { mode: m.mode })}>
                  {t(`servidor.menu.${m.key}`)} <Brand data-gc="servidor.menu-do-servidor.brand" on={(prefs?.mode ?? null) === m.mode} />
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--5"
            onSelect={() => setServer(guild.id, { hideMuted: !prefs?.hideMuted })}
          >
            {t("servidor.menu.ocultarSilenciados")}
            {prefs?.hideMuted ? <Check data-gc="servidor.menu-do-servidor.check--2" size={14} className="text-brand" /> : <EyeOff data-gc="servidor.menu-do-servidor.eye-off" size={14} />}
          </ContextMenuItem>

          <ContextMenuSeparator data-gc="servidor.menu-do-servidor.context-menu-separator--2" />

          {can("MANAGE_GUILD") && (
            <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--6" onSelect={() => openSettings(guild.id, "profile")}>
              {t("servidor.menu.editarPerfil")} <UserRoundPen data-gc="servidor.menu-do-servidor.user-round-pen" size={14} />
            </ContextMenuItem>
          )}

          <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--7" onSelect={() => openSettings(guild.id)}>
            {t("servidor.menu.configuracoes")} <Settings data-gc="servidor.menu-do-servidor.settings" size={14} />
          </ContextMenuItem>

          <ContextMenuSeparator data-gc="servidor.menu-do-servidor.context-menu-separator--3" />

          {!guild.isOwner && (
            <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--8" danger onSelect={() => void leaveCommunity()}>
              {t("servidor.menu.sair")} <DoorOpen data-gc="servidor.menu-do-servidor.door-open" size={14} />
            </ContextMenuItem>
          )}

          <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--9" danger onSelect={() => setReporting(true)}>
            {t("servidor.menu.denunciar")} <Flag data-gc="servidor.menu-do-servidor.flag" size={14} />
          </ContextMenuItem>

          <ContextMenuSeparator data-gc="servidor.menu-do-servidor.context-menu-separator--4" />

          <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--10"
            onSelect={() => {
              void copyText(guild.id);
              toast.success(t("servidor.menu.idCopiado"));
            }}
          >
            {t("servidor.menu.copiarId")} <Copy data-gc="servidor.menu-do-servidor.copy" size={14} />
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ReportCommunity data-gc="servidor.menu-do-servidor.report-community" guild={guild} isOpen={reporting} onClose={() => setReporting(false)} />
    </>
  );
};

const ReportCommunity: React.FC<{ guild: GuildSummaryModel; isOpen: boolean; onClose: () => void }> = ({
  guild,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const report = useReportGuild();
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");

  return (
    <Dialog data-gc="servidor.menu-do-servidor.dialog" open={isOpen} onOpenChange={(a) => !a && onClose()}>
      <DialogContent data-gc="servidor.menu-do-servidor.dialog-content" className="max-w-md">
        <DialogHeader data-gc="servidor.menu-do-servidor.dialog-header">
          <DialogTitle data-gc="servidor.menu-do-servidor.dialog-title">{t("servidor.denuncia.titulo", { nome: guild.name })}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="servidor.menu-do-servidor.dialog-body" className="space-y-4">
          <p data-gc="servidor.menu-do-servidor.p" className="text-sm text-ink-muted">{t("servidor.denuncia.descricao")}</p>

          <div data-gc="servidor.menu-do-servidor.div">
            <Label data-gc="servidor.menu-do-servidor.label" htmlFor="motivo-da-denuncia">{t("servidor.denuncia.motivo")}</Label>
            <SelectField data-gc="servidor.menu-do-servidor.select-field"
              id="motivo-da-denuncia"
              value={reason}
              onSelect={(value) => setReason(value as ReportReason)}
              options={REPORT_REASONS.map((m) => ({ value: m, label: t(`servidor.denuncia.motivos.${m}`) }))}
            />
          </div>

          <div data-gc="servidor.menu-do-servidor.div--2">
            <Label data-gc="servidor.menu-do-servidor.label--2" htmlFor="detalhes-da-denuncia">{t("servidor.denuncia.detalhes")}</Label>
            <Textarea data-gc="servidor.menu-do-servidor.textarea"
              id="detalhes-da-denuncia"
              value={details}
              maxLength={1000}
              rows={4}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        </DialogBody>

        <DialogFooter data-gc="servidor.menu-do-servidor.dialog-footer">
          <Button data-gc="servidor.menu-do-servidor.button.on-close" variant="surface" onClick={onClose}>{t("comum.cancelar")}</Button>
          <Button data-gc="servidor.menu-do-servidor.button"
            disabled={report.isPending}
            onClick={() =>
              report.mutate(
                { guildId: guild.id, reason, details: details.trim() || undefined },
                {
                  onSuccess: () => {
                    toast.success(t("servidor.denuncia.enviada"));
                    setDetails("");
                    onClose();
                  },
                },
              )
            }
          >
            {t("servidor.denuncia.enviar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
