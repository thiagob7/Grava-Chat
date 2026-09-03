import React from "react";
import { toast } from "react-toastify";
import {
  Activity,
  Cpu,
  Database,
  Hash,
  HardDrive,
  Lock,
  Mic,
  MicOff,
  MemoryStick,
  MonitorUp,
  Fingerprint,
  Ghost,
  Radio,
  Video,
} from "lucide-react";

import type {
  ChecagemDeServico,
  FantasmaDeVoz,
  ParticipanteDaSala,
} from "~/@core/application/requests/status/find-status";
import { useStatus } from "~/@core/application/queries/status/use-status";
import { Avatar } from "~/components/Avatar";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

const duracao = (s: number) => {
  const dias = Math.floor(s / 86400);
  const horas = Math.floor((s % 86400) / 3600);
  const minutos = Math.floor((s % 3600) / 60);

  if (dias) return `${dias}d ${horas}h`;
  if (horas) return `${horas}h ${minutos}min`;
  if (minutos) return `${minutos}min`;
  return `${s}s`;
};

/// O `formatBytes` do upload para em MB, e disco de VM se mede em GB: 20 GB
/// virariam "20480.0 MB" na tela.
const tamanho = (bytes: number) => {
  const mb = bytes / 1024 / 1024;

  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 1) return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
};

export const ServidorSection: React.FC = () => {
  const { data, isLoading, isError } = useStatus(true);

  if (isLoading) return <p className="text-sm text-ink-muted">Medindo…</p>;

  if (isError || !data)
    return <p className="text-sm text-danger">Não consegui falar com a API.</p>;

  const {
    host,
    ambiente,
    carga,
    nucleos,
    memoria,
    residente,
    disco,
    uptimeDoProcesso,
    uptimeDaMaquina,
    node,
  } = data.api;
  const ehProducao = ambiente === "production";

  /*
    A carga do Linux conta processos esperando CPU, não porcentagem. Dividir
    pelos núcleos é o que transforma o número em algo que dá pra ler: 1.0 numa
    máquina de 2 threads é 50% ocupado, não "no limite".
  */
  const ocupacao = Math.min(carga.um / nucleos, 1);

  /*
    Uso de RAM contra o que o kernel diz que consegue entregar, não contra o
    "livre". Cache de disco conta como usado no `freemem` e é devolvido na
    hora que alguém precisa — medir por ali faz a VM parecer sempre cheia.
  */
  const usada = memoria.total - memoria.disponivel;
  const proporcaoDeRam = usada / memoria.total;

  const discoUsado = disco ? disco.total - disco.livre : 0;

  const salas = data.sfu.salas;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Servidor</h2>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-semibold",
              ehProducao
                ? "bg-online/15 text-online"
                : "bg-amber-500/15 text-amber-400",
            )}
          >
            {ehProducao ? "produção" : "desenvolvimento"}
          </span>
          <code className="text-ink">{host}</code>
          <span>· Node {node}</span>
          <span>· atualiza a cada 5 s</span>
        </p>

        {!ehProducao && (
          <p className="mt-2 text-xs text-ink-faint">
            Estes números são da máquina onde a API está rodando — agora, a sua.
            Abra pelo endereço publicado para ver a VM.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Cartao
          icone={<Cpu size={16} />}
          titulo="CPU"
          valor={`${Math.round(ocupacao * 100)}%`}
          detalhe={`carga ${carga.um.toFixed(2)} · ${carga.cinco.toFixed(2)} · ${carga.quinze.toFixed(2)} em ${nucleos} threads`}
          proporcao={ocupacao}
        />

        <Cartao
          icone={<MemoryStick size={16} />}
          titulo="Memória"
          valor={tamanho(usada)}
          detalhe={`de ${tamanho(memoria.total)} · ${tamanho(memoria.disponivel)} disponíveis · API ${tamanho(residente)}`}
          proporcao={proporcaoDeRam}
        />

        {disco ? (
          <Cartao
            icone={<HardDrive size={16} />}
            titulo="Disco"
            valor={tamanho(discoUsado)}
            detalhe={`de ${tamanho(disco.total)} · ${tamanho(disco.livre)} livres`}
            proporcao={discoUsado / disco.total}
          />
        ) : (
          <div className="rounded-lg border border-line bg-surface-2 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <HardDrive size={16} /> Disco
            </p>
            <p className="mt-2 text-sm text-ink-faint">
              não deu pra medir aqui
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-line bg-surface-2 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Database size={16} /> Serviços
        </p>

        <div className="mt-3 space-y-2 text-sm">
          <Linha rotulo="MongoDB (Atlas)" checagem={data.mongo} />
          <Linha rotulo="Redis (local)" checagem={data.redis} />
          <Linha
            rotulo="Gateway (Socket.IO)"
            ok={Boolean(data.gateway)}
            nota={
              data.gateway
                ? `${data.gateway.conexoes} ${data.gateway.conexoes === 1 ? "conexão" : "conexões"} · ${data.gateway.pessoas} ${data.gateway.pessoas === 1 ? "pessoa" : "pessoas"}${data.gateway.bots ? ` · ${data.gateway.bots} bot${data.gateway.bots === 1 ? "" : "s"}` : ""}`
                : undefined
            }
          />
          <Linha
            rotulo="LiveKit (SFU)"
            ok={!data.sfu.indisponivel}
            nota={
              data.sfu.indisponivel
                ? undefined
                : `${salas.length} ${salas.length === 1 ? "sala" : "salas"}`
            }
          />
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface-2 p-4">
        <p className="flex items-center justify-between gap-2 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Radio size={16} /> Chamadas agora
          </span>

          {!data.sfu.indisponivel && data.sfu.participantes > 0 && (
            <span className="text-xs font-normal text-ink-muted">
              {data.sfu.participantes}{" "}
              {data.sfu.participantes === 1 ? "pessoa" : "pessoas"} ·{" "}
              {data.sfu.publicando} com microfone aberto
            </span>
          )}
        </p>

        {data.sfu.indisponivel ? (
          <p className="mt-2 text-sm text-danger">O SFU não respondeu.</p>
        ) : salas.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Ninguém em voz.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {salas.map((sala) => (
              <div key={sala.canalId} className="rounded-lg bg-surface-2 p-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {sala.ehPrivado ? (
                      <Lock size={12} className="shrink-0 text-ink-muted" />
                    ) : (
                      <Hash size={12} className="shrink-0 text-ink-muted" />
                    )}

                    {sala.nome ? (
                      <span className="truncate font-medium">{sala.nome}</span>
                    ) : (
                      <Aviso motivo={sala.motivo ?? "canal-apagado"} />
                    )}

                    {sala.servidor && (
                      <span className="truncate text-xs text-ink-muted">
                        · {sala.servidor}
                      </span>
                    )}

                    <Identificador id={sala.canalId} oQueE="canal" />
                  </span>

                  <span className="shrink-0 text-xs text-ink-faint">
                    há{" "}
                    {duracao(
                      Math.max(
                        0,
                        Math.round(Date.now() / 1000 - sala.criadaEm),
                      ),
                    )}
                  </span>
                </div>

                {/*
                  Sala aberta e vazia acontece: o LiveKit segura a sala por um
                  tempinho depois que o último sai. Dizer isso evita a caçada a
                  um fantasma que não existe.
                */}
                {sala.participantes.length === 0 ? (
                  <p className="mt-2 text-xs text-ink-faint">
                    Sala aberta, sem ninguém dentro — o SFU ainda vai fechá-la.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {sala.participantes.map((p) => (
                      <Pessoa key={p.id} pessoa={p} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/*
          Divergência é o motivo de o painel perguntar ao LiveKit em vez de ao
          Redis. Se ela nunca aparece na tela, a comparação não serviu pra nada.
        */}
        {data.sfu.fantasmas.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-amber-400">
              <Ghost size={14} />
              {data.sfu.fantasmas.length === 1
                ? "1 pessoa que o app acha que está em chamada"
                : `${data.sfu.fantasmas.length} pessoas que o app acha que estão em chamada`}
              , mas o SFU não vê
            </p>

            <div className="mt-2 space-y-1">
              {data.sfu.fantasmas.map((f) => (
                <Fantasma key={f.id} fantasma={f} />
              ))}
            </div>
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

const Pessoa: React.FC<{ pessoa: ParticipanteDaSala }> = ({ pessoa }) => (
  <div className="flex items-center gap-2">
    <Avatar
      id={pessoa.id}
      name={pessoa.nome}
      url={pessoa.avatarUrl}
      size={24}
    />

    <span className="min-w-0 flex-1 truncate text-sm">{pessoa.nome}</span>

    <Identificador id={pessoa.id} oQueE="usuário" />

    {pessoa.soNoSfu && (
      <span
        className="shrink-0 rounded bg-amber-500/15 px-1.5 text-xs text-amber-400"
        title="Está no SFU, mas o app não tem estado de voz desta pessoa"
      >
        só no SFU
      </span>
    )}

    <span className="flex shrink-0 items-center gap-2 text-ink-faint">
      {pessoa.camera && <Video size={14} className="text-ink-muted" />}
      {pessoa.tela && <MonitorUp size={14} className="text-ink-muted" />}

      {pessoa.microfone === "aberto" ? (
        <Mic size={14} className="text-online" />
      ) : pessoa.microfone === "mudo" ? (
        <MicOff size={14} className="text-ink-muted" />
      ) : (
        <span title="não publicou microfone">
          <MicOff size={14} className="text-danger" />
        </span>
      )}

      <span className="w-12 text-right text-xs tabular-nums">
        {duracao(Math.max(0, Math.round(Date.now() / 1000 - pessoa.entrouEm)))}
      </span>
    </span>
  </div>
);

/*
  O id fica atrás do ícone porque ele é o dado mais feio e o menos consultado
  da linha — mas quando é preciso, é preciso inteiro e sem erro de digitação,
  então o clique copia em vez de pedir seleção com o mouse.
*/
const Identificador: React.FC<{ id: string; oQueE: string }> = ({
  id,
  oQueE,
}) => (
  <Tooltip label={`${oQueE} ${id} · clique para copiar`}>
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(id);
        toast.success("ID copiado.");
      }}
      className="shrink-0 text-ink-faint transition hover:text-ink"
      aria-label={`Copiar ID do ${oQueE}`}
    >
      <Fingerprint size={12} />
    </button>
  </Tooltip>
);

/*
  Quando não há nome, o motivo OCUPA o lugar do nome: "canal apagado" dito no
  lugar do título e repetido numa etiqueta ao lado é a mesma frase duas vezes,
  e continua sem dizer o que fazer com ela. A explicação inteira fica no hover.
*/
const AVISOS = {
  "canal-apagado": {
    rotulo: "canal apagado",
    explicacao:
      "O canal não existe mais no banco, mas a chamada continua de pé no SFU. A varredura de fantasmas encerra sozinha quando o último sair.",
  },
  "outro-ambiente": {
    rotulo: "chamada de outro ambiente",
    explicacao:
      "Ninguém desta sala existe neste banco: o LIVEKIT_URL desta API aponta para o SFU de outro ambiente. É o que o .env de desenvolvimento faz — ele mira o LiveKit de produção.",
  },
} as const;

const Aviso: React.FC<{ motivo: keyof typeof AVISOS }> = ({ motivo }) => (
  <Tooltip label={AVISOS[motivo].explicacao}>
    <span className="cursor-help truncate font-medium italic text-amber-400">
      {AVISOS[motivo].rotulo}
    </span>
  </Tooltip>
);

const Fantasma: React.FC<{ fantasma: FantasmaDeVoz }> = ({ fantasma }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="min-w-0 flex-1 truncate text-ink">
      {fantasma.nome}
      <span className="text-ink-muted">
        {" em "}
        {fantasma.canal ?? <span className="italic">canal apagado</span>}
      </span>
    </span>

    <Identificador id={fantasma.id} oQueE="usuário" />

    {fantasma.aguardandoVolta && (
      <span
        className="shrink-0 text-ink-faint"
        title="Caiu e está na janela de reconexão"
      >
        reconectando
      </span>
    )}

    <span className="shrink-0 tabular-nums text-ink-faint">
      há {duracao(Math.max(0, Math.round(Date.now() / 1000 - fantasma.desde)))}
    </span>
  </div>
);

const Cartao: React.FC<{
  icone: React.ReactNode;
  titulo: string;
  valor: string;
  detalhe: string;
  proporcao: number;
}> = ({ icone, titulo, valor, detalhe, proporcao }) => (
  <div className="rounded-lg border border-line bg-surface-2 p-4">
    <p className="flex items-center gap-2 text-sm font-medium">
      {icone} {titulo}
    </p>

    <p className="mt-2 text-2xl font-semibold">{valor}</p>

    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          proporcao > 0.85
            ? "bg-danger"
            : proporcao > 0.6
              ? "bg-amber-500"
              : "bg-online",
        )}
        style={{ width: `${Math.round(proporcao * 100)}%` }}
      />
    </div>

    <p className="mt-2 text-xs text-ink-faint">{detalhe}</p>
  </div>
);

const Linha: React.FC<{
  rotulo: string;
  checagem?: ChecagemDeServico;
  ok?: boolean;
  nota?: string;
}> = ({ rotulo, checagem, ok, nota }) => {
  const noAr = checagem ? checagem.estado === "up" : Boolean(ok);
  /// Lento é um jeito de estar quebrado. 300 ms num ping é ruim o bastante pra
  /// aparecer amarelo antes de virar fora do ar.
  const lento = noAr && checagem !== undefined && checagem.ms > 300;

  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{rotulo}</span>

      <span className="flex items-center gap-1.5">
        {(checagem || nota) && (
          <span
            className={cn(
              "text-xs tabular-nums",
              lento ? "text-amber-400" : "text-ink-faint",
            )}
          >
            {checagem ? `${checagem.ms} ms` : nota}
          </span>
        )}

        <span
          className={cn(
            "flex items-center gap-1.5",
            noAr ? (lento ? "text-amber-400" : "text-online") : "text-danger",
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              noAr ? (lento ? "bg-amber-500" : "bg-online") : "bg-danger",
            )}
          />
          {noAr ? (lento ? "lento" : "no ar") : "fora"}
        </span>
      </span>
    </div>
  );
};
