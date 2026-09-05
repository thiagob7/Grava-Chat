import React from "react";
import {
  ChevronUp,
  Headphones,
  HeadphoneOff,
  Maximize,
  Mic,
  MicOff,
  Minimize,
  MonitorUp,
  MonitorX,
  MessageSquare,
  MoreHorizontal,
  PhoneOff,
  Settings,
  Video,
  VideoOff,
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
import { Tooltip } from "~/components/ui/tooltip";
import { nomeDoDispositivo, useDispositivos } from "~/features/voz/hooks/use-dispositivos";
import { useTelaCheia } from "~/features/voz/hooks/use-tela-cheia";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

export const VoiceStageControls: React.FC<{
  alvoTelaCheia?: React.RefObject<HTMLElement | null>;
  mostrarChat?: boolean;
}> = ({ alvoTelaCheia, mostrarChat }) => {
  const { t } = useTranslation();
  const telaCheia = useTelaCheia(alvoTelaCheia);
  const abrirConfiguracoes = useConfiguracoes((s) => s.abrir);

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

  const chatDaChamada = useVoiceStore((s) => s.chatDaChamada);
  const alternarChatDaChamada = useVoiceStore((s) => s.alternarChatDaChamada);
  const prefs = useVoicePrefs();
  const { entradas, saidas, cameras } = useDispositivos();

  const podeTrocarSaida =
    typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

  const [menusAbertos, setMenusAbertos] = React.useState(0);
  const aoAlternarMenu = React.useCallback(
    (aberto: boolean) => setMenusAbertos((n) => Math.max(0, n + (aberto ? 1 : -1))),
    [],
  );

  return (
    <div data-gc="voz.voice-stage-controls.div"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-4 flex items-center gap-2 px-4",
        "transition-opacity duration-150",
        menusAbertos > 0
          ? "opacity-100"
          : "opacity-0 focus-within:opacity-100 group-hover:opacity-100",
      )}
    >
      <div data-gc="voz.voice-stage-controls.div--2" className="flex flex-1 justify-start">
        {mostrarChat && (
        <Tooltip data-gc="voz.voice-stage-controls.tooltip" label={chatDaChamada ? "Esconder o chat" : "Mostrar o chat"}>
          <button data-gc="voz.voice-stage-controls.button.alternar-chat-da-chamada"
            onClick={alternarChatDaChamada}
            aria-label={chatDaChamada ? "Esconder o chat" : "Mostrar o chat"}
            aria-pressed={chatDaChamada}
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-surface-0/95 text-ink-muted shadow-lg ring-1 ring-black/30 backdrop-blur transition hover:text-ink"
          >
            <MessageSquare data-gc="voz.voice-stage-controls.message-square" size={18} />
          </button>
        </Tooltip>
        )}
      </div>

      <div data-gc="voz.voice-stage-controls.div--3" className="pointer-events-auto flex items-center gap-1 rounded-full bg-surface-0/95 p-1.5 shadow-lg ring-1 ring-black/30 backdrop-blur">
        <Controle data-gc="voz.voice-stage-controls.controle.ao-alternar-menu"
          onOpenChange={aoAlternarMenu}
          label={micBlocked ? "Microfone bloqueado" : micEnabled ? "Mutar" : "Desmutar"}
          labelDoMenu={t("chamada.aparelhos.configEntrada")}
          onClick={() => void toggleMic()}
          ativo={micEnabled && !micBlocked}
          menu={
            <>
              <DropdownMenuLabel data-gc="voz.voice-stage-controls.dropdown-menu-label">{t("chamada.aparelhos.entrada")}</DropdownMenuLabel>
              <DropdownMenuRadioGroup data-gc="voz.voice-stage-controls.dropdown-menu-radio-group"
                value={prefs.entradaId ?? "padrao"}
                onValueChange={(valor) =>
                  prefs.definir({ entradaId: valor === "padrao" ? null : valor })
                }
              >
                <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item" value="padrao">{t("chamada.aparelhos.oDoSistema")}</DropdownMenuRadioItem>
                {entradas.map((aparelho, i) => (
                  <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item--2" key={aparelho.deviceId} value={aparelho.deviceId}>
                    {nomeDoDispositivo(aparelho, i, t("chamada.aparelhos.microfone"))}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator" />
              <FaixaDeVolume data-gc="voz.voice-stage-controls.faixa-de-volume"
                rotulo={t("chamada.volume.entrada")}
                valor={prefs.ganhoEntrada}
                max={2}
                onMudar={(v) => prefs.definir({ ganhoEntrada: v })}
              />

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--2" />
              <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item" onSelect={() => abrirConfiguracoes("voz")}>
                {t("chamada.aparelhos.configEntrada")} <Settings data-gc="voz.voice-stage-controls.settings" size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {micEnabled && !micBlocked ? <Mic data-gc="voz.voice-stage-controls.mic" size={18} /> : <MicOff data-gc="voz.voice-stage-controls.mic-off" size={18} className="text-danger" />}
        </Controle>

        <Controle data-gc="voz.voice-stage-controls.controle.ao-alternar-menu--2"
          onOpenChange={aoAlternarMenu}
          label={deafened ? "Ouvir" : "Ficar surdo"}
          labelDoMenu={t("chamada.aparelhos.configSaida")}
          onClick={() => void toggleDeafen()}
          ativo={!deafened}
          menu={
            <>
              <DropdownMenuLabel data-gc="voz.voice-stage-controls.dropdown-menu-label--2">{t("chamada.aparelhos.saida")}</DropdownMenuLabel>
              {podeTrocarSaida ? (
                <DropdownMenuRadioGroup data-gc="voz.voice-stage-controls.dropdown-menu-radio-group--2"
                  value={prefs.saidaId ?? "padrao"}
                  onValueChange={(valor) =>
                    prefs.definir({ saidaId: valor === "padrao" ? null : valor })
                  }
                >
                  <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item--3" value="padrao">{t("chamada.aparelhos.oDoSistema")}</DropdownMenuRadioItem>
                  {saidas.map((aparelho, i) => (
                    <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item--4" key={aparelho.deviceId} value={aparelho.deviceId}>
                      {nomeDoDispositivo(aparelho, i, t("chamada.aparelhos.saidaCurto"))}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              ) : (
                <p data-gc="voz.voice-stage-controls.p" className="px-2 py-1.5 text-xs text-ink-faint">
                  Este navegador não deixa escolher a saída — quem manda é o sistema.
                </p>
              )}

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--3" />
              <FaixaDeVolume data-gc="voz.voice-stage-controls.faixa-de-volume--2"
                rotulo={t("chamada.volume.saida")}
                valor={prefs.volumeSaida}
                max={1}
                onMudar={(v) => prefs.definir({ volumeSaida: v })}
              />

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--4" />
              <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item--2" onSelect={() => abrirConfiguracoes("voz")}>
                {t("chamada.aparelhos.configSaida")} <Settings data-gc="voz.voice-stage-controls.settings--2" size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {deafened ? <HeadphoneOff data-gc="voz.voice-stage-controls.headphone-off" size={18} className="text-danger" /> : <Headphones data-gc="voz.voice-stage-controls.headphones" size={18} />}
        </Controle>

        <Controle data-gc="voz.voice-stage-controls.controle.ao-alternar-menu--3"
          onOpenChange={aoAlternarMenu}
          label={cameraEnabled ? "Desligar a câmera" : "Ligar a câmera"}
          labelDoMenu={t("chamada.aparelhos.configCamera")}
          onClick={() => void toggleCamera()}
          ativo={cameraEnabled}
          menu={
            <>
              <DropdownMenuLabel data-gc="voz.voice-stage-controls.dropdown-menu-label--3">{t("chamada.aparelhos.camera")}</DropdownMenuLabel>
              <DropdownMenuRadioGroup data-gc="voz.voice-stage-controls.dropdown-menu-radio-group--3"
                value={prefs.cameraId ?? "padrao"}
                onValueChange={(valor) =>
                  prefs.definir({ cameraId: valor === "padrao" ? null : valor })
                }
              >
                <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item--5" value="padrao">{t("chamada.aparelhos.aDoSistema")}</DropdownMenuRadioItem>
                {cameras.map((aparelho, i) => (
                  <DropdownMenuRadioItem data-gc="voz.voice-stage-controls.dropdown-menu-radio-item--6" key={aparelho.deviceId} value={aparelho.deviceId}>
                    {nomeDoDispositivo(aparelho, i, t("chamada.aparelhos.camera"))}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--5" />
              <DropdownMenuCheckboxItem data-gc="voz.voice-stage-controls.dropdown-menu-checkbox-item"
                checked={prefs.espelharCamera}
                onCheckedChange={(marcado) => prefs.definir({ espelharCamera: marcado })}
              >
                {t("chamada.aparelhos.espelhar")}
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--6" />
              <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item--3" onSelect={() => abrirConfiguracoes("voz")}>
                {t("chamada.aparelhos.configCamera")} <Settings data-gc="voz.voice-stage-controls.settings--3" size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {cameraEnabled ? <Video data-gc="voz.voice-stage-controls.video" size={18} /> : <VideoOff data-gc="voz.voice-stage-controls.video-off" size={18} />}
        </Controle>

        <Controle data-gc="voz.voice-stage-controls.controle.ao-alternar-menu--4"
          onOpenChange={aoAlternarMenu}
          label={screenEnabled ? t("chamada.tela.pararDeCompartilhar") : t("chamada.tela.compartilhar")}
          labelDoMenu={t("chamada.tela.configCompartilhamento")}
          onClick={() => void toggleScreen()}
          ativo={screenEnabled}
          menu={
            <>
              <DropdownMenuLabel data-gc="voz.voice-stage-controls.dropdown-menu-label--4">{t("chamada.tela.compartilhar")}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem data-gc="voz.voice-stage-controls.dropdown-menu-checkbox-item--2"
                checked={prefs.somDaTela}
                onCheckedChange={(marcado) => prefs.definir({ somDaTela: marcado })}
              >
                {t("chamada.tela.somDoComputador")}
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--7" />
              <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item--4" onSelect={() => abrirConfiguracoes("voz")}>
                {t("chamada.tela.configCompartilhamento")} <Settings data-gc="voz.voice-stage-controls.settings--4" size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {screenEnabled ? <MonitorX data-gc="voz.voice-stage-controls.monitor-x" size={18} /> : <MonitorUp data-gc="voz.voice-stage-controls.monitor-up" size={18} />}
        </Controle>

        <DropdownMenu data-gc="voz.voice-stage-controls.dropdown-menu.ao-alternar-menu" onOpenChange={aoAlternarMenu}>
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
              checked={prefs.mostrarSemVideo}
              onCheckedChange={(marcado) => prefs.definir({ mostrarSemVideo: marcado })}
            >
              {t("chamada.tela.mostrarSemVideo")}
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator data-gc="voz.voice-stage-controls.dropdown-menu-separator--8" />
            <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item--5" onSelect={() => void telaCheia.alternar()}>
              {telaCheia.ativa ? "Sair da tela cheia" : "Entrar em tela cheia"}
              {telaCheia.ativa ? <Minimize data-gc="voz.voice-stage-controls.minimize" size={15} /> : <Maximize data-gc="voz.voice-stage-controls.maximize" size={15} />}
            </DropdownMenuItem>

            <DropdownMenuItem data-gc="voz.voice-stage-controls.dropdown-menu-item--6" onSelect={() => abrirConfiguracoes("voz")}>
              {t("chamada.aparelhos.configAudioEVideo")} <Settings data-gc="voz.voice-stage-controls.settings--5" size={15} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span data-gc="voz.voice-stage-controls.span" className="mx-0.5 h-6 w-px bg-white/10" aria-hidden />

        <Tooltip data-gc="voz.voice-stage-controls.tooltip--3" label={t("chamada.sairDaVoz")}>
          <button data-gc="voz.voice-stage-controls.button--2"
            onClick={() => void leave()}
            aria-label={t("chamada.sairDaVoz")}
            className="flex size-10 items-center justify-center rounded-full bg-danger text-white transition hover:brightness-110"
          >
            <PhoneOff data-gc="voz.voice-stage-controls.phone-off" size={18} />
          </button>
        </Tooltip>
      </div>

      <div data-gc="voz.voice-stage-controls.div--4" className="pointer-events-auto flex flex-1 items-center justify-end gap-1">
        <VolumeDaLive data-gc="voz.voice-stage-controls.volume-da-live.ao-alternar-menu" onOpenChange={aoAlternarMenu} />

        <Tooltip data-gc="voz.voice-stage-controls.tooltip--4" label={telaCheia.ativa ? "Sair da tela cheia" : "Entrar em tela cheia"}>
          <button data-gc="voz.voice-stage-controls.button--3"
            onClick={() => void telaCheia.alternar()}
            aria-label={telaCheia.ativa ? "Sair da tela cheia" : "Entrar em tela cheia"}
            className="flex size-10 items-center justify-center rounded-full text-ink-muted drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition hover:text-ink"
          >
            {telaCheia.ativa ? <Minimize data-gc="voz.voice-stage-controls.minimize--2" size={18} /> : <Maximize data-gc="voz.voice-stage-controls.maximize--2" size={18} />}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

const VolumeDaLive: React.FC<{ onOpenChange?: (aberto: boolean) => void }> = ({
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const assistindo = useVoiceStore((s) => s.assistindo);
  const volume = useVoiceStore((s) =>
    s.assistindo ? Math.min(1, s.volumesDeTela[s.assistindo] ?? 1) : 1,
  );
  const definir = useVoiceStore((s) => s.setVolumeDeTela);

  if (!assistindo) return null;

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

        <div data-gc="voz.voice-stage-controls.div--5" className="flex h-32 w-6 items-center justify-center">
          <Slider data-gc="voz.voice-stage-controls.slider"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            preenchido={volume}
            aria-label={t("chamada.volume.live")}
            onChange={(e) => definir(assistindo, Number(e.target.value))}
            className="w-32 -rotate-90"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Controle: React.FC<{
  children: React.ReactNode;
  label: string;
  labelDoMenu: string;
  onClick: () => void;
  ativo?: boolean;
  menu: React.ReactNode;
  onOpenChange?: (aberto: boolean) => void;
}> = ({ children, label, labelDoMenu, onClick, ativo, menu, onOpenChange }) => (
  <div data-gc="voz.voice-stage-controls.div--6" className="relative">
    <Tooltip data-gc="voz.voice-stage-controls.tooltip--6" label={label}>
      <button data-gc="voz.voice-stage-controls.button.on-click"
        onClick={onClick}
        aria-label={label}
        aria-pressed={ativo}
        className={cn(
          "flex size-10 items-center justify-center rounded-full transition",
          ativo
            ? "bg-surface-3 text-ink hover:bg-surface-4"
            : "text-ink-muted hover:bg-surface-3 hover:text-ink",
        )}
      >
        {children}
      </button>
    </Tooltip>

    <DropdownMenu data-gc="voz.voice-stage-controls.dropdown-menu.on-open-change" onOpenChange={onOpenChange}>
      <Tooltip data-gc="voz.voice-stage-controls.tooltip--7" label={labelDoMenu}>
        <DropdownMenuTrigger data-gc="voz.voice-stage-controls.dropdown-menu-trigger--2" asChild>
          <button data-gc="voz.voice-stage-controls.button--5"
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

const FaixaDeVolume: React.FC<{
  rotulo: string;
  valor: number;
  max: number;
  onMudar: (valor: number) => void;
}> = ({ rotulo, valor, max, onMudar }) => (
  <div data-gc="voz.voice-stage-controls.div--7" className="px-2 py-1.5">
    <p data-gc="voz.voice-stage-controls.p--2" className="mb-1.5 flex items-center justify-between text-xs">
      <span data-gc="voz.voice-stage-controls.span--2" className="font-medium text-ink-muted">{rotulo}</span>
      <span data-gc="voz.voice-stage-controls.span--3" className="tabular-nums text-ink-faint">{Math.round(valor * 100)}%</span>
    </p>

    <Slider data-gc="voz.voice-stage-controls.slider--2"
      min={0}
      max={max}
      step={0.05}
      value={valor}
      preenchido={valor / max}
      aria-label={rotulo}
      onChange={(e) => onMudar(Number(e.target.value))}
    />
  </div>
);
