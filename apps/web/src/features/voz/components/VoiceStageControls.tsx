import React from "react";
import {
  ChevronUp,
  Headphones,
  Maximize,
  Mic,
  Minimize,
  MonitorUp,
  MessageSquare,
  MoreHorizontal,
  PhoneOff,
  Settings,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import { IconeRiscado } from "~/features/voz/components/IconeRiscado";
import { Tooltip } from "~/components/ui/tooltip";
import { deviceName, useDevices } from "~/features/voz/hooks/use-dispositivos";
import { useScreenFull } from "~/features/voz/hooks/use-tela-cheia";
import { cn } from "~/lib/utils";
import { flx } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

export const VoiceStageControls: React.FC<{
  fullTargetScreen?: React.RefObject<HTMLElement | null>;
  showChat?: boolean;
}> = ({ fullTargetScreen, showChat }) => {
  const { t } = useTranslation();
  const fullScreen = useScreenFull(fullTargetScreen);
  const openSettings = useSettings((s) => s.open);

  const {
    micEnabled,
    micBlocked,
    deafened,
    cameraEnabled,
    screenEnabled,
    toggleMic,
    toggleDeafen,
    toggleCamera,
    toggleScreen,
    leave,
  } = useVoiceStore();

  const callChat = useVoiceStore((s) => s.callChat);
  const toggleCallChat = useVoiceStore((s) => s.toggleCallChat);
  const prefs = useVoicePrefs();
  const { entries, outputs, cameras } = useDevices();

  const canSwapOutput =
    typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

  const [menusIsOpen, setMenusIsOpen] = React.useState(0);
  const onToggleMenu = React.useCallback(
    (isOpen: boolean) => setMenusIsOpen((n) => Math.max(0, n + (isOpen ? 1 : -1))),
    [],
  );

  return (
    <div data-gc="voz.voice-stage-controls.div"
      {...flx(
        "controlsCallBar",
        cn(
          "pointer-events-none absolute inset-x-0 bottom-4 flex items-center gap-2 px-4",
          "transition-opacity duration-150",
          menusIsOpen > 0
            ? "opacity-100"
            : "opacity-0 focus-within:opacity-100 group-hover:opacity-100",
        ),
      )}
    >
      <div data-gc="voz.voice-stage-controls.div--2" className="flex flex-1 justify-start">
        {showChat && (
        <Tooltip data-gc="voz.voice-stage-controls.tooltip" label={callChat ? "Esconder o chat" : "Mostrar o chat"}>
          <button data-gc="voz.voice-stage-controls.button.toggle-call-chat"
            onClick={toggleCallChat}
            aria-label={callChat ? "Esconder o chat" : "Mostrar o chat"}
            aria-pressed={callChat}
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-surface-0/95 text-ink-muted shadow-lg ring-1 ring-line-sutil backdrop-blur transition hover:text-ink"
          >
            <MessageSquare data-gc="voz.voice-stage-controls.message-square" size={18} />
          </button>
        </Tooltip>
        )}
      </div>

      <div data-gc="voz.voice-stage-controls.div--3" className="pointer-events-auto flex items-center gap-1 rounded-full bg-surface-0/95 p-1.5 shadow-lg ring-1 ring-line-sutil backdrop-blur [--cor-do-vao:var(--color-surface-0)]">
        <Control data-gc="voz.voice-stage-controls.control.on-toggle-menu"
          onOpenChange={onToggleMenu}
          label={micBlocked ? "Microfone bloqueado" : micEnabled ? "Mutar" : "Desmutar"}
          labelDoMenu={t("chamada.aparelhos.configEntrada")}
          onClick={() => void toggleMic()}
          active={micEnabled && !micBlocked}
          menu={
            <>
              <DropdownMenuLabel data-gc="voz.voice-stage-controls.dropdown-menu-label">{t("chamada.aparelhos.entrada")}</DropdownMenuLabel>
              <DropdownMenuRadioGroup data-gc="voz.voice-stage-controls.dropdown-menu-radio-group"
                value={prefs.entryId ?? "padrao"}
                onValueChange={(value) =>
                  prefs.set({ entryId: value === "padrao" ? null : value })
                }
              >
                <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item" value="padrao">{t("chamada.aparelhos.oDoSistema")}</DropdownMenuRadioItem>
                {entries.map((device, i) => (
                  <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item--2" key={device.deviceId} value={device.deviceId}>
                    {deviceName(device, i, t("chamada.aparelhos.microfone"))}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator" />
              <VolumeTrack data-gc="voz.voice-stage-controls.volume-track"
                label={t("chamada.volume.entrada")}
                value={prefs.gainEntry}
                max={2}
                onChange={(v) => prefs.set({ gainEntry: v })}
              />

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--2" />
              <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item" onSelect={() => openSettings("voice")}>
                {t("chamada.aparelhos.configEntrada")} <Settings data-gc="voz.voice-stage-controls.settings" size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          <IconeRiscado
            data-gc="voz.voice-stage-controls.icone-riscado"
            icone={Mic}
            riscado={!micEnabled || micBlocked}
            alerta
          />
        </Control>

        <Control data-gc="voz.voice-stage-controls.control.on-toggle-menu--2"
          onOpenChange={onToggleMenu}
          label={deafened ? "Ouvir" : "Ficar surdo"}
          labelDoMenu={t("chamada.aparelhos.configSaida")}
          onClick={() => void toggleDeafen()}
          active={!deafened}
          menu={
            <>
              <DropdownMenuLabel data-gc="voz.voice-stage-controls.dropdown-menu-label--2">{t("chamada.aparelhos.saida")}</DropdownMenuLabel>
              {canSwapOutput ? (
                <DropdownMenuRadioGroup data-gc="voz.voice-stage-controls.dropdown-menu-radio-group--2"
                  value={prefs.outputId ?? "padrao"}
                  onValueChange={(value) =>
                    prefs.set({ outputId: value === "padrao" ? null : value })
                  }
                >
                  <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item--3" value="padrao">{t("chamada.aparelhos.oDoSistema")}</DropdownMenuRadioItem>
                  {outputs.map((device, i) => (
                    <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item--4" key={device.deviceId} value={device.deviceId}>
                      {deviceName(device, i, t("chamada.aparelhos.saidaCurto"))}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              ) : (
                <p data-gc="voz.voice-stage-controls.p" className="px-2 py-1.5 text-xs text-ink-faint">
                  Este navegador não deixa escolher a saída — quem manda é o sistema.
                </p>
              )}

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--3" />
              <VolumeTrack data-gc="voz.voice-stage-controls.volume-track--2"
                label={t("chamada.volume.saida")}
                value={prefs.volumeOutput}
                max={1}
                onChange={(v) => prefs.set({ volumeOutput: v })}
              />

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--4" />
              <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item--2" onSelect={() => openSettings("voice")}>
                {t("chamada.aparelhos.configSaida")} <Settings data-gc="voz.voice-stage-controls.settings--2" size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          <IconeRiscado
            data-gc="voz.voice-stage-controls.icone-riscado--2"
            icone={Headphones}
            riscado={deafened}
            alerta
          />
        </Control>

        <Control data-gc="voz.voice-stage-controls.control.on-toggle-menu--3"
          onOpenChange={onToggleMenu}
          label={cameraEnabled ? "Desligar a câmera" : "Ligar a câmera"}
          labelDoMenu={t("chamada.aparelhos.configCamera")}
          onClick={() => void toggleCamera()}
          active={cameraEnabled}
          menu={
            <>
              <DropdownMenuLabel data-gc="voz.voice-stage-controls.dropdown-menu-label--3">{t("chamada.aparelhos.camera")}</DropdownMenuLabel>
              <DropdownMenuRadioGroup data-gc="voz.voice-stage-controls.dropdown-menu-radio-group--3"
                value={prefs.cameraId ?? "padrao"}
                onValueChange={(value) =>
                  prefs.set({ cameraId: value === "padrao" ? null : value })
                }
              >
                <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item--5" value="padrao">{t("chamada.aparelhos.aDoSistema")}</DropdownMenuRadioItem>
                {cameras.map((device, i) => (
                  <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item--6" key={device.deviceId} value={device.deviceId}>
                    {deviceName(device, i, t("chamada.aparelhos.camera"))}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--5" />
              <DropdownMenuCheckboxItem data-gc="voz.voice-stage-controls.dropdown-menu-checkbox-item"
                checked={prefs.mirrorCamera}
                onCheckedChange={(marked) => prefs.set({ mirrorCamera: marked })}
              >
                {t("chamada.aparelhos.espelhar")}
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--6" />
              <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item--3" onSelect={() => openSettings("voice")}>
                {t("chamada.aparelhos.configCamera")} <Settings data-gc="voz.voice-stage-controls.settings--3" size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          <IconeRiscado
            data-gc="voz.voice-stage-controls.icone-riscado--3"
            icone={Video}
            riscado={!cameraEnabled}
          />
        </Control>

        <Control data-gc="voz.voice-stage-controls.control.on-toggle-menu--4"
          onOpenChange={onToggleMenu}
          label={screenEnabled ? t("chamada.tela.pararDeCompartilhar") : t("chamada.tela.compartilhar")}
          labelDoMenu={t("chamada.tela.configCompartilhamento")}
          onClick={() => void toggleScreen()}
          active={screenEnabled}
          menu={
            <>
              <DropdownMenuLabel data-gc="voz.voice-stage-controls.dropdown-menu-label--4">{t("chamada.tela.compartilhar")}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem data-gc="voz.voice-stage-controls.dropdown-menu-checkbox-item--2"
                checked={prefs.screenSound}
                onCheckedChange={(marked) => prefs.set({ screenSound: marked })}
              >
                {t("chamada.tela.somDoComputador")}
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--7" />
              <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item--4" onSelect={() => openSettings("voice")}>
                {t("chamada.tela.configCompartilhamento")} <Settings data-gc="voz.voice-stage-controls.settings--4" size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          <IconeRiscado
            data-gc="voz.voice-stage-controls.icone-riscado--4"
            icone={MonitorUp}
            riscado={!screenEnabled}
          />
        </Control>

        <DropdownMenu data-gc="voz.voice-stage-controls.dropdown-menu.on-toggle-menu" onOpenChange={onToggleMenu}>
          <Tooltip data-gc="voz.voice-stage-controls.tooltip--2" label={t("chamada.maisOpcoes")}>
            <DropdownMenuTrigger data-gc="voz.voice-stage-controls.dropdown-menu-trigger" asChild>
              <button data-gc="voz.voice-stage-controls.button"
                aria-label={t("chamada.maisOpcoes")}
                className="flex size-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-3 hover:text-ink"
              >
                <MoreHorizontal data-gc="voz.voice-stage-controls.more-horizontal" size={18} />
              </button>
            </DropdownMenuTrigger>
          </Tooltip>

          <DropdownMenuContent data-gc="voz.voice-stage-controls.dropdown-menu-content" side="top" align="center" className="w-64">
            <DropdownMenuCheckboxItem data-gc="voz.voice-stage-controls.dropdown-menu-checkbox-item--3"
              checked={prefs.showWithoutVideo}
              onCheckedChange={(marked) => prefs.set({ showWithoutVideo: marked })}
            >
              {t("chamada.tela.mostrarSemVideo")}
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--8" />
            <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item--5" onSelect={() => void fullScreen.toggle()}>
              {fullScreen.active ? "Sair da tela cheia" : "Entrar em tela cheia"}
              {fullScreen.active ? <Minimize data-gc="voz.voice-stage-controls.minimize" size={15} /> : <Maximize data-gc="voz.voice-stage-controls.maximize" size={15} />}
            </DropdownMenuItem>

            <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item--6" onSelect={() => openSettings("voice")}>
              {t("chamada.aparelhos.configAudioEVideo")} <Settings data-gc="voz.voice-stage-controls.settings--5" size={15} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span data-gc="voz.voice-stage-controls.span" className="mx-0.5 h-6 w-px bg-palco-ink/10" aria-hidden />

        <Tooltip data-gc="voz.voice-stage-controls.tooltip--3" label={t("chamada.sairDaVoz")}>
          <button data-gc="voz.voice-stage-controls.button--2"
            onClick={() => void leave()}
            aria-label={t("chamada.sairDaVoz")}
            className="flex size-10 items-center justify-center rounded-full bg-danger text-palco-ink transition hover:brightness-110"
          >
            <PhoneOff data-gc="voz.voice-stage-controls.phone-off" size={18} />
          </button>
        </Tooltip>
      </div>

      <div data-gc="voz.voice-stage-controls.div--4" className="pointer-events-auto flex flex-1 items-center justify-end gap-1">
        <VolumeDaLive data-gc="voz.voice-stage-controls.volume-da-live.on-toggle-menu" onOpenChange={onToggleMenu} />

        <Tooltip data-gc="voz.voice-stage-controls.tooltip--4" label={fullScreen.active ? "Sair da tela cheia" : "Entrar em tela cheia"}>
          <button data-gc="voz.voice-stage-controls.button--3"
            onClick={() => void fullScreen.toggle()}
            aria-label={fullScreen.active ? "Sair da tela cheia" : "Entrar em tela cheia"}
            className="flex size-10 items-center justify-center rounded-full text-ink-muted drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition hover:text-ink"
          >
            {fullScreen.active ? <Minimize data-gc="voz.voice-stage-controls.minimize--2" size={18} /> : <Maximize data-gc="voz.voice-stage-controls.maximize--2" size={18} />}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

const VolumeDaLive: React.FC<{ onOpenChange?: (isOpen: boolean) => void }> = ({
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const watching = useVoiceStore((s) => s.watching);
  const volume = useVoiceStore((s) =>
    s.watching ? Math.min(1, s.screenVolumes[s.watching] ?? 1) : 1,
  );
  const set = useVoiceStore((s) => s.setScreenVolume);

  if (!watching) return null;

  return (
    <Popover data-gc="voz.voice-stage-controls.popover.on-open-change" onOpenChange={onOpenChange}>
      <Tooltip data-gc="voz.voice-stage-controls.tooltip--5"
        label={
          volume === 0
            ? t("chamada.volume.liveSemSom")
            : t("chamada.volume.liveComPorcento", { porcento: Math.round(volume * 100) })
        }
      >
        <PopoverTrigger data-gc="voz.voice-stage-controls.popover-trigger" asChild>
          <button data-gc="voz.voice-stage-controls.button--4"
            aria-label={t("chamada.volume.live")}
            className="flex size-10 items-center justify-center rounded-full text-ink-muted drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition hover:text-ink"
          >
            {volume === 0 ? <VolumeX data-gc="voz.voice-stage-controls.volume-x" size={18} /> : <Volume2 data-gc="voz.voice-stage-controls.volume2" size={18} />}
          </button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent data-gc="voz.voice-stage-controls.popover-content" side="top" align="center" className="w-auto p-3">
        <PopoverArrow data-gc="voz.voice-stage-controls.popover-arrow" />

        <div data-gc="voz.voice-stage-controls.div--5" className="flex w-48 items-center gap-2.5">
          <button data-gc="voz.voice-stage-controls.button--5"
            type="button"
            aria-label={t("chamada.volume.liveSemSom")}
            onClick={() => set(watching, volume === 0 ? 1 : 0)}
            className="shrink-0 text-ink-faint transition hover:text-ink"
          >
            {volume === 0 ? <VolumeX data-gc="voz.voice-stage-controls.volume-x--2" size={16} /> : <Volume2 data-gc="voz.voice-stage-controls.volume2--2" size={16} />}
          </button>

          <Slider data-gc="voz.voice-stage-controls.slider"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            filled={volume}
            aria-label={t("chamada.volume.live")}
            onChange={(e) => set(watching, Number(e.target.value))}
            className="min-w-0 flex-1"
          />

          <span data-gc="voz.voice-stage-controls.span--2" className="w-9 shrink-0 text-right text-xs tabular-nums text-ink-faint">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Control: React.FC<{
  children: React.ReactNode;
  label: string;
  labelDoMenu: string;
  onClick: () => void;
  active?: boolean;
  menu: React.ReactNode;
  onOpenChange?: (isOpen: boolean) => void;
}> = ({ children, label, labelDoMenu, onClick, active, menu, onOpenChange }) => (
  <div data-gc="voz.voice-stage-controls.div--6" className="relative">
    <Tooltip data-gc="voz.voice-stage-controls.tooltip--6" label={label}>
      <button data-gc="voz.voice-stage-controls.button.on-click"
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          "flex size-10 items-center justify-center rounded-full transition",
          // O vão do risco acompanha o fundo do botão, senão aparece um rastro
          // da cor da barra em cima do hover.
          "hover:[--cor-do-vao:var(--color-surface-3)]",
          active
            ? "bg-surface-3 text-ink hover:bg-surface-4 [--cor-do-vao:var(--color-surface-3)]"
            : "text-ink-muted hover:bg-surface-3 hover:text-ink",
        )}
      >
        {children}
      </button>
    </Tooltip>

    <DropdownMenu data-gc="voz.voice-stage-controls.dropdown-menu.on-open-change" onOpenChange={onOpenChange}>
      <Tooltip data-gc="voz.voice-stage-controls.tooltip--7" label={labelDoMenu}>
        <DropdownMenuTrigger data-gc="voz.voice-stage-controls.dropdown-menu-trigger--2" asChild>
          <button data-gc="voz.voice-stage-controls.button--6"
            aria-label={labelDoMenu}
            className="absolute -top-1 right-0 flex size-4 items-center justify-center rounded-full bg-surface-3 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
          >
            <ChevronUp data-gc="voz.voice-stage-controls.chevron-up" size={11} />
          </button>
        </DropdownMenuTrigger>
      </Tooltip>

      <DropdownMenuContent data-gc="voz.voice-stage-controls.dropdown-menu-content--2" side="top" align="center" className="w-64">
        {menu}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

const VolumeTrack: React.FC<{
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}> = ({ label, value, max, onChange }) => (
  <div data-gc="voz.voice-stage-controls.div--7" className="px-2 py-1.5">
    <p data-gc="voz.voice-stage-controls.p--2" className="mb-1.5 flex items-center justify-between text-xs">
      <span data-gc="voz.voice-stage-controls.span--3" className="font-medium text-ink-muted">{label}</span>
      <span data-gc="voz.voice-stage-controls.span--4" className="tabular-nums text-ink-faint">{Math.round(value * 100)}%</span>
    </p>

    <Slider data-gc="voz.voice-stage-controls.slider--2"
      min={0}
      max={max}
      step={0.05}
      value={value}
      filled={value / max}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
);
