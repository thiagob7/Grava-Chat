import React from "react";
import { toast } from "react-toastify";
import {
  Activity,
  AlertTriangle,
  Cpu,
  Database,
  Fingerprint,
  Ghost,
  HardDrive,
  Hash,
  Layers,
  Lock,
  MemoryStick,
  Mic,
  MicOff,
  MonitorUp,
  Plug,
  Radio,
  RefreshCw,
  Server,
  ServerCrash,
  Video,
} from "lucide-react";

import type {
  CheckService,
  VoiceGhost,
  RoomParticipant,
} from "~/@core/application/requests/status/find-status";
import { useStatus } from "~/@core/application/queries/status/use-status";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Callout,
  EmptyState,
  Heading,
  Panel,
  StatTile,
  StatusPill,
} from "~/features/configuracoes/components/painel/PainelUi";
import { Tooltip } from "~/components/ui/tooltip";
import { copyText } from "~/lib/copiar";

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

  if (isLoading) {
    return (
      <div data-gc="configuracoes.servidor-section.div" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton data-gc="configuracoes.servidor-section.skeleton" key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Callout data-gc="configuracoes.servidor-section.callout" tone="danger" icon={<ServerCrash data-gc="configuracoes.servidor-section.server-crash" size={16} />} title="Não consegui falar com a API">
        O painel pergunta a cada 5 segundos. Se continuar assim, a API pode estar fora do ar.
      </Callout>
    );
  }

  const { environment, node, processUptime } = data.api;
  const isProduction = environment === "production";
  const rooms = data.sfu.rooms;
  const gateway = data.gateway;

  return (
    <div data-gc="configuracoes.servidor-section.div--2" className="w-full space-y-6 pb-10">
      <div data-gc="configuracoes.servidor-section.div--3" className="flex flex-wrap items-center gap-3">
        <StatusPill data-gc="configuracoes.servidor-section.status-pill" tone={isProduction ? "ok" : "warn"}>{isProduction ? "Produção" : "Desenvolvimento"}</StatusPill>
        <span data-gc="configuracoes.servidor-section.span" className="flex items-center gap-1.5 text-xs text-ink-faint">
          <RefreshCw data-gc="configuracoes.servidor-section.refresh-cw" size={12} /> atualiza a cada 5 s
        </span>
        {!isProduction && (
          <span data-gc="configuracoes.servidor-section.span--2" className="text-xs text-ink-faint">
            · os números são da máquina onde a API roda agora, a sua. Abra pelo endereço publicado para ver a VM.
          </span>
        )}
      </div>

      <section data-gc="configuracoes.servidor-section.section">
        <Heading data-gc="configuracoes.servidor-section.heading" icon={<Activity data-gc="configuracoes.servidor-section.activity" size={14} />}>Serviços</Heading>
        <div data-gc="configuracoes.servidor-section.div--4" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatTile data-gc="configuracoes.servidor-section.stat-tile"
            icon={<Server data-gc="configuracoes.servidor-section.server" size={15} />}
            label="API"
            value={duration(processUptime)}
            detail={`no ar · Node ${node}`}
            badge={<StatusPill data-gc="configuracoes.servidor-section.status-pill--2" tone="ok">no ar</StatusPill>}
          />
          <ServiceTile data-gc="configuracoes.servidor-section.service-tile" icon={<Database data-gc="configuracoes.servidor-section.database" size={15} />} label="MongoDB" hint="Atlas" check={data.mongo} />
          <ServiceTile data-gc="configuracoes.servidor-section.service-tile--2" icon={<Layers data-gc="configuracoes.servidor-section.layers" size={15} />} label="Redis" hint="local" check={data.redis} />
          <StatTile data-gc="configuracoes.servidor-section.stat-tile--2"
            icon={<Plug data-gc="configuracoes.servidor-section.plug" size={15} />}
            label="Gateway"
            value={gateway ? gateway.connections : "—"}
            detail={
              gateway
                ? `${gateway.connections === 1 ? "conexão" : "conexões"} · ${gateway.people} ${gateway.people === 1 ? "pessoa" : "pessoas"}${gateway.bots ? ` · ${gateway.bots} bot${gateway.bots === 1 ? "" : "s"}` : ""}`
                : "Socket.IO sem resposta"
            }
            badge={<StatusPill data-gc="configuracoes.servidor-section.status-pill--3" tone={gateway ? "ok" : "danger"}>{gateway ? "no ar" : "fora"}</StatusPill>}
          />
          <StatTile data-gc="configuracoes.servidor-section.stat-tile--3"
            icon={<Radio data-gc="configuracoes.servidor-section.radio" size={15} />}
            label="LiveKit"
            value={data.sfu.unavailable ? "—" : data.sfu.participants}
            detail={
              data.sfu.unavailable
                ? "o SFU não respondeu"
                : `${data.sfu.participants === 1 ? "pessoa" : "pessoas"} em ${rooms.length} ${rooms.length === 1 ? "sala" : "salas"}`
            }
            badge={<StatusPill data-gc="configuracoes.servidor-section.status-pill--4" tone={data.sfu.unavailable ? "danger" : "ok"}>{data.sfu.unavailable ? "fora" : "no ar"}</StatusPill>}
          />
        </div>
      </section>

      <section data-gc="configuracoes.servidor-section.section--2">
        <Heading data-gc="configuracoes.servidor-section.heading--2" icon={<Cpu data-gc="configuracoes.servidor-section.cpu" size={14} />}>Máquinas</Heading>
        <div data-gc="configuracoes.servidor-section.div--5" className="grid items-start gap-4 2xl:grid-cols-2">
          <Machine data-gc="configuracoes.servidor-section.machine"
            box={{
              title: "API",
              host: data.api.host,
              legenda: `ligada há ${duration(data.api.machineUptime)}`,
              carga: data.api.carga,
              cores: data.api.cores,
              memoria: data.api.memoria,
              disk: data.api.disk,
              resident: { label: "API", bytes: data.api.resident },
            }}
          />

          {data.voice?.unavailable === true ? (
            <Panel data-gc="configuracoes.servidor-section.panel" title="Voz" icon={<Radio data-gc="configuracoes.servidor-section.radio--2" size={16} />} description="máquina do SFU" actions={<StatusPill data-gc="configuracoes.servidor-section.status-pill--5" tone="danger">sem métricas</StatusPill>}>
              <Callout data-gc="configuracoes.servidor-section.callout--2" tone="danger" icon={<AlertTriangle data-gc="configuracoes.servidor-section.alert-triangle" size={16} />} title="O agente de métricas da máquina não respondeu">
                As chamadas não caíram por isso: quem as segura é o LiveKit, que aparece em Serviços.
              </Callout>
            </Panel>
          ) : (
            data.voice && (
              <Machine data-gc="configuracoes.servidor-section.machine--2"
                box={{
                  title: "Voz",
                  host: data.voice.host,
                  legenda: `LiveKit ${data.voice.livekit.inAr ? "no ar" : "parado"} · ${data.voice.ms} ms daqui · ligada há ${duration(data.voice.machineUptime)}`,
                  carga: data.voice.carga,
                  cores: data.voice.cores,
                  memoria: data.voice.memoria,
                  disk: data.voice.disk,
                  resident: { label: "LiveKit", bytes: data.voice.livekit.resident },
                }}
              />
            )
          )}
        </div>
      </section>

      <Panel data-gc="configuracoes.servidor-section.panel--2"
        title="Chamadas agora"
        icon={<Radio data-gc="configuracoes.servidor-section.radio--3" size={16} />}
        description={
          data.sfu.unavailable
            ? "o SFU não respondeu"
            : `${data.sfu.participants} ${data.sfu.participants === 1 ? "pessoa" : "pessoas"} · ${data.sfu.publishing} com microfone aberto`
        }
      >
        {data.sfu.unavailable ? (
          <p data-gc="configuracoes.servidor-section.p" className="text-sm text-danger">O SFU não respondeu.</p>
        ) : rooms.length === 0 ? (
          <EmptyState data-gc="configuracoes.servidor-section.empty-state" icon={<Radio data-gc="configuracoes.servidor-section.radio--4" size={22} />} title="Ninguém em voz" detail="Quando alguém entrar numa chamada, a sala aparece aqui com quem está dentro." className="py-8" />
        ) : (
          <div data-gc="configuracoes.servidor-section.div--6" className="grid gap-3 lg:grid-cols-2">
            {rooms.map((room) => (
              <div data-gc="configuracoes.servidor-section.div--7" key={room.channelId} className="rounded-lg border border-line-sutil bg-surface-2 p-3">
                <div data-gc="configuracoes.servidor-section.div--8" className="flex items-center justify-between gap-2 text-sm">
                  <span data-gc="configuracoes.servidor-section.span--3" className="flex min-w-0 items-center gap-1.5">
                    {room.isPrivate ? (
                      <Lock data-gc="configuracoes.servidor-section.lock" size={12} className="shrink-0 text-ink-muted" />
                    ) : (
                      <Hash data-gc="configuracoes.servidor-section.hash" size={12} className="shrink-0 text-ink-muted" />
                    )}

                    {room.name ? (
                      <span data-gc="configuracoes.servidor-section.span--4" className="truncate font-medium">{room.name}</span>
                    ) : (
                      <Notice data-gc="configuracoes.servidor-section.notice" reason={room.reason ?? "canal-apagado"} />
                    )}

                    {room.server && <span data-gc="configuracoes.servidor-section.span--5" className="truncate text-xs text-ink-muted">· {room.server}</span>}

                    <Identifier data-gc="configuracoes.servidor-section.identifier" id={room.channelId} oQueE="canal" />
                  </span>

                  <span data-gc="configuracoes.servidor-section.span--6" className="shrink-0 text-xs text-ink-faint">
                    há {duration(Math.max(0, Math.round(Date.now() / 1000 - room.createdAt)))}
                  </span>
                </div>

                {room.participants.length === 0 ? (
                  <p data-gc="configuracoes.servidor-section.p--2" className="mt-2 text-xs text-ink-faint">Sala aberta, sem ninguém dentro — o SFU ainda vai fechá-la.</p>
                ) : (
                  <div data-gc="configuracoes.servidor-section.div--9" className="mt-2 space-y-1.5">
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
          <div data-gc="configuracoes.servidor-section.div--10" className="mt-3 rounded-lg border border-aviso/30 bg-aviso/5 p-3">
            <p data-gc="configuracoes.servidor-section.p--3" className="flex items-center gap-2 text-xs font-medium text-aviso">
              <Ghost data-gc="configuracoes.servidor-section.ghost" size={14} />
              {data.sfu.ghosts.length === 1
                ? "1 pessoa que o app acha que está em chamada"
                : `${data.sfu.ghosts.length} pessoas que o app acha que estão em chamada`}
              , mas o SFU não vê
            </p>

            <div data-gc="configuracoes.servidor-section.div--11" className="mt-2 space-y-1">
              {data.sfu.ghosts.map((f) => (
                <GhostRow data-gc="configuracoes.servidor-section.ghost-row" key={f.id} ghost={f} />
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};

const ServiceTile: React.FC<{ icon: React.ReactNode; label: string; hint: string; check: CheckService }> = ({
  icon,
  label,
  hint,
  check,
}) => {
  const up = check.state === "up";
  const slow = up && check.ms > 300;
  const tone = up ? (slow ? "warn" : "ok") : "danger";

  return (
    <StatTile data-gc="configuracoes.servidor-section.stat-tile--4"
      icon={icon}
      label={label}
      value={up ? `${check.ms} ms` : "—"}
      detail={up ? `tempo de resposta · ${hint}` : `sem resposta · ${hint}`}
      badge={<StatusPill data-gc="configuracoes.servidor-section.status-pill--6" tone={tone}>{up ? (slow ? "lento" : "no ar") : "fora"}</StatusPill>}
    />
  );
};

const Person: React.FC<{ person: RoomParticipant }> = ({ person }) => (
  <div data-gc="configuracoes.servidor-section.div--12" className="flex items-center gap-2">
    <Avatar data-gc="configuracoes.servidor-section.avatar"
      id={person.id}
      name={person.name}
      url={person.avatarUrl}
      size={24}
    />

    <span data-gc="configuracoes.servidor-section.span--7" className="min-w-0 flex-1 truncate text-sm">{person.name}</span>

    <Identifier data-gc="configuracoes.servidor-section.identifier--2" id={person.id} oQueE="usuário" />

    {person.soNoSfu && (
      <span data-gc="configuracoes.servidor-section.span--8"
        className="shrink-0 rounded bg-aviso/15 px-1.5 text-xs text-aviso"
        title="Está no SFU, mas o app não tem estado de voz desta pessoa"
      >
        só no SFU
      </span>
    )}

    <span data-gc="configuracoes.servidor-section.span--9" className="flex shrink-0 items-center gap-2 text-ink-faint">
      {person.camera && <Video data-gc="configuracoes.servidor-section.video" size={14} className="text-ink-muted" />}
      {person.display && <MonitorUp data-gc="configuracoes.servidor-section.monitor-up" size={14} className="text-ink-muted" />}

      {person.microphone === "aberto" ? (
        <Mic data-gc="configuracoes.servidor-section.mic" size={14} className="text-online" />
      ) : person.microphone === "mudo" ? (
        <MicOff data-gc="configuracoes.servidor-section.mic-off" size={14} className="text-ink-muted" />
      ) : (
        <span data-gc="configuracoes.servidor-section.span--10" title="não publicou microfone">
          <MicOff data-gc="configuracoes.servidor-section.mic-off--2" size={14} className="text-danger" />
        </span>
      )}

      <span data-gc="configuracoes.servidor-section.span--11" className="w-12 text-right text-xs tabular-nums">
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
    <span data-gc="configuracoes.servidor-section.span--12" className="cursor-help truncate font-medium italic text-aviso">
      {NOTICES[reason].label}
    </span>
  </Tooltip>
);

const GhostRow: React.FC<{ ghost: VoiceGhost }> = ({ ghost }) => (
  <div data-gc="configuracoes.servidor-section.div--13" className="flex items-center gap-2 text-xs">
    <span data-gc="configuracoes.servidor-section.span--13" className="min-w-0 flex-1 truncate text-ink">
      {ghost.name}
      <span data-gc="configuracoes.servidor-section.span--14" className="text-ink-muted">
        {" em "}
        {ghost.channel ?? <span data-gc="configuracoes.servidor-section.span--15" className="italic">canal apagado</span>}
      </span>
    </span>

    <Identifier data-gc="configuracoes.servidor-section.identifier--3" id={ghost.id} oQueE="usuário" />

    {ghost.awaitingBack && (
      <span data-gc="configuracoes.servidor-section.span--16"
        className="shrink-0 text-ink-faint"
        title="Caiu e está na janela de reconexão"
      >
        reconectando
      </span>
    )}

    <span data-gc="configuracoes.servidor-section.span--17" className="shrink-0 tabular-nums text-ink-faint">
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
}

const Machine: React.FC<{ box: Box }> = ({ box }) => {
  const occupancy = Math.min(box.carga.um / box.cores, 1);
  const used = box.memoria.total - box.memoria.available;
  const diskUsed = box.disk ? box.disk.total - box.disk.livre : 0;

  return (
    <Panel data-gc="configuracoes.servidor-section.panel--3"
      title={box.title}
      icon={box.title === "API" ? <Server data-gc="configuracoes.servidor-section.server--2" size={16} /> : <Radio data-gc="configuracoes.servidor-section.radio--5" size={16} />}
      description={
        <>
          <code data-gc="configuracoes.servidor-section.code">{box.host}</code> · {box.legenda}
        </>
      }
    >
      <div data-gc="configuracoes.servidor-section.div--14" className="grid gap-3 sm:grid-cols-3">
        <StatTile inset data-gc="configuracoes.servidor-section.stat-tile--5"
          icon={<Cpu data-gc="configuracoes.servidor-section.cpu--2" size={15} />}
          label="CPU"
          value={`${Math.round(occupancy * 100)}%`}
          ratio={occupancy}
          detail={`carga ${box.carga.um.toFixed(2)} · ${box.carga.five.toFixed(2)} · ${box.carga.quinze.toFixed(2)} em ${box.cores} threads`}
        />
        <StatTile inset data-gc="configuracoes.servidor-section.stat-tile--6"
          icon={<MemoryStick data-gc="configuracoes.servidor-section.memory-stick" size={15} />}
          label="Memória"
          value={size(used)}
          ratio={used / box.memoria.total}
          detail={`de ${size(box.memoria.total)} · ${size(box.memoria.available)} livres · ${box.resident.label} ${size(box.resident.bytes)}`}
        />
        {box.disk ? (
          <StatTile inset data-gc="configuracoes.servidor-section.stat-tile--7"
            icon={<HardDrive data-gc="configuracoes.servidor-section.hard-drive" size={15} />}
            label="Disco"
            value={size(diskUsed)}
            ratio={diskUsed / box.disk.total}
            detail={`de ${size(box.disk.total)} · ${size(box.disk.livre)} livres`}
          />
        ) : (
          <StatTile inset data-gc="configuracoes.servidor-section.stat-tile--8" icon={<HardDrive data-gc="configuracoes.servidor-section.hard-drive--2" size={15} />} label="Disco" value="—" detail="não deu pra medir aqui" />
        )}
      </div>
    </Panel>
  );
};
