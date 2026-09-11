import { api } from "~/@core/lib/api";

export interface RoomParticipant {
  id: string;
  name: string;
  avatarUrl: string | null;
  microphone: "aberto" | "mudo" | "sem";
  camera: boolean;
  display: boolean;
  joinedAt: number;
  soNoSfu: boolean;
}

export interface VoiceGhost {
  id: string;
  name: string;
  channel: string | null;
  since: number;
  awaitingBack: boolean;
}

export interface VoiceRoom {
  channelId: string;
  name: string | null;
  server: string | null;
  isPrivate: boolean;
  reason: "canal-apagado" | "outro-ambiente" | null;
  createdAt: number;
  participants: RoomParticipant[];
}

export interface CheckService {
  name: string;
  state: "up" | "down";
  ms: number;
}

export interface VoiceMachine {
  unavailable?: false;
  host: string;
  cores: number;
  carga: { um: number; five: number; quinze: number };
  memoria: { total: number; livre: number; available: number };
  disk: { total: number; livre: number };
  machineUptime: number;
  livekit: { inAr: boolean; resident: number };
  ms: number;
}

export interface ServerStatus {
  api: {
    host: string;
    environment: string;
    carga: { um: number; five: number; quinze: number };
    cores: number;
    memoria: { total: number; livre: number; available: number };
    resident: number;
    disk: { total: number; livre: number } | null;
    processUptime: number;
    machineUptime: number;
    node: string;
  };
  gateway: { connections: number; people: number; bots: number } | null;
  voice: VoiceMachine | { unavailable: true } | null;
  mongo: CheckService;
  redis: CheckService;
  sfu: {
    unavailable?: true;
    rooms: VoiceRoom[];
    participants: number;
    publishing: number;
    ghosts: VoiceGhost[];
  };
}

export async function findStatus(): Promise<ServerStatus> {
  const response = await api.get<ServerStatus>("/status");
  return response.data;
}
