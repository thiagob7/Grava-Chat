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
  <Popover data-gc="voz.voice-details-popover.popover">
    <PopoverTrigger data-gc="voz.voice-details-popover.popover-trigger" asChild>{children}</PopoverTrigger>

    <PopoverContent data-gc="voz.voice-details-popover.popover-content" side="top" align="start" className="w-80 p-4">
      <h3 data-gc="voz.voice-details-popover.h3" className="mb-3 border-b-2 border-brand pb-1.5 text-sm font-semibold text-brand">
        Conexão
      </h3>

      <GraficoDePing data-gc="voz.voice-details-popover.grafico-de-ping" historico={ping.historico} />

      <p data-gc="voz.voice-details-popover.p" className="mt-3 text-sm font-semibold">{regiao}</p>

      <dl data-gc="voz.voice-details-popover.dl" className="mt-2 space-y-0.5 text-sm">
        <Linha data-gc="voz.voice-details-popover.linha" rotulo="Ping médio">
          <span data-gc="voz.voice-details-popover.span" className={corDoPing({ ms: ping.media, qualidade: ping.qualidade })}>
            {ping.media !== null ? `${ping.media} ms` : "—"}
          </span>
        </Linha>
        <Linha data-gc="voz.voice-details-popover.linha--2" rotulo="Último ping">
          <span data-gc="voz.voice-details-popover.span--2" className={corDoPing(ping)}>{ping.ms !== null ? `${ping.ms} ms` : "—"}</span>
        </Linha>
        <Linha data-gc="voz.voice-details-popover.linha--3" rotulo="Perda de pacotes enviados">
          {ping.perda !== null ? `${ping.perda.toFixed(1)}%` : "—"}
        </Linha>
      </dl>

      <p data-gc="voz.voice-details-popover.p--2" className="mt-3 text-xs leading-relaxed text-ink-faint">
        Acima de 250 ms dá pra notar atraso na conversa — as pessoas começam a se atropelar. Perda
        de pacotes acima de 10% deixa a voz robótica. Nos dois casos, o problema quase sempre está
        entre você e a internet: tente cabo em vez de Wi-Fi, ou reiniciar o roteador.
      </p>

      <p data-gc="voz.voice-details-popover.p--3" className="mt-3 flex items-center gap-1.5 rounded bg-surface-0 px-2 py-1.5 text-xs text-online">
        <ShieldCheck data-gc="voz.voice-details-popover.shield-check" size={14} /> Criptografado até o servidor (DTLS-SRTP)
      </p>
    </PopoverContent>
  </Popover>
);

const Linha: React.FC<{ rotulo: string; children: React.ReactNode }> = ({ rotulo, children }) => (
  <div data-gc="voz.voice-details-popover.div" className="flex items-baseline justify-between gap-2">
    <dt data-gc="voz.voice-details-popover.dt" className="text-ink-muted">{rotulo}:</dt>
    <dd data-gc="voz.voice-details-popover.dd" className="font-medium">{children}</dd>
  </div>
);

const TETO_MS = 200;

const GraficoDePing: React.FC<{ historico: (number | null)[] }> = ({ historico }) => {
  const amostras = historico.slice(-80);

  if (amostras.length < 2) {
    return (
      <div data-gc="voz.voice-details-popover.div--2" className="flex h-24 items-center justify-center rounded bg-surface-0 text-xs text-ink-faint">
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
    <div data-gc="voz.voice-details-popover.div--3" className="relative h-24 rounded bg-surface-0 p-2">
      <svg data-gc="voz.voice-details-popover.svg" viewBox={`0 0 ${largura} ${altura}`} preserveAspectRatio="none" className="size-full">
        <path data-gc="voz.voice-details-popover.path" d={area} className="fill-brand/20" />
        <path data-gc="voz.voice-details-popover.path--2"
          d={linha}
          className="stroke-brand"
          fill="none"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div data-gc="voz.voice-details-popover.div--4" className="pointer-events-none absolute inset-y-2 right-2 flex flex-col justify-between text-10 leading-none text-ink-faint">
        <span data-gc="voz.voice-details-popover.span--3">{TETO_MS}</span>
        <span data-gc="voz.voice-details-popover.span--4">{TETO_MS / 2}</span>
        <span data-gc="voz.voice-details-popover.span--5">0</span>
      </div>
    </div>
  );
};
