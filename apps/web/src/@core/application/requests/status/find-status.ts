import { api } from "~/@core/lib/api";

export interface SalaDeVoz {
  nome: string;
  participantes: number;
  publicando: number;
  criadaEm: number;
}

export interface StatusDoServidor {
  api: {
    host: string;
    ambiente: string;
    carga: { um: number; cinco: number; quinze: number };
    nucleos: number;
    memoria: { total: number; livre: number };
    uptimeDoProcesso: number;
    uptimeDaMaquina: number;
  };
  mongo: "up" | "down";
  redis: "up" | "down";
  sfu: { indisponivel?: true; salas: SalaDeVoz[]; participantes: number };
}

export async function findStatus(): Promise<StatusDoServidor> {
  const response = await api.get<StatusDoServidor>("/status");
  return response.data;
}
