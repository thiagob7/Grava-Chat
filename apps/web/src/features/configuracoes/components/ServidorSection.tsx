import React from "react";
import { toast } from "react-toastify";
import {
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
  CheckService,
  VoiceGhost,
  RoomParticipant,
} from "~/@core/application/requests/status/find-status";
import { useStatus } from "~/@core/application/queries/status/use-status";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Tooltip } from "~/components/ui/tooltip";
import { copyText } from "~/lib/copiar";
import { cn } from "~/lib/utils";

const duration = (s: number) => {
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);

  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}min`;
  if (minutes) return `${minutes}min`;
  return `${s}s`;
};

const size = (bytes: number) => {
  const mb = bytes / 1024 / 1024;

  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 1) return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
};

export const ServerSection: React.FC = () => {
  const { data, isLoading, isError } = useStatus(true);

  if (isLoading) return <p data-gc="configuracoes.servidor-section.p" className="text-sm text-ink-muted">Medindo…</p>;

  if (isError || !data)
    return <p data-gc="configuracoes.servidor-section.p--2" className="text-sm text-danger">Não consegui falar com a API.</p>;

  const { environment, node, processUptime } = data.api;
  const isProduction = environment === "production";
  const rooms = data.sfu.rooms;

  return (
    <div data-gc="configuracoes.servidor-section.div" className="max-w-2xl space-y-6">
      <div data-gc="configuracoes.servidor-section.div--2">
        <h2 data-gc="configuracoes.servidor-section.h2" className="text-lg font-semibold">Servidor</h2>
        <p data-gc="configuracoes.servidor-section.p--3" className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <span data-gc="configuracoes.servidor-section.span"
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-semibold",
              isProduction
                ? "bg-online/15 text-online"
                : "bg-aviso/15 text-aviso",
            )}
          >
            {isProduction ? "produção" : "desenvolvimento"}
          </span>
          <span data-gc="configuracoes.servidor-section.span--2">atualiza a cada 5 s</span>
        </p>

        {!isProduction && (
          <p data-gc="configuracoes.servidor-section.p--4" className="mt-2 text-xs text-ink-faint">
            Estes números são da máquina onde a API está rodando — agora, a sua.
            Abra pelo endereço publicado para ver a VM.
          </p>
        )}
      </div>

      <Machine data-gc="configuracoes.servidor-section.machine"
        box={{
          title: "API",
          host: data.api.host,
          legenda: `Node ${node} · no ar há ${duration(processUptime)}`,
          carga: data.api.carga,
          cores: data.api.cores,
          memoria: data.api.memoria,
          disk: data.api.disk,
          resident: { label: "API", bytes: data.api.resident },
          machineUptime: data.api.machineUptime,
        }}
      />

      {data.voice?.unavailable === true ? (
        <div data-gc="configuracoes.servidor-section.div--3" className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <p data-gc="configuracoes.servidor-section.p--5" className="text-sm font-medium">Voz</p>
          <p data-gc="configuracoes.servidor-section.p--6" className="mt-1 text-sm text-danger">
            A máquina do SFU não respondeu.
          </p>
          <p data-gc="configuracoes.servidor-section.p--7" className="mt-1 text-xs text-ink-faint">
            Não quer dizer que as chamadas caíram: quem as segura é o LiveKit, e
            ele é medido separado, em Serviços. Isto aqui é o agente de métricas
            da caixa.
          </p>
        </div>
      ) : (
        data.voice && (
          <Machine data-gc="configuracoes.servidor-section.machine--2"
            box={{
              title: "Voz",
              host: data.voice.host,
              legenda: `LiveKit ${data.voice.livekit.inAr ? "no ar" : "parado"} · ${data.voice.ms} ms daqui`,
              carga: data.voice.carga,
              cores: data.voice.cores,
              memoria: data.voice.memoria,
              disk: data.voice.disk,
              resident: { label: "LiveKit", bytes: data.voice.livekit.resident },
              machineUptime: data.voice.machineUptime,
            }}
          />
        )
      )}

      <div data-gc="configuracoes.servidor-section.div--4" className="rounded-lg border border-line bg-surface-2 p-4">
        <p data-gc="configuracoes.servidor-section.p--8" className="flex items-center gap-2 text-sm font-medium">
          <Database data-gc="configuracoes.servidor-section.database" size={16} /> Serviços
        </p>

        <div data-gc="configuracoes.servidor-section.div--5" className="mt-3 space-y-2 text-sm">
          <Line data-gc="configuracoes.servidor-section.line" label="MongoDB (Atlas)" check={data.mongo} />
          <Line data-gc="configuracoes.servidor-section.line--2" label="Redis (local)" check={data.redis} />
          <Line data-gc="configuracoes.servidor-section.line--3"
            label="Gateway (Socket.IO)"
            ok={Boolean(data.gateway)}
            note={
              data.gateway
                ? `${data.gateway.connections} ${data.gateway.connections === 1 ? "conexão" : "conexões"} · ${data.gateway.people} ${data.gateway.people === 1 ? "pessoa" : "pessoas"}${data.gateway.bots ? ` · ${data.gateway.bots} bot${data.gateway.bots === 1 ? "" : "s"}` : ""}`
                : undefined
            }
          />
          <Line data-gc="configuracoes.servidor-section.line--4"
            label="LiveKit (SFU)"
            ok={!data.sfu.unavailable}
            note={
              data.sfu.unavailable
                ? undefined
                : `${rooms.length} ${rooms.length === 1 ? "sala" : "salas"}`
            }
          />
        </div>
      </div>

      <div data-gc="configuracoes.servidor-section.div--6" className="rounded-lg border border-line bg-surface-2 p-4">
        <p data-gc="configuracoes.servidor-section.p--9" className="flex items-center justify-between gap-2 text-sm font-medium">
          <span data-gc="configuracoes.servidor-section.span--3" className="flex items-center gap-2">
            <Radio data-gc="configuracoes.servidor-section.radio" size={16} /> Chamadas agora
          </span>

          {!data.sfu.unavailable && data.sfu.participants > 0 && (
            <span data-gc="configuracoes.servidor-section.span--4" className="text-xs font-normal text-ink-muted">
              {data.sfu.participants}{" "}
              {data.sfu.participants === 1 ? "pessoa" : "pessoas"} ·{" "}
              {data.sfu.publishing} com microfone aberto
            </span>
          )}
        </p>

        {data.sfu.unavailable ? (
          <p data-gc="configuracoes.servidor-section.p--10" className="mt-2 text-sm text-danger">O SFU não respondeu.</p>
        ) : rooms.length === 0 ? (
          <p data-gc="configuracoes.servidor-section.p--11" className="mt-2 text-sm text-ink-muted">Ninguém em voz.</p>
        ) : (
          <div data-gc="configuracoes.servidor-section.div--7" className="mt-3 space-y-3">
            {rooms.map((room) => (
              <div data-gc="configuracoes.servidor-section.div--8" key={room.channelId} className="rounded-lg bg-surface-2 p-3">
                <div data-gc="configuracoes.servidor-section.div--9" className="flex items-center justify-between gap-2 text-sm">
                  <span data-gc="configuracoes.servidor-section.span--5" className="flex min-w-0 items-center gap-1.5">
                    {room.isPrivate ? (
                      <Lock data-gc="configuracoes.servidor-section.lock" size={12} className="shrink-0 text-ink-muted" />
                    ) : (
                      <Hash data-gc="configuracoes.servidor-section.hash" size={12} className="shrink-0 text-ink-muted" />
                    )}

                    {room.name ? (
                      <span data-gc="configuracoes.servidor-section.span--6" className="truncate font-medium">{room.name}</span>
                    ) : (
                      <Notice data-gc="configuracoes.servidor-section.notice" reason={room.reason ?? "canal-apagado"} />
                    )}

                    {room.server && (
                      <span data-gc="configuracoes.servidor-section.span--7" className="truncate text-xs text-ink-muted">
                        · {room.server}
                      </span>
                    )}

                    <Identifier data-gc="configuracoes.servidor-section.identifier" id={room.channelId} oQueE="canal" />
                  </span>

                  <span data-gc="configuracoes.servidor-section.span--8" className="shrink-0 text-xs text-ink-faint">
                    há{" "}
                    {duration(
                      Math.max(
                        0,
                        Math.round(Date.now() / 1000 - room.createdAt),
                      ),
                    )}
                  </span>
                </div>

                {room.participants.length === 0 ? (
                  <p data-gc="configuracoes.servidor-section.p--12" className="mt-2 text-xs text-ink-faint">
                    Sala aberta, sem ninguém dentro — o SFU ainda vai fechá-la.
                  </p>
                ) : (
                  <div data-gc="configuracoes.servidor-section.div--10" className="mt-2 space-y-1.5">
                    {room.participants.map((p) => (
                      <Person data-gc="configuracoes.servidor-section.person" key={p.id} person={p} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {data.sfu.ghosts.length > 0 && (
          <div data-gc="configuracoes.servidor-section.div--11" className="mt-3 rounded-lg border border-aviso/30 bg-aviso/5 p-3">
            <p data-gc="configuracoes.servidor-section.p--13" className="flex items-center gap-2 text-xs font-medium text-aviso">
              <Ghost data-gc="configuracoes.servidor-section.ghost" size={14} />
              {data.sfu.ghosts.length === 1
                ? "1 pessoa que o app acha que está em chamada"
                : `${data.sfu.ghosts.length} pessoas que o app acha que estão em chamada`}
              , mas o SFU não vê
            </p>

            <div data-gc="configuracoes.servidor-section.div--12" className="mt-2 space-y-1">
              {data.sfu.ghosts.map((f) => (
                <GhostRow data-gc="configuracoes.servidor-section.ghost-row" key={f.id} ghost={f} />
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

const Person: React.FC<{ person: RoomParticipant }> = ({ person }) => (
  <div data-gc="configuracoes.servidor-section.div--13" className="flex items-center gap-2">
    <Avatar data-gc="configuracoes.servidor-section.avatar"
      id={person.id}
      name={person.name}
      url={person.avatarUrl}
      size={24}
    />

    <span data-gc="configuracoes.servidor-section.span--9" className="min-w-0 flex-1 truncate text-sm">{person.name}</span>

    <Identifier data-gc="configuracoes.servidor-section.identifier--2" id={person.id} oQueE="usuário" />

    {person.soNoSfu && (
      <span data-gc="configuracoes.servidor-section.span--10"
        className="shrink-0 rounded bg-aviso/15 px-1.5 text-xs text-aviso"
        title="Está no SFU, mas o app não tem estado de voz desta pessoa"
      >
        só no SFU
      </span>
    )}

    <span data-gc="configuracoes.servidor-section.span--11" className="flex shrink-0 items-center gap-2 text-ink-faint">
      {person.camera && <Video data-gc="configuracoes.servidor-section.video" size={14} className="text-ink-muted" />}
      {person.display && <MonitorUp data-gc="configuracoes.servidor-section.monitor-up" size={14} className="text-ink-muted" />}

      {person.microphone === "aberto" ? (
        <Mic data-gc="configuracoes.servidor-section.mic" size={14} className="text-online" />
      ) : person.microphone === "mudo" ? (
        <MicOff data-gc="configuracoes.servidor-section.mic-off" size={14} className="text-ink-muted" />
      ) : (
        <span data-gc="configuracoes.servidor-section.span--12" title="não publicou microfone">
          <MicOff data-gc="configuracoes.servidor-section.mic-off--2" size={14} className="text-danger" />
        </span>
      )}

      <span data-gc="configuracoes.servidor-section.span--13" className="w-12 text-right text-xs tabular-nums">
        {duration(Math.max(0, Math.round(Date.now() / 1000 - person.joinedAt)))}
      </span>
    </span>
  </div>
);

const Identifier: React.FC<{ id: string; oQueE: string }> = ({
  id,
  oQueE,
}) => (
  <Tooltip data-gc="configuracoes.servidor-section.tooltip" label={`${oQueE} ${id} · clique para copiar`}>
    <button data-gc="configuracoes.servidor-section.button"
      type="button"
      onClick={() => {
        void copyText(id);
        toast.success("ID copiado.");
      }}
      className="shrink-0 text-ink-faint transition hover:text-ink"
      aria-label={`Copiar ID do ${oQueE}`}
    >
      <Fingerprint data-gc="configuracoes.servidor-section.fingerprint" size={12} />
    </button>
  </Tooltip>
);

const NOTICES = {
  "canal-apagado": {
    label: "canal apagado",
    explanation:
      "O canal não existe mais no banco, mas a chamada continua de pé no SFU. A varredura de fantasmas encerra sozinha quando o último sair.",
  },
  "outro-ambiente": {
    label: "chamada de outro ambiente",
    explanation:
      "Ninguém desta sala existe neste banco: o LIVEKIT_URL desta API aponta para o SFU de outro ambiente. É o que o .env de desenvolvimento faz — ele mira o LiveKit de produção.",
  },
} as const;

const Notice: React.FC<{ reason: keyof typeof NOTICES }> = ({ reason }) => (
  <Tooltip data-gc="configuracoes.servidor-section.tooltip--2" label={NOTICES[reason].explanation}>
    <span data-gc="configuracoes.servidor-section.span--14" className="cursor-help truncate font-medium italic text-aviso">
      {NOTICES[reason].label}
    </span>
  </Tooltip>
);

const GhostRow: React.FC<{ ghost: VoiceGhost }> = ({ ghost }) => (
  <div data-gc="configuracoes.servidor-section.div--14" className="flex items-center gap-2 text-xs">
    <span data-gc="configuracoes.servidor-section.span--15" className="min-w-0 flex-1 truncate text-ink">
      {ghost.name}
      <span data-gc="configuracoes.servidor-section.span--16" className="text-ink-muted">
        {" em "}
        {ghost.channel ?? <span data-gc="configuracoes.servidor-section.span--17" className="italic">canal apagado</span>}
      </span>
    </span>

    <Identifier data-gc="configuracoes.servidor-section.identifier--3" id={ghost.id} oQueE="usuário" />

    {ghost.awaitingBack && (
      <span data-gc="configuracoes.servidor-section.span--18"
        className="shrink-0 text-ink-faint"
        title="Caiu e está na janela de reconexão"
      >
        reconectando
      </span>
    )}

    <span data-gc="configuracoes.servidor-section.span--19" className="shrink-0 tabular-nums text-ink-faint">
      há {duration(Math.max(0, Math.round(Date.now() / 1000 - ghost.since)))}
    </span>
  </div>
);

interface Box {
  title: string;
  host: string;
  legenda: string;
  carga: { um: number; five: number; quinze: number };
  cores: number;
  memoria: { total: number; livre: number; available: number };
  disk: { total: number; livre: number } | null;
  resident: { label: string; bytes: number };
  machineUptime: number;
}

const Machine: React.FC<{ box: Box }> = ({ box }) => {
  const occupancy = Math.min(box.carga.um / box.cores, 1);

  const used = box.memoria.total - box.memoria.available;
  const diskUsed = box.disk ? box.disk.total - box.disk.livre : 0;

  return (
    <div data-gc="configuracoes.servidor-section.div--15">
      <p data-gc="configuracoes.servidor-section.p--14" className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
        <span data-gc="configuracoes.servidor-section.span--20" className="font-medium">{box.title}</span>
        <code data-gc="configuracoes.servidor-section.code" className="text-xs text-ink-muted">{box.host}</code>
        <span data-gc="configuracoes.servidor-section.span--21" className="text-xs text-ink-faint">
          · {box.legenda} · ligada há {duration(box.machineUptime)}
        </span>
      </p>

      <div data-gc="configuracoes.servidor-section.div--16" className="grid gap-3 sm:grid-cols-3">
        <Card data-gc="configuracoes.servidor-section.card"
          icon={<Cpu data-gc="configuracoes.servidor-section.cpu" size={16} />}
          title="CPU"
          value={`${Math.round(occupancy * 100)}%`}
          detail={`carga ${box.carga.um.toFixed(2)} · ${box.carga.five.toFixed(2)} · ${box.carga.quinze.toFixed(2)} em ${box.cores} threads`}
          ratio={occupancy}
        />

        <Card data-gc="configuracoes.servidor-section.card--2"
          icon={<MemoryStick data-gc="configuracoes.servidor-section.memory-stick" size={16} />}
          title="Memória"
          value={size(used)}
          detail={`de ${size(box.memoria.total)} · ${size(box.memoria.available)} disponíveis · ${box.resident.label} ${size(box.resident.bytes)}`}
          ratio={used / box.memoria.total}
        />

        {box.disk ? (
          <Card data-gc="configuracoes.servidor-section.card--3"
            icon={<HardDrive data-gc="configuracoes.servidor-section.hard-drive" size={16} />}
            title="Disco"
            value={size(diskUsed)}
            detail={`de ${size(box.disk.total)} · ${size(box.disk.livre)} livres`}
            ratio={diskUsed / box.disk.total}
          />
        ) : (
          <div data-gc="configuracoes.servidor-section.div--17" className="rounded-lg border border-line bg-surface-2 p-4">
            <p data-gc="configuracoes.servidor-section.p--15" className="flex items-center gap-2 text-sm font-medium">
              <HardDrive data-gc="configuracoes.servidor-section.hard-drive--2" size={16} /> Disco
            </p>
            <p data-gc="configuracoes.servidor-section.p--16" className="mt-2 text-sm text-ink-faint">não deu pra medir aqui</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Card: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  ratio: number;
}> = ({ icon, title, value, detail, ratio }) => (
  <div data-gc="configuracoes.servidor-section.div--18" className="rounded-lg border border-line bg-surface-2 p-4">
    <p data-gc="configuracoes.servidor-section.p--17" className="flex items-center gap-2 text-sm font-medium">
      {icon} {title}
    </p>

    <p data-gc="configuracoes.servidor-section.p--18" className="mt-2 text-2xl font-semibold">{value}</p>

    <div data-gc="configuracoes.servidor-section.div--19" className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
      <div data-gc="configuracoes.servidor-section.div--20"
        className={cn(
          "h-full rounded-full transition-all",
          ratio > 0.85
            ? "bg-danger"
            : ratio > 0.6
              ? "bg-aviso"
              : "bg-online",
        )}
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>

    <p data-gc="configuracoes.servidor-section.p--19" className="mt-2 text-xs text-ink-faint">{detail}</p>
  </div>
);

const Line: React.FC<{
  label: string;
  check?: CheckService;
  ok?: boolean;
  note?: string;
}> = ({ label, check, ok, note }) => {
  const inAr = check ? check.state === "up" : Boolean(ok);
  const slow = inAr && check !== undefined && check.ms > 300;

  return (
    <div data-gc="configuracoes.servidor-section.div--21" className="flex items-center justify-between">
      <span data-gc="configuracoes.servidor-section.span--22" className="text-ink-muted">{label}</span>

      <span data-gc="configuracoes.servidor-section.span--23" className="flex items-center gap-1.5">
        {(check || note) && (
          <span data-gc="configuracoes.servidor-section.span--24"
            className={cn(
              "text-xs tabular-nums",
              slow ? "text-aviso" : "text-ink-faint",
            )}
          >
            {check ? `${check.ms} ms` : note}
          </span>
        )}

        <span data-gc="configuracoes.servidor-section.span--25"
          className={cn(
            "flex items-center gap-1.5",
            inAr ? (slow ? "text-aviso" : "text-online") : "text-danger",
          )}
        >
          <span data-gc="configuracoes.servidor-section.span--26"
            className={cn(
              "size-2 rounded-full",
              inAr ? (slow ? "bg-aviso" : "bg-online") : "bg-danger",
            )}
          />
          {inAr ? (slow ? "lento" : "no ar") : "fora"}
        </span>
      </span>
    </div>
  );
};
