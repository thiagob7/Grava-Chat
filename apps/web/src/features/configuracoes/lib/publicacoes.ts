export interface VersaoDaApi {
  commit: string | null;
  branch: string | null;
  construidoEm: string | null;
  desdeSegundos: number | null;
}

export interface Ambiente {
  id: "producao" | "staging";
  nome: string;
  api: string;
  front: string;
  branch: string;
}

export const AMBIENTES: Ambiente[] = [
  {
    id: "producao",
    nome: "Produção",
    api: "https://gravaechat-api.duckdns.org",
    front: "https://gravae-chat.vercel.app",
    branch: "master",
  },
  {
    id: "staging",
    nome: "Staging",
    api: "https://gravaechat-api-staging.duckdns.org",
    front: "https://gravae-chat-staging.vercel.app",
    branch: "staging",
  },
];

export const REPOSITORIO = "thiagob7/Grava-Chat";
export const FLUXO_DA_API = "api.yml";

export interface Publicacao {
  id: number;
  titulo: string;
  commit: string;
  situacao: "esperando" | "rodando" | "boa" | "falhou" | "cancelada";
  quando: string;
  link: string;
}

const SITUACAO: Record<string, Publicacao["situacao"]> = {
  waiting: "esperando",
  queued: "rodando",
  requested: "rodando",
  pending: "rodando",
  in_progress: "rodando",
};

export function lerSituacao(status: string, conclusao: string | null): Publicacao["situacao"] {
  if (status !== "completed") return SITUACAO[status] ?? "rodando";
  if (conclusao === "success") return "boa";

  return conclusao === "cancelled" ? "cancelada" : "falhou";
}

export const ESPERANDO_APROVACAO = (p: Publicacao) => p.situacao === "esperando";

export function escreverDesde(segundos: number | null): string {
  if (segundos === null) return "—";

  const dias = Math.floor(segundos / 86_400);
  if (dias >= 1) return `${dias}d`;

  const horas = Math.floor(segundos / 3600);
  if (horas >= 1) return `${horas}h`;

  return `${Math.max(1, Math.floor(segundos / 60))}min`;
}

export function atraso(daApi: string | null, doGit: string | null): "igual" | "atras" | "desconhecido" {
  if (!daApi || !doGit) return "desconhecido";

  return doGit.startsWith(daApi) || daApi.startsWith(doGit) ? "igual" : "atras";
}
