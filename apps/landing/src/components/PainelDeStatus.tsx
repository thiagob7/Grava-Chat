"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, X } from "lucide-react";

import {
  searchStatus,
  NAMES,
  PIECES,
  type WindowDay,
  type Piece,
  type Status,
} from "~/lib/status";

const color = (uptime: number | null) => {
  if (uptime === null) return "bg-white/10";
  if (uptime >= 99.5) return "bg-emerald-500";
  if (uptime >= 95) return "bg-amber-500";
  return "bg-red-500";
};

const Bar = ({ days }: { days: WindowDay[] }) => (
  <div className="flex h-8 items-stretch gap-px overflow-hidden rounded">
    {days.map((d) => (
      <span
        key={d.day}
        title={
          d.uptime === null
            ? `${d.day} — sem medição`
            : `${d.day} — ${d.uptime.toFixed(2)}% no ar`
        }
        className={`min-w-0 flex-1 rounded-[1px] ${color(d.uptime)}`}
      />
    ))}
  </div>
);

const windowMedia = (days: WindowDay[]) => {
  const measured = days.filter((d) => d.uptime !== null);
  if (!measured.length) return null;

  return measured.reduce((soma, d) => soma + d.uptime!, 0) / measured.length;
};

const Track = ({ status }: { status: Status | null }) => {
  const outside = status?.now.filter((m) => m.state === "down") ?? [];

  if (!status) {
    return (
      <p className="flex items-center gap-3 rounded-xl bg-red-500/15 px-5 py-4 text-red-300">
        <X size={20} className="shrink-0" />
        <span className="font-semibold">
          A API não está respondendo — o Gravaê está fora do ar.
        </span>
      </p>
    );
  }

  if (outside.length) {
    return (
      <p className="flex items-center gap-3 rounded-xl bg-amber-500/15 px-5 py-4 text-amber-200">
        <AlertTriangle size={20} className="shrink-0" />
        <span className="font-semibold">
          {outside.length === 1
            ? `${NAMES[outside[0]!.piece]} está fora do ar`
            : `${outside.length} peças estão fora do ar`}
        </span>
      </p>
    );
  }

  return (
    <p className="flex items-center gap-3 rounded-xl bg-emerald-500/15 px-5 py-4 text-emerald-300">
      <Check size={20} className="shrink-0" />
      <span className="font-semibold">Tudo funcionando</span>
    </p>
  );
};

export const StatusPanel = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["status"],
    queryFn: searchStatus,
    refetchInterval: 30_000,
    retry: false,
  });

  const status = isError ? null : (data ?? null);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-14 animate-pulse rounded-xl bg-white/5" />
        <div className="space-y-6">
          {PIECES.map((piece) => (
            <div key={piece} className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
              <div className="h-8 animate-pulse rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Track status={status} />

      <div className="space-y-6">
        {(status?.pieces ?? PIECES).map((piece) => {
          const days = status?.appWindow[piece as Piece] ?? [];
          const media = windowMedia(days);
          const now = status?.now.find((m) => m.piece === piece);

          return (
            <section key={piece}>
              <header className="mb-2 flex items-baseline justify-between gap-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      !status ? "bg-white/20" : now?.state === "up" ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  {NAMES[piece as Piece]}
                </h2>

                <span className="shrink-0 text-xs tabular-nums text-ink-faint">
                  {media === null ? "sem histórico" : `${media.toFixed(2)}% no ar`}
                </span>
              </header>

              {days.length ? <Bar days={days} /> : <div className="h-8 rounded bg-white/5" />}

              <p className="mt-1 flex justify-between text-[11px] uppercase tracking-wide text-ink-faint">
                <span>90 dias atrás</span>
                <span>hoje</span>
              </p>
            </section>
          );
        })}
      </div>

      {status && (
        <p className="text-center text-xs text-ink-faint">
          Medido em{" "}
          {new Date(status.em).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
          , e de novo a cada 30 segundos.
        </p>
      )}
    </div>
  );
};
