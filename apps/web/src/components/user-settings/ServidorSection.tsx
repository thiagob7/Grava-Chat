import React from "react";
import { Activity, Cpu, Database, HardDrive, Radio } from "lucide-react";

import { useStatus } from "~/@core/application/queries/status/use-status";
import { formatBytes } from "~/lib/image";
import { cn } from "~/lib/utils";

const duracao = (s: number) => {
  const dias = Math.floor(s / 86400);
  const horas = Math.floor((s % 86400) / 3600);
  const minutos = Math.floor((s % 3600) / 60);

  if (dias) return `${dias}d ${horas}h`;
  if (horas) return `${horas}h ${minutos}min`;
  return `${minutos}min`;
};

export const ServidorSection: React.FC = () => {
  const { data, isLoading, isError } = useStatus(true);

  if (isLoading) return <p className="text-sm text-ink-muted">Medindo…</p>;

  if (isError || !data)
    return <p className="text-sm text-danger">Não consegui falar com a API.</p>;

  const { host, ambiente, carga, nucleos, memoria, uptimeDoProcesso, uptimeDaMaquina } =
    data.api;
  const ehProducao = ambiente === "production";

  /*
    A carga do Linux conta processos esperando CPU, não porcentagem. Dividir
    pelos núcleos é o que transforma o número em algo que dá pra ler: 1.0 numa
    máquina de 2 threads é 50% ocupado, não "no limite".
  */
  const ocupacao = Math.min(carga.um / nucleos, 1);
  const usada = memoria.total - memoria.livre;
  const proporcaoDeRam = usada / memoria.total;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Servidor</h2>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-semibold",
              ehProducao ? "bg-online/15 text-online" : "bg-amber-500/15 text-amber-400",
            )}
          >
            {ehProducao ? "produção" : "desenvolvimento"}
          </span>
          <code className="text-ink">{host}</code>
          <span>· atualiza a cada 5 s</span>
        </p>

        {!ehProducao && (
          <p className="mt-2 text-xs text-ink-faint">
            Estes números são da máquina onde a API está rodando — agora, a sua.
            Abra pelo endereço publicado para ver a VM.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Cartao
          icone={<Cpu size={16} />}
          titulo="CPU"
          valor={`${Math.round(ocupacao * 100)}%`}
          detalhe={`carga ${carga.um.toFixed(2)} · ${carga.cinco.toFixed(2)} · ${carga.quinze.toFixed(2)} em ${nucleos} threads`}
          proporcao={ocupacao}
        />

        <Cartao
          icone={<HardDrive size={16} />}
          titulo="Memória"
          valor={formatBytes(usada)}
          detalhe={`de ${formatBytes(memoria.total)} · ${formatBytes(memoria.livre)} livres`}
          proporcao={proporcaoDeRam}
        />
      </div>

      <div className="rounded-lg border border-line bg-surface-1 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Database size={16} /> Serviços
        </p>

        <div className="mt-3 space-y-2 text-sm">
          <Linha rotulo="MongoDB (Atlas)" ok={data.mongo === "up"} />
          <Linha rotulo="Redis (local)" ok={data.redis === "up"} />
          <Linha rotulo="LiveKit (SFU)" ok={!data.sfu.indisponivel} />
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface-1 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Radio size={16} /> Chamadas agora
        </p>

        {data.sfu.indisponivel ? (
          <p className="mt-2 text-sm text-danger">O SFU não respondeu.</p>
        ) : data.sfu.salas.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Ninguém em voz.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {data.sfu.salas.map((sala) => (
              <div
                key={sala.nome}
                className="flex items-center justify-between rounded bg-surface-2 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate font-mono text-xs text-ink-muted">
                  {sala.nome}
                </span>
                <span>
                  {sala.participantes} na sala · {sala.publicando} falando
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="flex items-center gap-2 text-xs text-ink-faint">
        <Activity size={14} className="shrink-0" />
        API no ar há {duracao(uptimeDoProcesso)} · máquina ligada há{" "}
        {duracao(uptimeDaMaquina)}
      </p>
    </div>
  );
};

const Cartao: React.FC<{
  icone: React.ReactNode;
  titulo: string;
  valor: string;
  detalhe: string;
  proporcao: number;
}> = ({ icone, titulo, valor, detalhe, proporcao }) => (
  <div className="rounded-lg border border-line bg-surface-1 p-4">
    <p className="flex items-center gap-2 text-sm font-medium">
      {icone} {titulo}
    </p>

    <p className="mt-2 text-2xl font-semibold">{valor}</p>

    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          proporcao > 0.85 ? "bg-danger" : proporcao > 0.6 ? "bg-amber-500" : "bg-online",
        )}
        style={{ width: `${Math.round(proporcao * 100)}%` }}
      />
    </div>

    <p className="mt-2 text-xs text-ink-faint">{detalhe}</p>
  </div>
);

const Linha: React.FC<{ rotulo: string; ok: boolean }> = ({ rotulo, ok }) => (
  <div className="flex items-center justify-between">
    <span className="text-ink-muted">{rotulo}</span>
    <span className={cn("flex items-center gap-1.5", ok ? "text-online" : "text-danger")}>
      <span className={cn("size-2 rounded-full", ok ? "bg-online" : "bg-danger")} />
      {ok ? "no ar" : "fora"}
    </span>
  </div>
);
