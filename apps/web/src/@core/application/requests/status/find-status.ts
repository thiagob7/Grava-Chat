import { api } from "~/@core/lib/api";

export interface ParticipanteDaSala {
  id: string;
  nome: string;
  avatarUrl: string | null;
  microfone: "aberto" | "mudo" | "sem";
  camera: boolean;
  tela: boolean;
  entrouEm: number;
  soNoSfu: boolean;
}

export interface FantasmaDeVoz {
  id: string;
  nome: string;
  canal: string | null;
  desde: number;
  aguardandoVolta: boolean;
}

export interface SalaDeVoz {
  canalId: string;
  nome: string | null;
  servidor: string | null;
  ehPrivado: boolean;
  motivo: "canal-apagado" | "outro-ambiente" | null;
  criadaEm: number;
  participantes: ParticipanteDaSala[];
}

export interface ChecagemDeServico {
  nome: string;
  estado: "up" | "down";
  ms: number;
}

export interface MaquinaDeVoz {
  indisponivel?: false;
  host: string;
  nucleos: number;
  carga: { um: number; cinco: number; quinze: number };
  memoria: { total: number; livre: number; disponivel: number };
  disco: { total: number; livre: number };
  uptimeDaMaquina: number;
  livekit: { noAr: boolean; residente: number };
  ms: number;
}

export interface StatusDoServidor {
  api: {
    host: string;
    ambiente: string;
    carga: { um: number; cinco: number; quinze: number };
    nucleos: number;
    memoria: { total: number; livre: number; disponivel: number };
    residente: number;
    disco: { total: number; livre: number } | null;
    uptimeDoProcesso: number;
    uptimeDaMaquina: number;
    node: string;
  };
  gateway: { conexoes: number; pessoas: number; bots: number } | null;
  voz: MaquinaDeVoz | { indisponivel: true } | null;
  mongo: ChecagemDeServico;
  redis: ChecagemDeServico;
  sfu: {
    indisponivel?: true;
    salas: SalaDeVoz[];
    participantes: number;
    publicando: number;
    fantasmas: FantasmaDeVoz[];
  };
}

export async function findStatus(): Promise<StatusDoServidor> {
  const response = await api.get<StatusDoServidor>("/status");
  return response.data;
}
