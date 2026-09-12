import React, { useState } from "react";
import {
  Bell,
  BellOff,
  Bookmark,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  Gamepad2,
  Heart,
  Music,
  Settings,
  Shield,
  Star,
  Ungroup,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { VoiceServer } from "@gravae/shared";

import { useMarkServerRead } from "~/@core/application/queries/guild/use-marcar-servidor-lido";
import type { GuildSummaryModel } from "~/@core/domain/models/guild-model";
import { Button } from "~/components/ui/button";
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
import { Input, Label, colorFieldClass } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Tooltip } from "~/components/ui/tooltip";
import {
  ServerItem,
  DropBrand,
  DRAG_KIND,
  pointerZone,
  type DropZone,
} from "~/features/servidor/components/ItemDoServidor";
import { FOLDER_ICONS, type Destination, type FolderIcon, type FolderBox } from "~/features/servidor/lib/trilho";
import { useFolders } from "~/features/servidor/stores/pastas";
import { serverMuted, useNotices, type ChannelMode } from "~/stores/notificacoes";
import { cn } from "~/lib/utils";

const DRAWINGS: Record<FolderIcon, React.ComponentType<{ size?: number; className?: string }>> = {
  pasta: Folder,
  estrela: Star,
  coracao: Heart,
  salvar: Bookmark,
  jogo: Gamepad2,
  escudo: Shield,
  nota: Music,
};

const MINUTE = 60_000;
const DURATIONS: { key: string; ms: number }[] = [
  { key: "porQuinze", ms: 15 * MINUTE },
  { key: "porMeiaHora", ms: 30 * MINUTE },
  { key: "porUmaHora", ms: 60 * MINUTE },
  { key: "porTresHoras", ms: 3 * 60 * MINUTE },
  { key: "porOitoHoras", ms: 8 * 60 * MINUTE },
  { key: "porUmDia", ms: 24 * 60 * MINUTE },
  { key: "porTresDias", ms: 3 * 24 * 60 * MINUTE },
  { key: "ateReativar", ms: -1 },
];

const Brand: React.FC<{ on: boolean }> = ({ on }) => (
  <Check data-gc="servidor.pasta-do-trilho.check" size={14} className={on ? "text-brand" : "opacity-0"} />
);

interface RailPropsFolder {
  folder: FolderBox;
  guilds: GuildSummaryModel[];
  activeGuildId: string | null;
  byServer: Record<string, { notRead?: number; mentions?: number }>;
  voices: Record<string, VoiceServer[]>;
  onSelect: (guildId: string) => void;
  onInvite: (guildId: string) => void;
  onDrop: (guildId: string, destination: Destination) => void;
}

export const RailFolder: React.FC<RailPropsFolder> = ({
  folder,
  guilds,
  activeGuildId,
  byServer,
  voices,
  onSelect,
  onInvite,
  onDrop,
}) => {
  const { t } = useTranslation();
  const toggle = useFolders((s) => s.toggle);
  const undo = useFolders((s) => s.undo);
  const markRead = useMarkServerRead();
  const setServer = useNotices((s) => s.setServer);
  const prefs = useNotices((s) => s.byServer);
  const [zone, setZone] = useState<DropZone>(null);
  const [configuring, setConfiguring] = useState(false);

  const ids = guilds.map((g) => g.id);
  const active = guilds.some((g) => g.id === activeGuildId);
  const notRead = guilds.reduce((n, g) => n + (byServer[g.id]?.notRead ?? 0), 0);
  const mentions = guilds.reduce((n, g) => n + (byServer[g.id]?.mentions ?? 0), 0);
  const name = folder.name || guilds.map((g) => g.name).join(", ");
  const color = folder.color ?? "var(--color-brand)";
  const icon = folder.icon ?? "pasta";
  const Drawing = DRAWINGS[icon];
  const DrawingIsOpen = icon === "pasta" ? FolderOpen : Drawing;

  const muted = guilds.every((g) => serverMuted({ byServer: prefs }, g.id));
  const modeCommon = (() => {
    const modes = new Set(ids.map((id) => prefs[id]?.mode ?? null));
    return modes.size === 1 ? [...modes][0] : undefined;
  })();
  const hiding = ids.every((id) => prefs[id]?.hideMuted);

  const forAll = (change: Parameters<typeof setServer>[1]) =>
    ids.forEach((id) => setServer(id, change));

  const dragging = (e: React.DragEvent<HTMLElement>) => e.dataTransfer.types.includes(DRAG_KIND);

  const modes: { mode: ChannelMode | null; key: string }[] = [
    { mode: "tudo", key: "todas" },
    { mode: "mencoes", key: "soMencoes" },
    { mode: "nada", key: "nada" },
  ];

  const cover = (
    <button data-gc="servidor.pasta-do-trilho.button"
      type="button"
      onClick={() => toggle(folder.id)}
      aria-label={name}
      aria-expanded={folder.isOpen}
      className={cn(
        "flex size-[var(--guild-icon-size)] items-center justify-center overflow-hidden rounded-2xl transition-all duration-200 ease-out active:translate-y-px active:scale-95",
        folder.isOpen ? "bg-surface-0/70 hover:bg-surface-3" : "bg-surface-0 hover:bg-surface-3",
        zone === "juntar" && "ring-2 ring-brand ring-offset-2 ring-offset-surface-1",
      )}
      style={{ color: color }}
    >
      {folder.isOpen || folder.showIconMinimized ? (
        folder.isOpen ? (
          <DrawingIsOpen data-gc="servidor.pasta-do-trilho.drawing-is-open" size={22} />
        ) : (
          <Drawing data-gc="servidor.pasta-do-trilho.drawing" size={22} />
        )
      ) : (
        <span data-gc="servidor.pasta-do-trilho.span" className="grid size-9 grid-cols-2 gap-1">
          {guilds.slice(0, 4).map((g) => (
            <span data-gc="servidor.pasta-do-trilho.span--2" key={g.id} className="size-4 overflow-hidden rounded-full bg-surface-3 text-[8px] font-bold leading-4 text-ink">
              {g.iconUrl ? <img data-gc="servidor.pasta-do-trilho.img" src={g.iconUrl} alt="" draggable={false} className="size-full object-cover" /> : g.name.slice(0, 1)}
            </span>
          ))}
        </span>
      )}
    </button>
  );

  return (
    <>
      <ContextMenu data-gc="servidor.pasta-do-trilho.context-menu">
        <ContextMenuTrigger data-gc="servidor.pasta-do-trilho.context-menu-trigger" asChild>
          <div data-gc="servidor.pasta-do-trilho.div"
            className={cn("group/pasta relative flex w-full flex-col items-center", folder.isOpen && "py-1.5")}
            onDragOver={(e) => {
              if (!dragging(e)) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setZone(folder.isOpen ? "juntar" : pointerZone(e));
            }}
            onDragLeave={() => setZone(null)}
            onDrop={(e) => {
              const dragged = e.dataTransfer.getData(DRAG_KIND);
              const z = folder.isOpen ? "juntar" : pointerZone(e);
              setZone(null);
              if (!dragged) return;
              e.preventDefault();
              e.stopPropagation();

              if (z === "juntar") onDrop(dragged, { kind: "pasta", folderId: folder.id });
              else onDrop(dragged, { kind: z === "antes" ? "antes" : "depois", de: `pasta:${folder.id}` });
            }}
          >
            {folder.isOpen && (
              <span data-gc="servidor.pasta-do-trilho.span--3"
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-1.5 right-1.5 rounded-2xl"
                style={{ backgroundColor: `color-mix(in oklab, ${color}, transparent 88%)` }}
              />
            )}

            <DropBrand data-gc="servidor.pasta-do-trilho.drop-brand" zone={zone} />

            <div data-gc="servidor.pasta-do-trilho.div--2" className="relative flex w-full justify-center">
              <span data-gc="servidor.pasta-do-trilho.span--4"
                className={cn(
                  "absolute left-0 top-1/2 w-1 -translate-y-1/2 transition-all",
                  active && !folder.isOpen
                    ? "h-10"
                    : notRead > 0 && !folder.isOpen && !muted
                      ? "h-2 group-hover/pasta:h-5"
                      : "h-0 group-hover/pasta:h-5",
                )}
              >
                <span data-gc="servidor.pasta-do-trilho.span--5" className="block size-full rounded-r-full bg-pilula" />
              </span>

              <Tooltip data-gc="servidor.pasta-do-trilho.tooltip" side="right" label={name}>{cover}</Tooltip>

              {mentions > 0 && !folder.isOpen && (
                <span data-gc="servidor.pasta-do-trilho.span--6" className="pointer-events-none absolute bottom-0 right-3 flex min-w-[20px] items-center justify-center rounded-full border-2 border-surface-1 bg-danger px-1 text-11 font-bold leading-4 text-sobre-marca">
                  {mentions > 99 ? "99+" : mentions}
                </span>
              )}
            </div>

            {folder.isOpen && (
              <div data-gc="servidor.pasta-do-trilho.div--3" className="mt-2 flex w-full flex-col items-center gap-2">
                {guilds.map((guild) => (
                  <ServerItem data-gc="servidor.pasta-do-trilho.server-item.on-select"
                    key={guild.id}
                    guild={guild}
                    active={guild.id === activeGuildId}
                    notRead={byServer[guild.id]?.notRead ?? 0}
                    mentions={byServer[guild.id]?.mentions ?? 0}
                    voices={voices[guild.id] ?? []}
                    onSelect={onSelect}
                    onInvite={() => onInvite(guild.id)}
                    onDrop={onDrop}
                    folderId={folder.id}
                  />
                ))}
              </div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent data-gc="servidor.pasta-do-trilho.context-menu-content">
          <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item" onSelect={() => ids.forEach((id) => markRead.mutate(id))}>
            {t("servidor.pasta.marcarLida")} <Eye data-gc="servidor.pasta-do-trilho.eye" size={14} />
          </ContextMenuItem>

          <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator" />

          <ContextMenuSub data-gc="servidor.pasta-do-trilho.context-menu-sub">
            <ContextMenuSubTrigger data-gc="servidor.pasta-do-trilho.context-menu-sub-trigger">
              {t("servidor.pasta.silenciarTodas")} <BellOff data-gc="servidor.pasta-do-trilho.bell-off" size={14} />
            </ContextMenuSubTrigger>
            <ContextMenuSubContent data-gc="servidor.pasta-do-trilho.context-menu-sub-content">
              {DURATIONS.map((d) => (
                <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--2"
                  key={d.key}
                  onSelect={() => forAll({ mutedUntil: d.ms === -1 ? -1 : Date.now() + d.ms })}
                >
                  {t(`servidor.menu.${d.key}`)}
                </ContextMenuItem>
              ))}

              <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator--2" />

              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--3" onSelect={() => forAll({ mutedUntil: null })}>
                {t("servidor.pasta.reativarTodas")} <Brand data-gc="servidor.pasta-do-trilho.brand" on={!muted} />
              </ContextMenuItem>

              <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator--3" />

              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--4" onSelect={() => forAll({ hideMuted: true })}>
                {t("servidor.menu.ocultarSilenciados")} <Brand data-gc="servidor.pasta-do-trilho.brand--2" on={hiding} />
              </ContextMenuItem>
              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--5" onSelect={() => forAll({ hideMuted: false })}>
                {t("servidor.pasta.mostrarSilenciados")} <Brand data-gc="servidor.pasta-do-trilho.brand--3" on={!hiding} />
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSub data-gc="servidor.pasta-do-trilho.context-menu-sub--2">
            <ContextMenuSubTrigger data-gc="servidor.pasta-do-trilho.context-menu-sub-trigger--2">
              {t("servidor.pasta.notificacoesDaComunidade")} <Bell data-gc="servidor.pasta-do-trilho.bell" size={14} />
            </ContextMenuSubTrigger>
            <ContextMenuSubContent data-gc="servidor.pasta-do-trilho.context-menu-sub-content--2">
              {modes.map((m) => (
                <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--6" key={m.key} onSelect={() => forAll({ mode: m.mode })}>
                  {t(`servidor.menu.${m.key}`)} <Brand data-gc="servidor.pasta-do-trilho.brand--4" on={modeCommon === m.mode} />
                </ContextMenuItem>
              ))}

              <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator--4" />

              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--7" onSelect={() => forAll({ everyone: false })}>
                {t("servidor.pasta.silenciarEveryone")}
              </ContextMenuItem>
              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--8" onSelect={() => forAll({ everyone: true })}>
                {t("servidor.pasta.permitirEveryone")}
              </ContextMenuItem>

              <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator--5" />

              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--9" onSelect={() => forAll({ roleList: false })}>
                {t("servidor.pasta.silenciarCargos")}
              </ContextMenuItem>
              <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--10" onSelect={() => forAll({ roleList: true })}>
                {t("servidor.pasta.permitirCargos")}
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator data-gc="servidor.pasta-do-trilho.context-menu-separator--6" />

          <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--11" onSelect={() => setConfiguring(true)}>
            {t("servidor.pasta.configuracoes")} <Settings data-gc="servidor.pasta-do-trilho.settings" size={14} />
          </ContextMenuItem>

          <ContextMenuItem data-gc="servidor.pasta-do-trilho.context-menu-item--12" onSelect={() => undo(folder.id)}>
            {t("servidor.pasta.desfazer")} <Ungroup data-gc="servidor.pasta-do-trilho.ungroup" size={14} />
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <FolderSettings data-gc="servidor.pasta-do-trilho.folder-settings"
        folder={folder}
        suggestion={guilds.map((g) => g.name).join(", ")}
        isOpen={configuring}
        onClose={() => setConfiguring(false)}
        onUndo={() => {
          setConfiguring(false);
          undo(folder.id);
        }}
      />
    </>
  );
};

const FolderSettings: React.FC<{
  folder: FolderBox;
  suggestion: string;
  isOpen: boolean;
  onClose: () => void;
  onUndo: () => void;
}> = ({ folder, suggestion, isOpen, onClose, onUndo }) => {
  const { t } = useTranslation();
  const edit = useFolders((s) => s.edit);

  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState(folder.color ?? "");
  const [icon, setIcon] = useState<FolderIcon>(folder.icon ?? "pasta");
  const [minimized, setMinimized] = useState(folder.showIconMinimized ?? false);

  const save = () => {
    edit(folder.id, {
      name: name.trim(),
      color: color.trim() || null,
      icon,
      showIconMinimized: minimized,
    });
    onClose();
  };

  return (
    <Dialog data-gc="servidor.pasta-do-trilho.dialog" open={isOpen} onOpenChange={(a) => !a && onClose()}>
      <DialogContent data-gc="servidor.pasta-do-trilho.dialog-content" className="max-w-md">
        <DialogHeader data-gc="servidor.pasta-do-trilho.dialog-header">
          <DialogTitle data-gc="servidor.pasta-do-trilho.dialog-title">{t("servidor.pasta.configuracoes")}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="servidor.pasta-do-trilho.dialog-body" className="space-y-5">
          <div data-gc="servidor.pasta-do-trilho.div--4">
            <Label data-gc="servidor.pasta-do-trilho.label" htmlFor="nome-da-pasta">{t("servidor.pasta.nome")}</Label>
            <Input data-gc="servidor.pasta-do-trilho.input"
              id="nome-da-pasta"
              value={name}
              maxLength={40}
              placeholder={suggestion}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div data-gc="servidor.pasta-do-trilho.div--5">
            <Label data-gc="servidor.pasta-do-trilho.label--2" htmlFor="cor-da-pasta">{t("servidor.pasta.cor")}</Label>
            <div data-gc="servidor.pasta-do-trilho.div--6" className="flex items-center gap-2">
              <Input data-gc="servidor.pasta-do-trilho.input--2"
                id="cor-da-pasta"
                value={color}
                maxLength={32}
                placeholder={t("servidor.pasta.semCor")}
                onChange={(e) => setColor(e.target.value)}
              />
              <input data-gc="servidor.pasta-do-trilho.input--3"
                type="color"
                aria-label={t("servidor.pasta.cor")}
                value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#5865f2"}
                onChange={(e) => setColor(e.target.value)}
                className={cn(colorFieldClass, "size-10")}
              />
            </div>
            <p data-gc="servidor.pasta-do-trilho.p" className="mt-1.5 text-xs text-ink-faint">{t("servidor.pasta.dicaDaCor")}</p>
          </div>

          <div data-gc="servidor.pasta-do-trilho.div--7" className="flex items-start justify-between gap-4">
            <div data-gc="servidor.pasta-do-trilho.div--8" className="min-w-0">
              <p data-gc="servidor.pasta-do-trilho.p--2" className="text-sm font-medium">{t("servidor.pasta.mostrarIcone")}</p>
              <p data-gc="servidor.pasta-do-trilho.p--3" className="mt-0.5 text-xs text-ink-faint">{t("servidor.pasta.dicaDoIcone")}</p>
            </div>
            <Switch data-gc="servidor.pasta-do-trilho.switch.set-minimized" checked={minimized} onCheckedChange={setMinimized} />
          </div>

          <div data-gc="servidor.pasta-do-trilho.div--9">
            <Label data-gc="servidor.pasta-do-trilho.label--3" htmlFor="icone-da-pasta">{t("servidor.pasta.icone")}</Label>
            <SelectField data-gc="servidor.pasta-do-trilho.select-field"
              id="icone-da-pasta"
              value={icon}
              onSelect={(value) => setIcon(value as FolderIcon)}
              options={FOLDER_ICONS.map((iconName) => {
                const Drawing = DRAWINGS[iconName];

                return {
                  value: iconName,
                  label: (
                    <span data-gc="servidor.pasta-do-trilho.span--7" className="flex items-center gap-2">
                      <Drawing data-gc="servidor.pasta-do-trilho.drawing--2" size={15} />
                      {t(`servidor.pasta.icones.${iconName}`)}
                    </span>
                  ),
                };
              })}
            />
          </div>
        </DialogBody>

        <DialogFooter data-gc="servidor.pasta-do-trilho.dialog-footer" className="justify-between">
          <Button data-gc="servidor.pasta-do-trilho.button.on-undo" variant="danger" onClick={onUndo}>
            {t("servidor.pasta.excluir")}
          </Button>

          <span data-gc="servidor.pasta-do-trilho.span--8" className="flex gap-2">
            <Button data-gc="servidor.pasta-do-trilho.button.on-close" variant="surface" onClick={onClose}>
              {t("comum.cancelar")}
            </Button>
            <Button data-gc="servidor.pasta-do-trilho.button.save" onClick={save}>{t("servidor.pasta.salvar")}</Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
