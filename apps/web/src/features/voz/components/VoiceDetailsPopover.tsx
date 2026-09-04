import React from "react";
import { ShieldCheck } from "lucide-react";

import { corDoPing, type PingDaChamada } from "~/features/voz/hooks/use-voice-ping";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";

interface VoiceDetailsPopoverProps {
  ping: PingDaChamada;
  regiao: string;
  children: React.ReactNode;
}

export const VoiceDetailsPopover: React.FC<VoiceDetailsPopoverProps> = ({
  ping,
  regiao,
  children,
}) => (
  <Popover>
    <PopoverTrigger asChild>{children}</PopoverTrigger>

    <PopoverContent side="top" align="start" className="w-80 p-4">
      <h3 className="mb-3 border-b-2 border-brand pb-1.5 text-sm font-semibold text-brand">
        Conexão
      </h3>

      <GraficoDePing historico={ping.historico} />

      <p className="mt-3 text-sm font-semibold">{regiao}</p>

      <dl className="mt-2 space-y-0.5 text-sm">
        <Linha rotulo="Ping médio">
          <span className={corDoPing({ ms: ping.media, qualidade: ping.qualidade })}>
            {ping.media !== null ? `${ping.media} ms` : "—"}
          </span>
        </Linha>
        <Linha rotulo="Último ping">
          <span className={corDoPing(ping)}>{ping.ms !== null ? `${ping.ms} ms` : "—"}</span>
        </Linha>
        <Linha rotulo="Perda de pacotes enviados">
          {ping.perda !== null ? `${ping.perda.toFixed(1)}%` : "—"}
        </Linha>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-ink-faint">
        Acima de 250 ms dá pra notar atraso na conversa — as pessoas começam a se atropelar. Perda
        de pacotes acima de 10% deixa a voz robótica. Nos dois casos, o problema quase sempre está
        entre você e a internet: tente cabo em vez de Wi-Fi, ou reiniciar o roteador.
      </p>

      <p className="mt-3 flex items-center gap-1.5 rounded bg-surface-0 px-2 py-1.5 text-xs text-online">
        <ShieldCheck size={14} /> Criptografado até o servidor (DTLS-SRTP)
      </p>
    </PopoverContent>
  </Popover>
);

const Linha: React.FC<{ rotulo: string; children: React.ReactNode }> = ({ rotulo, children }) => (
  <div className="flex items-baseline justify-between gap-2">
    <dt className="text-ink-muted">{rotulo}:</dt>
    <dd className="font-medium">{children}</dd>
  </div>
);

const TETO_MS = 200;

const GraficoDePing: React.FC<{ historico: (number | null)[] }> = ({ historico }) => {
  const amostras = historico.slice(-80);

  if (amostras.length < 2) {
    return (
      <div className="flex h-24 items-center justify-center rounded bg-surface-0 text-xs text-ink-faint">
        Medindo…
      </div>
    );
  }

  const largura = 100;
  const altura = 40;
  const passo = largura / (amostras.length - 1);

  const y = (v: number | null) =>
    altura - (Math.min(v ?? TETO_MS, TETO_MS) / TETO_MS) * altura;

  const pontos = amostras.map((v, i) => `${(i * passo).toFixed(2)},${y(v).toFixed(2)}`);
  const linha = `M ${pontos.join(" L ")}`;
  const area = `${linha} L ${largura},${altura} L 0,${altura} Z`;

  return (
    <div className="relative h-24 rounded bg-surface-0 p-2">
      <svg viewBox={`0 0 ${largura} ${altura}`} preserveAspectRatio="none" className="size-full">
        <path d={area} className="fill-brand/20" />
        <path
          d={linha}
          className="stroke-brand"
          fill="none"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="pointer-events-none absolute inset-y-2 right-2 flex flex-col justify-between text-10 leading-none text-ink-faint">
        <span>{TETO_MS}</span>
        <span>{TETO_MS / 2}</span>
        <span>0</span>
      </div>
    </div>
  );
};
