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
import { nomeDoDispositivo, useDispositivos } from "~/hooks/use-dispositivos";
import { useTelaCheia } from "~/hooks/use-tela-cheia";
import { cn } from "~/lib/utils";
import { useConfiguracoes } from "~/stores/configuracoes";
import { useVoicePrefs } from "~/stores/voice-prefs";
import { useVoiceStore } from "~/stores/voice-store";

/**
 * A barra de controles da chamada.
 *
 * Cada botão tem duas metades: o ícone, que faz a coisa, e a setinha, que abre
 * o que MUDA a coisa — trocar de microfone, de fone, de câmera. Antes era só a
 * primeira metade, e trocar de aparelho no meio de uma conversa obrigava a
 * abrir as configurações inteiras por cima da chamada.
 */
export const VoiceStageControls: React.FC<{
  alvoTelaCheia?: React.RefObject<HTMLElement | null>;
  /// só no privado, onde a conversa escrita divide a tela com a chamada
  mostrarChat?: boolean;
}> = ({ alvoTelaCheia, mostrarChat }) => {
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

  /// A troca de saída depende do `setSinkId`, que nem todo navegador tem. Sem
  /// ele a lista existiria só pra enganar: escolher não mudaria nada.
  const podeTrocarSaida =
    typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-4 flex items-center gap-2 px-4",
        "opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100",
      )}
    >
      {/*
        Chat à esquerda, volume e tela cheia à direita, controles no meio.

        Os três grupos ficam na MESMA faixa: eles aparecem e somem juntos com o
        mouse, e antes o de tela cheia morava no meio da pílula, disputando
        espaço com o que se usa a toda hora.
      */}
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
          label={micBlocked ? "Microfone bloqueado" : micEnabled ? "Mutar" : "Desmutar"}
          labelDoMenu="Configurações de entrada"
          onClick={() => void toggleMic()}
          ativo={micEnabled && !micBlocked}
          menu={
            <>
              <DropdownMenuLabel>Dispositivo de entrada</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={prefs.entradaId ?? "padrao"}
                onValueChange={(valor) =>
                  prefs.definir({ entradaId: valor === "padrao" ? null : valor })
                }
              >
                <DropdownMenuRadioItem value="padrao">O do sistema</DropdownMenuRadioItem>
                {entradas.map((aparelho, i) => (
                  <DropdownMenuRadioItem key={aparelho.deviceId} value={aparelho.deviceId}>
                    {nomeDoDispositivo(aparelho, i, "Microfone")}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              <FaixaDeVolume
                rotulo="Volume de entrada"
                valor={prefs.ganhoEntrada}
                max={2}
                onMudar={(v) => prefs.definir({ ganhoEntrada: v })}
              />

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => abrirConfiguracoes("voz")}>
                Configurações de entrada <Settings size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {micEnabled && !micBlocked ? <Mic size={18} /> : <MicOff size={18} className="text-danger" />}
        </Controle>

        <Controle
          label={deafened ? "Ouvir" : "Ficar surdo"}
          labelDoMenu="Configurações de saída"
          onClick={() => void toggleDeafen()}
          ativo={!deafened}
          menu={
            <>
              <DropdownMenuLabel>Dispositivo de saída</DropdownMenuLabel>
              {podeTrocarSaida ? (
                <DropdownMenuRadioGroup
                  value={prefs.saidaId ?? "padrao"}
                  onValueChange={(valor) =>
                    prefs.definir({ saidaId: valor === "padrao" ? null : valor })
                  }
                >
                  <DropdownMenuRadioItem value="padrao">O do sistema</DropdownMenuRadioItem>
                  {saidas.map((aparelho, i) => (
                    <DropdownMenuRadioItem key={aparelho.deviceId} value={aparelho.deviceId}>
                      {nomeDoDispositivo(aparelho, i, "Saída")}
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
                rotulo="Volume de saída"
                valor={prefs.volumeSaida}
                max={1}
                onMudar={(v) => prefs.definir({ volumeSaida: v })}
              />

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => abrirConfiguracoes("voz")}>
                Configurações de saída <Settings size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {deafened ? <HeadphoneOff size={18} className="text-danger" /> : <Headphones size={18} />}
        </Controle>

        <Controle
          label={cameraEnabled ? "Desligar a câmera" : "Ligar a câmera"}
          labelDoMenu="Configurações da câmera"
          onClick={() => void toggleCamera()}
          ativo={cameraEnabled}
          menu={
            <>
              <DropdownMenuLabel>Câmera</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={prefs.cameraId ?? "padrao"}
                onValueChange={(valor) =>
                  prefs.definir({ cameraId: valor === "padrao" ? null : valor })
                }
              >
                <DropdownMenuRadioItem value="padrao">A do sistema</DropdownMenuRadioItem>
                {cameras.map((aparelho, i) => (
                  <DropdownMenuRadioItem key={aparelho.deviceId} value={aparelho.deviceId}>
                    {nomeDoDispositivo(aparelho, i, "Câmera")}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={prefs.espelharCamera}
                onCheckedChange={(marcado) => prefs.definir({ espelharCamera: marcado })}
              >
                Espelhar a minha câmera
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => abrirConfiguracoes("voz")}>
                Configurações da câmera <Settings size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {cameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
        </Controle>

        <Controle
          label={screenEnabled ? "Parar de compartilhar" : "Compartilhar tela"}
          labelDoMenu="Configurações de compartilhamento"
          onClick={() => void toggleScreen()}
          ativo={screenEnabled}
          menu={
            <>
              <DropdownMenuLabel>Compartilhar tela</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={prefs.somDaTela}
                onCheckedChange={(marcado) => prefs.definir({ somDaTela: marcado })}
              >
                Levar o som do computador junto
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => abrirConfiguracoes("voz")}>
                Configurações de compartilhamento <Settings size={15} />
              </DropdownMenuItem>
            </>
          }
        >
          {/* o monitor com X diz "clique pra PARAR"; a seta pra cima dizia o
              contrário, e o botão parecia não ter feito nada */}
          {screenEnabled ? <MonitorX size={18} /> : <MonitorUp size={18} />}
        </Controle>

        <DropdownMenu>
          <Tooltip label="Mais opções">
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Mais opções"
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
              Mostrar quem está sem vídeo
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void telaCheia.alternar()}>
              {telaCheia.ativa ? "Sair da tela cheia" : "Entrar em tela cheia"}
              {telaCheia.ativa ? <Minimize size={15} /> : <Maximize size={15} />}
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => abrirConfiguracoes("voz")}>
              Configurações de áudio e vídeo <Settings size={15} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="mx-0.5 h-6 w-px bg-white/10" aria-hidden />

        <Tooltip label="Sair da chamada de voz">
          <button
            onClick={() => void leave()}
            aria-label="Sair da chamada de voz"
            className="flex size-10 items-center justify-center rounded-full bg-danger text-white transition hover:brightness-110"
          >
            <PhoneOff size={18} />
          </button>
        </Tooltip>
      </div>

      <div className="pointer-events-auto flex flex-1 items-center justify-end gap-1">
        <div className="flex items-center gap-1 rounded-full bg-surface-0/95 p-1.5 shadow-lg ring-1 ring-black/30 backdrop-blur">
        <VolumeDaSaida />

        <Tooltip label={telaCheia.ativa ? "Sair da tela cheia" : "Entrar em tela cheia"}>
          <button
            onClick={() => void telaCheia.alternar()}
            aria-label={telaCheia.ativa ? "Sair da tela cheia" : "Entrar em tela cheia"}
            className="flex size-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-3 hover:text-ink"
          >
            {telaCheia.ativa ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </Tooltip>
        </div>
      </div>
    </div>
  );
};

/**
 * O volume, no canto da barra do palco.
 *
 * Fica solto, longe dos botões que ligam e desligam coisa: é o ajuste que se
 * faz no meio de uma frase de outra pessoa, e por isso não pode dividir alvo
 * com "mutar".
 *
 * ASSISTINDO A UMA LIVE, ele mostra DUAS réguas — a da live primeiro.
 *
 * Antes era só o volume geral, e sem rótulo: uma faixa em pé num balão, com o
 * vídeo de alguém ocupando a tela inteira atrás. Quem quer abaixar o jogo do
 * amigo mira ali, e o que ele encontra abaixa a mesa toda — inclusive as vozes
 * de quem está falando com ele. O controle certo existia desde sempre, mas
 * escondido num botão pequeno em cima do quadro; ninguém acha.
 *
 * Os dois continuam alcançáveis, e agora dizem o nome: "esta live" e "todo
 * mundo". A régua sem rótulo era metade do problema.
 */
const VolumeDaSaida: React.FC = () => {
  const volumeSaida = useVoicePrefs((s) => s.volumeSaida);
  const definir = useVoicePrefs((s) => s.definir);

  const assistindo = useVoiceStore((s) => s.assistindo);
  const volumeDaLive = useVoiceStore((s) =>
    assistindo ? Math.min(1, s.volumesDeTela[assistindo] ?? 1) : 1,
  );
  const definirVolumeDeTela = useVoiceStore((s) => s.setVolumeDeTela);

  const mudo = assistindo ? volumeDaLive === 0 && volumeSaida === 0 : volumeSaida === 0;

  return (
    <Popover>
      <Tooltip
        label={
          assistindo
            ? `Volume · live ${Math.round(volumeDaLive * 100)}% · geral ${Math.round(volumeSaida * 100)}%`
            : `Volume de saída (${Math.round(volumeSaida * 100)}%)`
        }
      >
        <PopoverTrigger asChild>
          <button
            aria-label="Volume"
            className="flex size-10 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-3 hover:text-ink"
          >
            {mudo ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent side="top" align="center" className="w-56 p-3">
        <PopoverArrow />

        {assistindo && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-ink-muted">
              Esta live · {Math.round(volumeDaLive * 100)}%
            </p>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={volumeDaLive}
              preenchido={volumeDaLive}
              aria-label="Volume da live"
              onChange={(e) => definirVolumeDeTela(assistindo, Number(e.target.value))}
            />
          </div>
        )}

        <p className="mb-2 text-xs font-medium text-ink-muted">
          {assistindo ? "Todo mundo" : "Volume de saída"} · {Math.round(volumeSaida * 100)}%
        </p>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={volumeSaida}
          preenchido={volumeSaida}
          aria-label="Volume de saída"
          onChange={(e) => definir({ volumeSaida: Number(e.target.value) })}
        />
      </PopoverContent>
    </Popover>
  );
};

/**
 * Um controle com duas metades: o botão e a setinha do menu.
 *
 * A setinha é um alvo pequeno de propósito — quem quer mutar mira no ícone
 * grande, e só quem quer trocar de aparelho vai atrás dos 14px da ponta.
 */
const Controle: React.FC<{
  children: React.ReactNode;
  label: string;
  labelDoMenu: string;
  onClick: () => void;
  ativo?: boolean;
  menu: React.ReactNode;
}> = ({ children, label, labelDoMenu, onClick, ativo, menu }) => (
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

    <DropdownMenu>
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

/// A faixa dentro do menu: o número à direita do rótulo, como no resto do app.
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
