import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Bell, BellOff, Check, CheckCheck, Copy, DoorOpen, EyeOff, Flag, Settings, UserPlus, UserRoundPen } from "lucide-react";

import { useMe } from "~/@core/application/queries/auth/use-me";
import { useDenunciarGuild } from "~/@core/application/queries/guild/use-denunciar-guild";
import { useMarcarServidorLido } from "~/@core/application/queries/guild/use-marcar-servidor-lido";
import { useRemoveMember } from "~/@core/application/queries/guild/use-remove-member";
import { MOTIVOS_DE_DENUNCIA, type MotivoDeDenuncia } from "~/@core/application/requests/guild/denunciar-guild";
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
import { copiarTexto } from "~/lib/copiar";
import { servidorSilenciado, useAvisos, type ModoDoCanal } from "~/stores/notificacoes";

const MINUTO = 60_000;
const DURACOES: { chave: string; ms: number }[] = [
  { chave: "porQuinze", ms: 15 * MINUTO },
  { chave: "porUmaHora", ms: 60 * MINUTO },
  { chave: "porOitoHoras", ms: 8 * 60 * MINUTO },
  { chave: "porUmDia", ms: 24 * 60 * MINUTO },
  { chave: "ateReativar", ms: -1 },
];

const Marca: React.FC<{ ligado: boolean }> = ({ ligado }) => (
  <Check data-gc="servidor.menu-do-servidor.check" size={14} className={ligado ? "text-brand" : "opacity-0"} />
);

export const MenuDoServidor: React.FC<{
  guild: GuildSummaryModel;
  onConvidar: () => void;
  children: React.ReactNode;
}> = ({ guild, onConvidar, children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: eu } = useMe(true);
  const marcarLido = useMarcarServidorLido();
  const sair = useRemoveMember();
  const abrirConfiguracoes = useServerSettingsStore((s) => s.abrir);
  const prefs = useAvisos((s) => s.porServidor[guild.id]);
  const silenciado = useAvisos((s) => servidorSilenciado(s, guild.id));
  const definirServidor = useAvisos((s) => s.definirServidor);
  const [denunciando, setDenunciando] = useState(false);

  const pode = (permissao: string) => guild.isOwner || guild.permissions.includes(permissao as never);

  const sairDaComunidade = async () => {
    if (!eu) return;

    const { confirmed } = await confirm({
      title: t("servidor.menu.sairTitulo", { nome: guild.name }),
      description: t("servidor.menu.sairDescricao"),
      action: t("servidor.menu.sair"),
      destructive: true,
    });

    if (!confirmed) return;

    sair.mutate({ guildId: guild.id, userId: eu.id }, { onSuccess: () => navigate("/channels") });
  };

  const modos: { modo: ModoDoCanal | null; chave: string }[] = [
    { modo: null, chave: "padrao" },
    { modo: "tudo", chave: "todas" },
    { modo: "mencoes", chave: "soMencoes" },
    { modo: "nada", chave: "nada" },
  ];

  return (
    <>
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

          {silenciado ? (
            <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--2" onSelect={() => definirServidor(guild.id, { silenciadoAte: null })}>
              {t("servidor.menu.reativar")} <Bell data-gc="servidor.menu-do-servidor.bell" size={14} />
            </ContextMenuItem>
          ) : (
            <ContextMenuSub data-gc="servidor.menu-do-servidor.context-menu-sub">
              <ContextMenuSubTrigger data-gc="servidor.menu-do-servidor.context-menu-sub-trigger">
                {t("servidor.menu.silenciar")} <BellOff data-gc="servidor.menu-do-servidor.bell-off" size={14} />
              </ContextMenuSubTrigger>
              <ContextMenuSubContent data-gc="servidor.menu-do-servidor.context-menu-sub-content">
                {DURACOES.map((d) => (
                  <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--3"
                    key={d.chave}
                    onSelect={() => definirServidor(guild.id, { silenciadoAte: d.ms === -1 ? -1 : Date.now() + d.ms })}
                  >
                    {t(`servidor.menu.${d.chave}`)}
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
              {modos.map((m) => (
                <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--4" key={m.chave} onSelect={() => definirServidor(guild.id, { modo: m.modo })}>
                  {t(`servidor.menu.${m.chave}`)} <Marca data-gc="servidor.menu-do-servidor.marca" ligado={(prefs?.modo ?? null) === m.modo} />
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--5"
            onSelect={() => definirServidor(guild.id, { esconderSilenciados: !prefs?.esconderSilenciados })}
          >
            {t("servidor.menu.ocultarSilenciados")}
            {prefs?.esconderSilenciados ? <Check data-gc="servidor.menu-do-servidor.check--2" size={14} className="text-brand" /> : <EyeOff data-gc="servidor.menu-do-servidor.eye-off" size={14} />}
          </ContextMenuItem>

          <ContextMenuSeparator data-gc="servidor.menu-do-servidor.context-menu-separator--2" />

          {pode("MANAGE_GUILD") && (
            <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--6" onSelect={() => abrirConfiguracoes(guild.id, "perfil")}>
              {t("servidor.menu.editarPerfil")} <UserRoundPen data-gc="servidor.menu-do-servidor.user-round-pen" size={14} />
            </ContextMenuItem>
          )}

          <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--7" onSelect={() => abrirConfiguracoes(guild.id)}>
            {t("servidor.menu.configuracoes")} <Settings data-gc="servidor.menu-do-servidor.settings" size={14} />
          </ContextMenuItem>

          <ContextMenuSeparator data-gc="servidor.menu-do-servidor.context-menu-separator--3" />

          {!guild.isOwner && (
            <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--8" danger onSelect={() => void sairDaComunidade()}>
              {t("servidor.menu.sair")} <DoorOpen data-gc="servidor.menu-do-servidor.door-open" size={14} />
            </ContextMenuItem>
          )}

          <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--9" danger onSelect={() => setDenunciando(true)}>
            {t("servidor.menu.denunciar")} <Flag data-gc="servidor.menu-do-servidor.flag" size={14} />
          </ContextMenuItem>

          <ContextMenuSeparator data-gc="servidor.menu-do-servidor.context-menu-separator--4" />

          <ContextMenuItem data-gc="servidor.menu-do-servidor.context-menu-item--10"
            onSelect={() => {
              void copiarTexto(guild.id);
              toast.success(t("servidor.menu.idCopiado"));
            }}
          >
            {t("servidor.menu.copiarId")} <Copy data-gc="servidor.menu-do-servidor.copy" size={14} />
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <DenunciarComunidade data-gc="servidor.menu-do-servidor.denunciar-comunidade" guild={guild} aberto={denunciando} onFechar={() => setDenunciando(false)} />
    </>
  );
};

const DenunciarComunidade: React.FC<{ guild: GuildSummaryModel; aberto: boolean; onFechar: () => void }> = ({
  guild,
  aberto,
  onFechar,
}) => {
  const { t } = useTranslation();
  const denunciar = useDenunciarGuild();
  const [motivo, setMotivo] = useState<MotivoDeDenuncia>("spam");
  const [detalhes, setDetalhes] = useState("");

  return (
    <Dialog data-gc="servidor.menu-do-servidor.dialog" open={aberto} onOpenChange={(a) => !a && onFechar()}>
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
              value={motivo}
              onSelect={(valor) => setMotivo(valor as MotivoDeDenuncia)}
              options={MOTIVOS_DE_DENUNCIA.map((m) => ({ value: m, label: t(`servidor.denuncia.motivos.${m}`) }))}
            />
          </div>

          <div data-gc="servidor.menu-do-servidor.div--2">
            <Label data-gc="servidor.menu-do-servidor.label--2" htmlFor="detalhes-da-denuncia">{t("servidor.denuncia.detalhes")}</Label>
            <Textarea data-gc="servidor.menu-do-servidor.textarea"
              id="detalhes-da-denuncia"
              value={detalhes}
              maxLength={1000}
              rows={4}
              onChange={(e) => setDetalhes(e.target.value)}
            />
          </div>
        </DialogBody>

        <DialogFooter data-gc="servidor.menu-do-servidor.dialog-footer">
          <Button data-gc="servidor.menu-do-servidor.button.on-fechar" variant="surface" onClick={onFechar}>{t("comum.cancelar")}</Button>
          <Button data-gc="servidor.menu-do-servidor.button"
            disabled={denunciar.isPending}
            onClick={() =>
              denunciar.mutate(
                { guildId: guild.id, motivo, detalhes: detalhes.trim() || undefined },
                {
                  onSuccess: () => {
                    toast.success(t("servidor.denuncia.enviada"));
                    setDetalhes("");
                    onFechar();
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
