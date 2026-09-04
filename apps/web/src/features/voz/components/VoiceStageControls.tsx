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
import { useConfiguracoes } from "~/stores/configuracoes";
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
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-4 flex items-center gap-2 px-4",
        "transition-opacity duration-150",
        menusAbertos > 0
          ? "opacity-100"
          : "opacity-0 focus-within:opacity-100 group-hover:opacity-100",
      )}
    >
      <div className="flex flex-1 justify-start">
        {mostrarChat && (
        <Tooltip label={chatDaChamada ? "Esconder o chat" : "Mostrar o chat"}>
          <button
            onClick={alternarChatDaChamada}
            aria-label={chatDaChamada ? "Esconder o chat" : "Mostrar o chat"}
            aria-pressed={chatDaChamada}
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-surface-0/95 text-ink-muted shadow-lg ring-1 ring-black/30 backdrop-blur transition hover:text-ink"
          >
            <MessageSquare size={18} />
          </button>
        </Tooltip>
        )}
      </div>

      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-surface-0/95 p-1.5 shadow-lg ring-1 ring-black/30 backdrop-blur">
        <Controle
          onOpenChange={aoAlternarMenu}
          label={micBlocked ? "Microfone bloqueado" : micEnabled ? "Mutar" : "Desmutar"}
          labelDoMenu={t("chamada.aparelhos.configEntrada")}
          onClick={() => void toggleMic()}
          ativo={micEnabled && !micBlocked}
          menu={
            <>
              <DropdownMenuLabel>{t("chamada.aparelhos.entrada")}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={prefs.entradaId ?? "padrao"}
                onValueChange={(valor) =>
                  prefs.definir({ entradaId: valor === "padrao" ? null : valor })
                }
              >
                <DropdownMenuRadioItem value="padrao">{t("chamada.aparelhos.oDoSistema")}</DropdownMenuRadioItem>
                {entradas.map((aparelho, i) => (
                  <DropdownMenuRadioItem key={aparelho.deviceId} value={aparelho.deviceId}>
                    {nomeDoDispositivo(aparelho, i, t("chamada.aparelhos.microfone"))}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              <FaixaDeVolume
                rotulo={t("chamada.volume.entrada")}
                valor={prefs.ganhoEntrada}
                max={2}
                onMudar={(v) => prefs.definir({ ganhoEntrada: v })}
              />

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => abrirConfiguracoes("voz")}>
                {t("chamada.aparelhos.configEntrada")} <Settings size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {micEnabled && !micBlocked ? <Mic size={18} /> : <MicOff size={18} className="text-danger" />}
        </Controle>

        <Controle
          onOpenChange={aoAlternarMenu}
          label={deafened ? "Ouvir" : "Ficar surdo"}
          labelDoMenu={t("chamada.aparelhos.configSaida")}
          onClick={() => void toggleDeafen()}
          ativo={!deafened}
          menu={
            <>
              <DropdownMenuLabel>{t("chamada.aparelhos.saida")}</DropdownMenuLabel>
              {podeTrocarSaida ? (
                <DropdownMenuRadioGroup
                  value={prefs.saidaId ?? "padrao"}
                  onValueChange={(valor) =>
                    prefs.definir({ saidaId: valor === "padrao" ? null : valor })
                  }
                >
                  <DropdownMenuRadioItem value="padrao">{t("chamada.aparelhos.oDoSistema")}</DropdownMenuRadioItem>
                  {saidas.map((aparelho, i) => (
                    <DropdownMenuRadioItem key={aparelho.deviceId} value={aparelho.deviceId}>
                      {nomeDoDispositivo(aparelho, i, t("chamada.aparelhos.saidaCurto"))}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              ) : (
                <p className="px-2 py-1.5 text-xs text-ink-faint">
                  Este navegador não deixa escolher a saída — quem manda é o sistema.
                </p>
              )}

              <DropdownMenuSeparator />
              <FaixaDeVolume
                rotulo={t("chamada.volume.saida")}
                valor={prefs.volumeSaida}
                max={1}
                onMudar={(v) => prefs.definir({ volumeSaida: v })}
              />

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => abrirConfiguracoes("voz")}>
                {t("chamada.aparelhos.configSaida")} <Settings size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {deafened ? <HeadphoneOff size={18} className="text-danger" /> : <Headphones size={18} />}
        </Controle>

        <Controle
          onOpenChange={aoAlternarMenu}
          label={cameraEnabled ? "Desligar a câmera" : "Ligar a câmera"}
          labelDoMenu={t("chamada.aparelhos.configCamera")}
          onClick={() => void toggleCamera()}
          ativo={cameraEnabled}
          menu={
            <>
              <DropdownMenuLabel>{t("chamada.aparelhos.camera")}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={prefs.cameraId ?? "padrao"}
                onValueChange={(valor) =>
                  prefs.definir({ cameraId: valor === "padrao" ? null : valor })
                }
              >
                <DropdownMenuRadioItem value="padrao">{t("chamada.aparelhos.aDoSistema")}</DropdownMenuRadioItem>
                {cameras.map((aparelho, i) => (
                  <DropdownMenuRadioItem key={aparelho.deviceId} value={aparelho.deviceId}>
                    {nomeDoDispositivo(aparelho, i, t("chamada.aparelhos.camera"))}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={prefs.espelharCamera}
                onCheckedChange={(marcado) => prefs.definir({ espelharCamera: marcado })}
              >
                {t("chamada.aparelhos.espelhar")}
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => abrirConfiguracoes("voz")}>
                {t("chamada.aparelhos.configCamera")} <Settings size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {cameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
        </Controle>

        <Controle
          onOpenChange={aoAlternarMenu}
          label={screenEnabled ? t("chamada.tela.pararDeCompartilhar") : t("chamada.tela.compartilhar")}
          labelDoMenu={t("chamada.tela.configCompartilhamento")}
          onClick={() => void toggleScreen()}
          ativo={screenEnabled}
          menu={
            <>
              <DropdownMenuLabel>{t("chamada.tela.compartilhar")}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={prefs.somDaTela}
                onCheckedChange={(marcado) => prefs.definir({ somDaTela: marcado })}
              >
                {t("chamada.tela.somDoComputador")}
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => abrirConfiguracoes("voz")}>
                {t("chamada.tela.configCompartilhamento")} <Settings size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {screenEnabled ? <MonitorX size={18} /> : <MonitorUp size={18} />}
        </Controle>

        <DropdownMenu onOpenChange={aoAlternarMenu}>
          <Tooltip label={t("chamada.maisOpcoes")}>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={t("chamada.maisOpcoes")}
                className="flex size-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-3 hover:text-ink"
              >
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
          </Tooltip>

          <DropdownMenuContent side="top" align="center" className="w-64">
            <DropdownMenuCheckboxItem
              checked={prefs.mostrarSemVideo}
              onCheckedChange={(marcado) => prefs.definir({ mostrarSemVideo: marcado })}
            >
              {t("chamada.tela.mostrarSemVideo")}
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void telaCheia.alternar()}>
              {telaCheia.ativa ? "Sair da tela cheia" : "Entrar em tela cheia"}
              {telaCheia.ativa ? <Minimize size={15} /> : <Maximize size={15} />}
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => abrirConfiguracoes("voz")}>
              {t("chamada.aparelhos.configAudioEVideo")} <Settings size={15} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="mx-0.5 h-6 w-px bg-white/10" aria-hidden />

        <Tooltip label={t("chamada.sairDaVoz")}>
          <button
            onClick={() => void leave()}
            aria-label={t("chamada.sairDaVoz")}
            className="flex size-10 items-center justify-center rounded-full bg-danger text-white transition hover:brightness-110"
          >
            <PhoneOff size={18} />
          </button>
        </Tooltip>
      </div>

      <div className="pointer-events-auto flex flex-1 items-center justify-end gap-1">
        <VolumeDaLive onOpenChange={aoAlternarMenu} />

        <Tooltip label={telaCheia.ativa ? "Sair da tela cheia" : "Entrar em tela cheia"}>
          <button
            onClick={() => void telaCheia.alternar()}
            aria-label={telaCheia.ativa ? "Sair da tela cheia" : "Entrar em tela cheia"}
            className="flex size-10 items-center justify-center rounded-full text-ink-muted drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition hover:text-ink"
          >
            {telaCheia.ativa ? <Minimize size={18} /> : <Maximize size={18} />}
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
    <Popover onOpenChange={onOpenChange}>
      <Tooltip
        label={
          volume === 0
            ? t("chamada.volume.liveSemSom")
            : t("chamada.volume.liveComPorcento", { porcento: Math.round(volume * 100) })
        }
      >
        <PopoverTrigger asChild>
          <button
            aria-label={t("chamada.volume.live")}
            className="flex size-10 items-center justify-center rounded-full text-ink-muted drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition hover:text-ink"
          >
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent side="top" align="center" className="w-auto p-3">
        <PopoverArrow />

        <div className="flex h-32 w-6 items-center justify-center">
          <Slider
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
  <div className="relative">
    <Tooltip label={label}>
      <button
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

    <DropdownMenu onOpenChange={onOpenChange}>
      <Tooltip label={labelDoMenu}>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={labelDoMenu}
            className="absolute -top-1 right-0 flex size-4 items-center justify-center rounded-full bg-surface-3 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
          >
            <ChevronUp size={11} />
          </button>
        </DropdownMenuTrigger>
      </Tooltip>

      <DropdownMenuContent side="top" align="center" className="w-64">
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
  <div className="px-2 py-1.5">
    <p className="mb-1.5 flex items-center justify-between text-xs">
      <span className="font-medium text-ink-muted">{rotulo}</span>
      <span className="tabular-nums text-ink-faint">{Math.round(valor * 100)}%</span>
    </p>

    <Slider
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
