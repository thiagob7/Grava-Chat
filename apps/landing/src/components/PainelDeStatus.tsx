"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, X } from "lucide-react";

import {
  buscarStatus,
  NOMES,
  PECAS,
  type DiaDaJanela,
  type Peca,
  type Status,
} from "~/lib/status";

/*
  Uma barra por dia, noventa delas.

  Três cores e não duas, porque o dia sem medição não é dia com queda: pode ser
  a máquina que estava fora, pode ser peça mais nova que a janela. Pintar de
  vermelho inventaria uma queda; pintar de verde esconderia uma. O cinza diz o
  que é verdade — ninguém estava lá para medir.

  O corte em 99,5% e não em 100% porque um minuto de instabilidade num dia dá
  99,93%: chamar isso de "degradado" faria o painel gritar por ruído, e quem
  olha aprenderia a ignorá-lo.
*/
const cor = (uptime: number | null) => {
  if (uptime === null) return "bg-white/10";
  if (uptime >= 99.5) return "bg-emerald-500";
  if (uptime >= 95) return "bg-amber-500";
  return "bg-red-500";
};

const Barra = ({ dias }: { dias: DiaDaJanela[] }) => (
  <div className="flex h-8 items-stretch gap-px overflow-hidden rounded">
    {dias.map((d) => (
      <span
        key={d.dia}
        /*
          O `title` é o que transforma a barra de enfeite em dado: sem ele a
          pessoa vê que houve uma queda e não tem como saber quando, nem
          quanto. Com ele, o dia inteiro cabe num passar de mouse.
        */
        title={
          d.uptime === null
            ? `${d.dia} — sem medição`
            : `${d.dia} — ${d.uptime.toFixed(2)}% no ar`
        }
        className={`min-w-0 flex-1 rounded-[1px] ${cor(d.uptime)}`}
      />
    ))}
  </div>
);

/// A média da janela, ignorando os dias sem medição — incluí-los como zero
/// puniria a plataforma pelo histórico que não existe.
const mediaDaJanela = (dias: DiaDaJanela[]) => {
  const medidos = dias.filter((d) => d.uptime !== null);
  if (!medidos.length) return null;

  return medidos.reduce((soma, d) => soma + d.uptime!, 0) / medidos.length;
};

const Faixa = ({ status }: { status: Status | null }) => {
  const fora = status?.agora.filter((m) => m.estado === "down") ?? [];

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

  if (fora.length) {
    return (
      <p className="flex items-center gap-3 rounded-xl bg-amber-500/15 px-5 py-4 text-amber-200">
        <AlertTriangle size={20} className="shrink-0" />
        <span className="font-semibold">
          {fora.length === 1
            ? `${NOMES[fora[0]!.peca]} está fora do ar`
            : `${fora.length} peças estão fora do ar`}
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

export const PainelDeStatus = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["status"],
    queryFn: buscarStatus,
    /*
      Uma consulta a cada meio minuto, e não uma só na abertura.

      Página de status costuma ficar aberta numa aba enquanto se espera a coisa
      voltar. Sem a repetição, ela congelaria no estado do instante em que
      alguém a abriu — e continuaria dizendo "fora do ar" depois de tudo já ter
      voltado.
    */
    refetchInterval: 30_000,
    /// O erro do `fetch` É a resposta "API fora do ar", então não se tenta de
    /// novo em cascata: a próxima rodada de 30s já refaz a pergunta.
    retry: false,
  });

  /// `undefined` é a primeira carga; `null` é a API que não respondeu. São
  /// coisas diferentes e a tela precisa distinguir — uma espera, a outra avisa.
  const status = isError ? null : (data ?? null);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-14 animate-pulse rounded-xl bg-white/5" />
        <div className="space-y-6">
          {PECAS.map((peca) => (
            <div key={peca} className="space-y-2">
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
      <Faixa status={status} />

      <div className="space-y-6">
        {(status?.pecas ?? PECAS).map((peca) => {
          const dias = status?.janela[peca as Peca] ?? [];
          const media = mediaDaJanela(dias);
          const agora = status?.agora.find((m) => m.peca === peca);

          return (
            <section key={peca}>
              <header className="mb-2 flex items-baseline justify-between gap-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      !status ? "bg-white/20" : agora?.estado === "up" ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  {NOMES[peca as Peca]}
                </h2>

                <span className="shrink-0 text-xs tabular-nums text-ink-faint">
                  {media === null ? "sem histórico" : `${media.toFixed(2)}% no ar`}
                </span>
              </header>

              {dias.length ? <Barra dias={dias} /> : <div className="h-8 rounded bg-white/5" />}

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
