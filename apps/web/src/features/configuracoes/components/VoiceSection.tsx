import React, { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Keyboard,
  Mic,
  ShieldCheck,
  Video,
  Volume2,
} from "lucide-react";

import { PermissoesDoMac } from "~/features/app/components/PermissoesDoMac";
import { Button } from "~/components/ui/button";
import { CampoSelect } from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { useVoiceMeter } from "~/features/voz/hooks/use-voice-meter";
import { desktop } from "~/lib/desktop";
import { usePttGlobal } from "~/features/voz/stores/ptt-global";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { cn } from "~/lib/utils";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";

function nomeDaTecla(code: string) {
  if (code === "Space") return "Espaço";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Arrow")) return `Seta ${code.slice(5)}`;
  return code;
}

const AvisoDoAtalho: React.FC = () => {
  const estado = usePttGlobal((s) => s.estado);
  const tecla = useVoicePrefs((s) => s.teclaPtt);
  const definirEstado = usePttGlobal((s) => s.definir);
  const ponte = desktop();

  if (!ponte) {
    return (
      <p data-gc="configuracoes.voice-section.p" className="mt-3 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
        No navegador, o push-to-talk só funciona com esta aba em foco. Com o
        jogo em primeiro plano a tecla não chega até aqui — isso o aplicativo
        para computador resolve.
      </p>
    );
  }

  if (estado?.precisaPermissao) {
    return (
      <div data-gc="configuracoes.voice-section.div" className="mt-3 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
        <p data-gc="configuracoes.voice-section.p--2">
          Falta liberar o <b data-gc="configuracoes.voice-section.b">{ponte.nomeNoSistema}</b> em{" "}
          <b data-gc="configuracoes.voice-section.b--2">Ajustes do Sistema → Privacidade e Segurança → Acessibilidade</b>.
          Sem isso o macOS não entrega a tecla quando a janela está atrás do
          jogo — e o push-to-talk volta a valer só com o Gravaê em foco.
        </p>
        <Button data-gc="configuracoes.voice-section.button"
          className="mt-2"
          variant="surface"
          size="sm"
          onClick={() =>
            void ponte.ptt
              .pedirPermissao({ ativo: true, tecla })
              .then(definirEstado)
          }
        >
          Abrir os ajustes
        </Button>
        <p data-gc="configuracoes.voice-section.p--3" className="mt-2 text-ink-faint">
          Depois de marcar a caixinha, reabra o Gravaê.
        </p>
      </div>
    );
  }

  if (estado?.indisponivel) {
    return (
      <p data-gc="configuracoes.voice-section.p--4" className="mt-3 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
        Não consegui ligar o atalho global nesta máquina. O push-to-talk
        continua funcionando com a janela do Gravaê em foco.
      </p>
    );
  }

  return (
    <p data-gc="configuracoes.voice-section.p--5" className="mt-3 rounded bg-online/10 px-3 py-2 text-xs text-online">
      No aplicativo a tecla vale mesmo com o jogo em primeiro plano.
    </p>
  );
};

export const VoiceSection: React.FC<{ parte?: "audio" | "video" }> = ({
  parte = "audio",
}) => {
  const prefs = useVoicePrefs();
  const aplicarAjustes = useVoiceStore((s) => s.aplicarAjustes);
  const emChamada = useVoiceStore((s) => s.channelId !== null);
  const noiseFilterAvailable = useVoiceStore((s) => s.noiseFilterAvailable);

  const [dispositivos, setDispositivos] = useState<MediaDeviceInfo[]>([]);
  const [testando, setTestando] = useState(false);
  const [ouvindoAVozPropria, setOuvindoAVozPropria] = useState(false);
  const [capturandoTecla, setCapturandoTecla] = useState(false);

  const retorno = useRef<HTMLAudioElement>(null);

  const medindo =
    testando || (!prefs.sensibilidadeAutomatica && !emChamada) || emChamada;
  const { nivel, aberto, erro, stream } = useVoiceMeter(medindo);

  const listarDispositivos = async () => {
    const lista = await navigator.mediaDevices
      .enumerateDevices()
      .catch(() => []);
    setDispositivos(
      lista.filter(
        (d) =>
          d.kind === "audioinput" ||
          d.kind === "audiooutput" ||
          d.kind === "videoinput",
      ),
    );
  };

  useEffect(() => {
    void listarDispositivos();
    navigator.mediaDevices.addEventListener("devicechange", listarDispositivos);
    return () =>
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        listarDispositivos,
      );
  }, []);

  useEffect(() => {
    if (stream || emChamada) void listarDispositivos();
  }, [stream, emChamada]);

  useEffect(() => {
    const el = retorno.current;
    if (!el) return;

    el.srcObject = ouvindoAVozPropria ? stream : null;
    if (ouvindoAVozPropria && stream) void el.play().catch(() => undefined);
  }, [ouvindoAVozPropria, stream]);

  useEffect(() => {
    if (!capturandoTecla) return;

    const capturar = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code === "Escape") return setCapturandoTecla(false);

      void aplicarAjustes({ teclaPtt: e.code });
      setCapturandoTecla(false);
    };

    window.addEventListener("keydown", capturar, { capture: true });
    return () =>
      window.removeEventListener("keydown", capturar, { capture: true });
  }, [capturandoTecla, aplicarAjustes]);

  const semNomes =
    dispositivos.length > 0 && dispositivos.every((d) => !d.label);
  const entradas = dispositivos.filter((d) => d.kind === "audioinput");
  const saidas = dispositivos.filter((d) => d.kind === "audiooutput");
  const cameras = dispositivos.filter((d) => d.kind === "videoinput");
  const suportaTrocaDeSaida = "setSinkId" in HTMLMediaElement.prototype;
  const ehMac = desktop()?.plataforma === "darwin";
  const [vendoPermissoes, setVendoPermissoes] = useState(false);

  return (
    <div data-gc="configuracoes.voice-section.div--2" className="max-w-2xl pb-10">
      {ehMac && (
        <Button data-gc="configuracoes.voice-section.button--2"
          variant="surface"
          size="sm"
          onClick={() => setVendoPermissoes(true)}
        >
          <ShieldCheck data-gc="configuracoes.voice-section.shield-check" size={14} /> Permissões do macOS
        </Button>
      )}

      {ehMac && (
        <PermissoesDoMac data-gc="configuracoes.voice-section.permissoes-do-mac"
          aberto={vendoPermissoes}
          onFechar={() => setVendoPermissoes(false)}
        />
      )}

      {parte === "audio" && (
        <>
          <Secao data-gc="configuracoes.voice-section.secao" id="dispositivos" titulo="Dispositivos">
            <div data-gc="configuracoes.voice-section.div--3" className="grid grid-cols-2 gap-5">
              <label data-gc="configuracoes.voice-section.label" className="block">
                <span data-gc="configuracoes.voice-section.span" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <Mic data-gc="configuracoes.voice-section.mic" size={13} /> Dispositivo de entrada
                </span>
                <CampoSelect data-gc="configuracoes.voice-section.campo-select"
                  valor={prefs.entradaId ?? ""}
                  onEscolher={(id) =>
                    void aplicarAjustes({ entradaId: id || null })
                  }
                  opcoes={[
                    { valor: "", rotulo: "Padrão do sistema" },
                    ...entradas.map((d) => ({
                      valor: d.deviceId,
                      rotulo: d.label || "Microfone",
                    })),
                  ]}
                />
              </label>

              <label data-gc="configuracoes.voice-section.label--2" className="block">
                <span data-gc="configuracoes.voice-section.span--2" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <Volume2 data-gc="configuracoes.voice-section.volume2" size={13} /> Dispositivo de saída
                </span>
                <CampoSelect data-gc="configuracoes.voice-section.campo-select--2"
                  valor={prefs.saidaId ?? ""}
                  disabled={!suportaTrocaDeSaida}
                  onEscolher={(id) =>
                    void aplicarAjustes({ saidaId: id || null })
                  }
                  opcoes={[
                    { valor: "", rotulo: "Padrão do sistema" },
                    ...saidas.map((d) => ({
                      valor: d.deviceId,
                      rotulo: d.label || "Alto-falante",
                    })),
                  ]}
                />
                {!suportaTrocaDeSaida && (
                  <p data-gc="configuracoes.voice-section.p--6" className="mt-1.5 text-xs text-ink-faint">
                    Este navegador não deixa escolher a saída — quem manda é o
                    padrão do sistema.
                  </p>
                )}
              </label>
            </div>
          </Secao>

          {semNomes && (
            <Button data-gc="configuracoes.voice-section.button--3"
              variant="surface"
              size="sm"
              className="mt-3"
              onClick={() =>
                void navigator.mediaDevices
                  .getUserMedia({ audio: true })
                  .then((s) => {
                    s.getTracks().forEach((t) => t.stop());
                    return listarDispositivos();
                  })
                  .catch(() => undefined)
              }
            >
              Mostrar os nomes dos dispositivos
            </Button>
          )}

          <section data-gc="configuracoes.voice-section.section" className="mt-7 grid grid-cols-2 gap-5">
            <Controle data-gc="configuracoes.voice-section.controle"
              titulo="Volume de entrada"
              valor={`${Math.round(prefs.ganhoEntrada * 100)}%`}
              min={0}
              max={2}
              step={0.05}
              value={prefs.ganhoEntrada}
              preenchido={prefs.ganhoEntrada / 2}
              onChange={(v) => void aplicarAjustes({ ganhoEntrada: v })}
            />

            <Controle data-gc="configuracoes.voice-section.controle--2"
              titulo="Volume de saída"
              valor={`${Math.round(prefs.volumeSaida * 100)}%`}
              min={0}
              max={1}
              step={0.05}
              value={prefs.volumeSaida}
              preenchido={prefs.volumeSaida}
              onChange={(v) => void aplicarAjustes({ volumeSaida: v })}
            />
          </section>

          <Secao data-gc="configuracoes.voice-section.secao--2" id="teste-do-microfone" titulo="Teste do microfone">
            <p data-gc="configuracoes.voice-section.p--7" className="mt-1 text-sm text-ink-muted">
              Fale alguma coisa. A barra mostra o que o microfone está captando;
              verde é o que sai daqui, cinza é o que o corte segura.
            </p>

            <div data-gc="configuracoes.voice-section.div--4" className="mt-3 flex items-center gap-3">
              <Button data-gc="configuracoes.voice-section.button--4"
                variant="surface"
                size="sm"
                onClick={() => setTestando((v) => !v)}
              >
                {testando ? "Parar o teste" : "Vamos verificar"}
              </Button>

              {testando && !emChamada && (
                <label data-gc="configuracoes.voice-section.label--3" className="flex items-center gap-2 text-sm text-ink-muted">
                  <Switch data-gc="configuracoes.voice-section.switch.set-ouvindo-avoz-propria"
                    checked={ouvindoAVozPropria}
                    onCheckedChange={setOuvindoAVozPropria}
                  />
                  Ouvir minha voz
                </label>
              )}

              {emChamada && (
                <span data-gc="configuracoes.voice-section.span--3" className="text-xs text-ink-faint">
                  Lendo da chamada em andamento.
                </span>
              )}
            </div>

            <Medidor data-gc="configuracoes.voice-section.medidor" nivel={nivel} aberto={aberto} className="mt-3" />
            {erro && <p data-gc="configuracoes.voice-section.p--8" className="mt-2 text-xs text-danger">{erro}</p>}

            <audio data-gc="configuracoes.voice-section.audio" ref={retorno} autoPlay />
          </Secao>

          <Secao data-gc="configuracoes.voice-section.secao--3" id="modo-de-entrada" titulo="Modo de entrada">
            <div data-gc="configuracoes.voice-section.div--5"
              role="radiogroup"
              aria-labelledby="modo-de-entrada"
              className="mt-3 grid grid-cols-2 gap-3"
            >
              <Opcao data-gc="configuracoes.voice-section.opcao"
                ativo={prefs.modo === "voz"}
                icone={AudioLines}
                titulo="Atividade de voz"
                descricao="Transmite quando você fala."
                onClick={() => void aplicarAjustes({ modo: "voz" })}
                onIrParaOutro={() => void aplicarAjustes({ modo: "ptt" })}
              />
              <Opcao data-gc="configuracoes.voice-section.opcao--2"
                ativo={prefs.modo === "ptt"}
                icone={Keyboard}
                titulo="Push-to-talk"
                descricao="Transmite só com a tecla pressionada."
                onClick={() => void aplicarAjustes({ modo: "ptt" })}
                onIrParaOutro={() => void aplicarAjustes({ modo: "voz" })}
              />
            </div>

            {prefs.modo === "ptt" && (
              <div data-gc="configuracoes.voice-section.div--6" className="mt-4">
                <p data-gc="configuracoes.voice-section.p--9" className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Atalho
                </p>

                <Button data-gc="configuracoes.voice-section.button--5"
                  variant={capturandoTecla ? "primary" : "surface"}
                  size="sm"
                  onClick={() => setCapturandoTecla(true)}
                >
                  <Keyboard data-gc="configuracoes.voice-section.keyboard" size={14} />
                  {capturandoTecla
                    ? "Aperte uma tecla…"
                    : nomeDaTecla(prefs.teclaPtt)}
                </Button>

                <AvisoDoAtalho data-gc="configuracoes.voice-section.aviso-do-atalho" />
              </div>
            )}
          </Secao>

          <Secao data-gc="configuracoes.voice-section.secao--4" id="sensibilidade" titulo="Sensibilidade de entrada">
            <div data-gc="configuracoes.voice-section.div--7" className="mt-3 flex items-start gap-4">
              <div data-gc="configuracoes.voice-section.div--8" className="min-w-0 flex-1">
                <p data-gc="configuracoes.voice-section.p--10" className="text-sm font-medium">
                  Determinar automaticamente
                </p>
                <p data-gc="configuracoes.voice-section.p--11" className="mt-0.5 text-xs text-ink-faint">
                  O corte se ajusta sozinho ao barulho do ambiente.
                </p>
              </div>
              <Switch data-gc="configuracoes.voice-section.switch"
                checked={prefs.sensibilidadeAutomatica}
                onCheckedChange={(v) =>
                  void aplicarAjustes({ sensibilidadeAutomatica: v })
                }
              />
            </div>

            {!prefs.sensibilidadeAutomatica && (
              <div data-gc="configuracoes.voice-section.div--9" className="mt-4">
                <Medidor data-gc="configuracoes.voice-section.medidor--2" nivel={nivel} aberto={aberto} limiar={prefs.limiar} />
                <Slider data-gc="configuracoes.voice-section.slider"
                  className="mt-2"
                  min={0}
                  max={0.5}
                  step={0.005}
                  value={prefs.limiar}
                  preenchido={prefs.limiar / 0.5}
                  onChange={(e) =>
                    void aplicarAjustes({ limiar: Number(e.target.value) })
                  }
                />
                <p data-gc="configuracoes.voice-section.p--12" className="mt-2 text-xs text-ink-faint">
                  Coloque a marca logo acima do barulho de fundo: o que passar
                  dela é transmitido.
                </p>
              </div>
            )}
          </Secao>

          <Secao data-gc="configuracoes.voice-section.secao--5" id="qualidade" titulo="Qualidade">
            <div data-gc="configuracoes.voice-section.div--10" className="mt-3 flex items-start gap-4">
              <div data-gc="configuracoes.voice-section.div--11" className="min-w-0 flex-1">
                <p data-gc="configuracoes.voice-section.p--13" className="text-sm font-medium">
                  Supressão de ruído avançada
                </p>
                <p data-gc="configuracoes.voice-section.p--14" className="mt-0.5 text-xs text-ink-faint">
                  {noiseFilterAvailable
                    ? "Remove ventilador, teclado e obra na rua. RNNoise, rodando aqui no seu aparelho."
                    : "Indisponível neste navegador — segue valendo a supressão do próprio navegador."}
                </p>
              </div>
              <Switch data-gc="configuracoes.voice-section.switch--2"
                checked={prefs.supressaoDeRuido && noiseFilterAvailable}
                disabled={!noiseFilterAvailable}
                onCheckedChange={(v) =>
                  void aplicarAjustes({ supressaoDeRuido: v })
                }
              />
            </div>

            <div data-gc="configuracoes.voice-section.div--12" className="mt-4 flex items-start gap-4">
              <div data-gc="configuracoes.voice-section.div--13" className="min-w-0 flex-1">
                <p data-gc="configuracoes.voice-section.p--15" className="text-sm font-medium">Sons da interface</p>
                <p data-gc="configuracoes.voice-section.p--16" className="mt-0.5 text-xs text-ink-faint">
                  Bipes curtos ao entrar e sair da chamada, mutar e começar a
                  transmitir. Quem está gravando ou transmitindo costuma
                  preferir desligado.
                </p>
              </div>
              <Switch data-gc="configuracoes.voice-section.switch--3"
                checked={prefs.somDaInterface}
                onCheckedChange={(v) => prefs.definir({ somDaInterface: v })}
              />
            </div>
          </Secao>
        </>
      )}

      {parte === "video" && (
        <>
          <Secao data-gc="configuracoes.voice-section.secao--6"
            id="video"
            titulo="Vídeo"
            detalhe="A câmera que entra quando você liga o vídeo numa chamada."
          >
            <label data-gc="configuracoes.voice-section.label--4" className="block max-w-sm">
              <span data-gc="configuracoes.voice-section.span--4" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <Video data-gc="configuracoes.voice-section.video" size={13} /> Câmera
              </span>
              <CampoSelect data-gc="configuracoes.voice-section.campo-select--3"
                valor={prefs.cameraId ?? ""}
                onEscolher={(id) => prefs.definir({ cameraId: id || null })}
                opcoes={[
                  { valor: "", rotulo: "Padrão do sistema" },
                  ...cameras.map((d) => ({
                    valor: d.deviceId,
                    rotulo: d.label || "Câmera",
                  })),
                ]}
              />
            </label>

            {!cameras.length && (
              <p data-gc="configuracoes.voice-section.p--17" className="mt-2 text-xs text-ink-faint">
                Nenhuma câmera encontrada. Os nomes só aparecem depois que você
                der permissão de vídeo ao Gravaê uma vez.
              </p>
            )}
          </Secao>

          <Secao data-gc="configuracoes.voice-section.secao--7" id="transmissao" titulo="Transmissão">
            <div data-gc="configuracoes.voice-section.div--14" className="flex items-start gap-4">
              <div data-gc="configuracoes.voice-section.div--15" className="min-w-0 flex-1">
                <p data-gc="configuracoes.voice-section.p--18" className="text-sm font-medium">
                  Compartilhar o som do sistema
                </p>
                <p data-gc="configuracoes.voice-section.p--19" className="mt-0.5 text-xs text-ink-faint">
                  Manda o áudio do computador junto com a tela — é o que faz
                  assistir vídeo em conjunto funcionar.{" "}
                  <strong data-gc="configuracoes.voice-section.strong" className="text-ink">
                    Se você ouve a chamada pelas caixas
                  </strong>
                  , o que sai delas é capturado e volta pra sala: todo mundo se
                  escuta em eco. De fone, não acontece.
                </p>
              </div>
              <Switch data-gc="configuracoes.voice-section.switch--4"
                checked={prefs.somDaTela}
                onCheckedChange={(v) => prefs.definir({ somDaTela: v })}
              />
            </div>
          </Secao>
        </>
      )}
    </div>
  );
};

interface MedidorProps {
  nivel: number;
  aberto: boolean;
  limiar?: number;
  className?: string;
}

const Medidor: React.FC<MedidorProps> = ({
  nivel,
  aberto,
  limiar,
  className,
}) => (
  <div data-gc="configuracoes.voice-section.div--16"
    className={cn(
      "relative h-2.5 w-full overflow-hidden rounded-full bg-surface-0",
      className,
    )}
  >
    <div data-gc="configuracoes.voice-section.div--17"
      className={cn(
        "h-full rounded-full transition-[width] duration-75",
        aberto ? "bg-online" : "bg-surface-4",
      )}
      style={{ width: `${Math.min(100, nivel * 100)}%` }}
    />

    {limiar !== undefined && (
      <span data-gc="configuracoes.voice-section.span--5"
        className="absolute top-0 h-full w-0.5 bg-ink"
        style={{ left: `${Math.min(100, limiar * 100)}%` }}
      />
    )}
  </div>
);

interface ControleProps {
  titulo: string;
  valor: string;
  min: number;
  max: number;
  step: number;
  value: number;
  preenchido: number;
  onChange: (valor: number) => void;
}

const Controle: React.FC<ControleProps> = ({
  titulo,
  valor,
  onChange,
  preenchido,
  ...props
}) => (
  <label data-gc="configuracoes.voice-section.label--5" className="block">
    <span data-gc="configuracoes.voice-section.span--6" className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {titulo} <span data-gc="configuracoes.voice-section.span--7" className="text-ink-faint">{valor}</span>
    </span>
    <Slider data-gc="configuracoes.voice-section.slider--2"
      {...props}
      preenchido={preenchido}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </label>
);

interface OpcaoProps {
  ativo: boolean;
  icone: React.ComponentType<{ size?: number | string; className?: string }>;
  titulo: string;
  descricao: string;
  onClick: () => void;
  onIrParaOutro: () => void;
}

const Opcao: React.FC<OpcaoProps> = ({
  ativo,
  icone: Icone,
  titulo,
  descricao,
  onClick,
  onIrParaOutro,
}) => (
  <button data-gc="configuracoes.voice-section.button.on-click"
    role="radio"
    aria-checked={ativo}
    tabIndex={ativo ? 0 : -1}
    onClick={onClick}
    onKeyDown={(e) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key))
        return;

      e.preventDefault();
      onIrParaOutro();
    }}
    className={cn(
      "flex items-start gap-3 rounded-lg border p-3 text-left transition",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
      ativo
        ? "border-brand bg-brand/10"
        : "border-line hover:border-ink-faint hover:bg-surface-3",
    )}
  >
    <Icone data-gc="configuracoes.voice-section.icone"
      size={18}
      className={cn(
        "mt-px shrink-0 transition",
        ativo ? "text-brand" : "text-ink-faint",
      )}
    />

    <span data-gc="configuracoes.voice-section.span--8" className="min-w-0 flex-1">
      <span data-gc="configuracoes.voice-section.span--9" className="block text-sm font-medium">{titulo}</span>
      <span data-gc="configuracoes.voice-section.span--10" className="mt-0.5 block text-xs text-ink-faint">{descricao}</span>
    </span>

    <span data-gc="configuracoes.voice-section.span--11"
      aria-hidden
      className={cn(
        "relative mt-px size-4 shrink-0 rounded-full border transition",
        ativo ? "border-brand" : "border-surface-4",
      )}
    >
      {ativo && <span data-gc="configuracoes.voice-section.span--12" className="absolute inset-[3px] rounded-full bg-brand" />}
    </span>
  </button>
);
