import React, { useEffect, useRef, useState } from "react";
import { Keyboard, Mic, Volume2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { useVoiceMeter } from "~/hooks/use-voice-meter";
import { desktop } from "~/lib/desktop";
import { usePttGlobal } from "~/stores/ptt-global";
import { useVoicePrefs } from "~/stores/voice-prefs";
import { useVoiceStore } from "~/stores/voice-store";
import { cn } from "~/lib/utils";

/** Nome legível de uma tecla a partir do `code` do teclado. */
function nomeDaTecla(code: string) {
  if (code === "Space") return "Espaço";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Arrow")) return `Seta ${code.slice(5)}`;
  return code;
}

/**
 * O que o push-to-talk consegue fazer AQUI, nesta máquina — que muda bastante:
 * no navegador a tecla só chega com a aba em foco; no aplicativo ela chega
 * sempre, desde que o macOS tenha liberado o Gravaê em Acessibilidade.
 */
const AvisoDoAtalho: React.FC = () => {
  const estado = usePttGlobal((s) => s.estado);
  const tecla = useVoicePrefs((s) => s.teclaPtt);
  const definirEstado = usePttGlobal((s) => s.definir);
  const ponte = desktop();

  if (!ponte) {
    return (
      <p className="mt-3 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
        No navegador, o push-to-talk só funciona com esta aba em foco. Com o jogo em primeiro plano
        a tecla não chega até aqui — isso o aplicativo para computador resolve.
      </p>
    );
  }

  if (estado?.precisaPermissao) {
    return (
      <div className="mt-3 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
        <p>
          Falta liberar o <b>{ponte.nomeNoSistema}</b> em <b>Ajustes do Sistema → Privacidade e
          Segurança → Acessibilidade</b>. Sem isso o macOS não entrega a tecla quando a janela está atrás do
          jogo — e o push-to-talk volta a valer só com o Gravaê em foco.
        </p>
        <Button
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
        <p className="mt-2 text-ink-faint">Depois de marcar a caixinha, reabra o Gravaê.</p>
      </div>
    );
  }

  if (estado?.indisponivel) {
    return (
      <p className="mt-3 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
        Não consegui ligar o atalho global nesta máquina. O push-to-talk continua funcionando com a
        janela do Gravaê em foco.
      </p>
    );
  }

  return (
    <p className="mt-3 rounded bg-online/10 px-3 py-2 text-xs text-online">
      No aplicativo a tecla vale mesmo com o jogo em primeiro plano.
    </p>
  );
};

export const VoiceSection: React.FC = () => {
  const prefs = useVoicePrefs();
  const aplicarAjustes = useVoiceStore((s) => s.aplicarAjustes);
  const emChamada = useVoiceStore((s) => s.channelId !== null);
  const noiseFilterAvailable = useVoiceStore((s) => s.noiseFilterAvailable);

  const [dispositivos, setDispositivos] = useState<MediaDeviceInfo[]>([]);
  const [testando, setTestando] = useState(false);
  const [ouvindoAVozPropria, setOuvindoAVozPropria] = useState(false);
  const [capturandoTecla, setCapturandoTecla] = useState(false);

  const retorno = useRef<HTMLAudioElement>(null);

  /**
   * Com o limiar manual a barra precisa estar rodando o tempo todo — é olhando
   * pra ela que se escolhe o corte. No resto, só durante o teste.
   */
  const medindo = testando || (!prefs.sensibilidadeAutomatica && !emChamada) || emChamada;
  const { nivel, aberto, erro, stream } = useVoiceMeter(medindo);

  const listarDispositivos = async () => {
    const lista = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    setDispositivos(lista.filter((d) => d.kind === "audioinput" || d.kind === "audiooutput"));
  };

  useEffect(() => {
    void listarDispositivos();
    navigator.mediaDevices.addEventListener("devicechange", listarDispositivos);
    return () => navigator.mediaDevices.removeEventListener("devicechange", listarDispositivos);
  }, []);

  /**
   * O navegador só entrega a lista de dispositivos depois de o microfone ter
   * sido liberado uma vez. Assim que o teste (ou a chamada) abre o microfone,
   * vale listar de novo — senão os menus ficam com "Padrão do sistema" e nada
   * mais, parecendo quebrados.
   */
  useEffect(() => {
    if (stream || emChamada) void listarDispositivos();
  }, [stream, emChamada]);

  /** Retorno da própria voz durante o teste, para conferir o microfone certo. */
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
    return () => window.removeEventListener("keydown", capturar, { capture: true });
  }, [capturandoTecla, aplicarAjustes]);

  // os nomes dos dispositivos só aparecem depois de o navegador liberar o
  // microfone uma vez — antes disso vem tudo em branco
  const semNomes = dispositivos.length > 0 && dispositivos.every((d) => !d.label);
  const entradas = dispositivos.filter((d) => d.kind === "audioinput");
  const saidas = dispositivos.filter((d) => d.kind === "audiooutput");
  const suportaTrocaDeSaida = "setSinkId" in HTMLMediaElement.prototype;

  return (
    <div className="max-w-2xl pb-10">
      <h2 className="text-xl font-semibold">Voz e vídeo</h2>

      <section className="mt-6 grid grid-cols-2 gap-5">
        <label className="block">
          <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Mic size={13} /> Dispositivo de entrada
          </span>
          <select
            value={prefs.entradaId ?? ""}
            onChange={(e) => void aplicarAjustes({ entradaId: e.target.value || null })}
            className="w-full rounded bg-surface-0 px-3 py-2.5 text-sm outline-none ring-brand/60 focus:ring-2"
          >
            <option value="">Padrão do sistema</option>
            {entradas.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || "Microfone"}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Volume2 size={13} /> Dispositivo de saída
          </span>
          <select
            value={prefs.saidaId ?? ""}
            disabled={!suportaTrocaDeSaida}
            onChange={(e) => void aplicarAjustes({ saidaId: e.target.value || null })}
            className="w-full rounded bg-surface-0 px-3 py-2.5 text-sm outline-none ring-brand/60 focus:ring-2 disabled:opacity-50"
          >
            <option value="">Padrão do sistema</option>
            {saidas.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || "Alto-falante"}
              </option>
            ))}
          </select>
          {!suportaTrocaDeSaida && (
            <p className="mt-1.5 text-xs text-ink-faint">
              Este navegador não deixa escolher a saída — quem manda é o padrão do sistema.
            </p>
          )}
        </label>
      </section>

      {semNomes && (
        <Button
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

      <section className="mt-7 grid grid-cols-2 gap-5">
        <Controle
          titulo="Volume de entrada"
          valor={`${Math.round(prefs.ganhoEntrada * 100)}%`}
          min={0}
          max={2}
          step={0.05}
          value={prefs.ganhoEntrada}
          preenchido={prefs.ganhoEntrada / 2}
          onChange={(v) => void aplicarAjustes({ ganhoEntrada: v })}
        />

        <Controle
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

      <section className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Teste do microfone
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          Fale alguma coisa. A barra mostra o que o microfone está captando; verde é o que sai
          daqui, cinza é o que o corte segura.
        </p>

        <div className="mt-3 flex items-center gap-3">
          <Button variant="surface" size="sm" onClick={() => setTestando((v) => !v)}>
            {testando ? "Parar o teste" : "Vamos verificar"}
          </Button>

          {testando && !emChamada && (
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <Switch checked={ouvindoAVozPropria} onCheckedChange={setOuvindoAVozPropria} />
              Ouvir minha voz
            </label>
          )}

          {emChamada && <span className="text-xs text-ink-faint">Lendo da chamada em andamento.</span>}
        </div>

        <Medidor nivel={nivel} aberto={aberto} className="mt-3" />
        {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}

        <audio ref={retorno} autoPlay />
      </section>

      <section className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Modo de entrada
        </h3>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Opcao
            ativo={prefs.modo === "voz"}
            titulo="Atividade de voz"
            descricao="Transmite quando você fala."
            onClick={() => void aplicarAjustes({ modo: "voz" })}
          />
          <Opcao
            ativo={prefs.modo === "ptt"}
            titulo="Push-to-talk"
            descricao="Transmite só com a tecla pressionada."
            onClick={() => void aplicarAjustes({ modo: "ptt" })}
          />
        </div>

        {prefs.modo === "ptt" && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Atalho
            </p>

            <Button
              variant={capturandoTecla ? "primary" : "surface"}
              size="sm"
              onClick={() => setCapturandoTecla(true)}
            >
              <Keyboard size={14} />
              {capturandoTecla ? "Aperte uma tecla…" : nomeDaTecla(prefs.teclaPtt)}
            </Button>

            <AvisoDoAtalho />
          </div>
        )}
      </section>

      <section className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Sensibilidade de entrada
        </h3>

        <div className="mt-3 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Determinar automaticamente</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              O corte se ajusta sozinho ao barulho do ambiente.
            </p>
          </div>
          <Switch
            checked={prefs.sensibilidadeAutomatica}
            onCheckedChange={(v) => void aplicarAjustes({ sensibilidadeAutomatica: v })}
          />
        </div>

        {!prefs.sensibilidadeAutomatica && (
          <div className="mt-4">
            <Medidor nivel={nivel} aberto={aberto} limiar={prefs.limiar} />
            <Slider
              className="mt-2"
              min={0}
              max={0.5}
              step={0.005}
              value={prefs.limiar}
              preenchido={prefs.limiar / 0.5}
              onChange={(e) => void aplicarAjustes({ limiar: Number(e.target.value) })}
            />
            <p className="mt-2 text-xs text-ink-faint">
              Coloque a marca logo acima do barulho de fundo: o que passar dela é transmitido.
            </p>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Qualidade</h3>

        <div className="mt-3 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Supressão de ruído avançada</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {noiseFilterAvailable
                ? "Remove ventilador, teclado e obra na rua. Fornecida por Krisp."
                : "Indisponível neste navegador — segue valendo a supressão do próprio navegador."}
            </p>
          </div>
          <Switch
            checked={prefs.supressaoDeRuido && noiseFilterAvailable}
            disabled={!noiseFilterAvailable}
            onCheckedChange={(v) => void aplicarAjustes({ supressaoDeRuido: v })}
          />
        </div>

        <div className="mt-4 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Sons da interface</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              Bipes curtos ao entrar e sair da chamada, mutar e começar a transmitir. Quem está
              gravando ou transmitindo costuma preferir desligado.
            </p>
          </div>
          <Switch
            checked={prefs.somDaInterface}
            onCheckedChange={(v) => prefs.definir({ somDaInterface: v })}
          />
        </div>

        <div className="mt-4 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Compartilhar o som do sistema</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              Manda o áudio do computador junto com a tela — é o que faz assistir vídeo em conjunto
              funcionar. <strong className="text-ink">Se você ouve a chamada pelas caixas</strong>, o
              que sai delas é capturado e volta pra sala: todo mundo se escuta em eco. De fone, não
              acontece.
            </p>
          </div>
          <Switch
            checked={prefs.somDaTela}
            onCheckedChange={(v) => prefs.definir({ somDaTela: v })}
          />
        </div>
      </section>
    </div>
  );
};

interface MedidorProps {
  nivel: number;
  aberto: boolean;
  limiar?: number;
  className?: string;
}

const Medidor: React.FC<MedidorProps> = ({ nivel, aberto, limiar, className }) => (
  <div className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-surface-0", className)}>
    <div
      className={cn("h-full rounded-full transition-[width] duration-75", aberto ? "bg-online" : "bg-surface-4")}
      style={{ width: `${Math.min(100, nivel * 100)}%` }}
    />

    {limiar !== undefined && (
      <span
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

const Controle: React.FC<ControleProps> = ({ titulo, valor, onChange, preenchido, ...props }) => (
  <label className="block">
    <span className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {titulo} <span className="text-ink-faint">{valor}</span>
    </span>
    <Slider {...props} preenchido={preenchido} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
);

interface OpcaoProps {
  ativo: boolean;
  titulo: string;
  descricao: string;
  onClick: () => void;
}

const Opcao: React.FC<OpcaoProps> = ({ ativo, titulo, descricao, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "rounded border p-3 text-left transition",
      ativo ? "border-brand bg-surface-0" : "border-line hover:bg-surface-3",
    )}
  >
    <p className="text-sm font-medium">{titulo}</p>
    <p className="mt-0.5 text-xs text-ink-faint">{descricao}</p>
  </button>
);
