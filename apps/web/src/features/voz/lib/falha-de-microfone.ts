export type ReacaoAFalhaDeMicrofone = "ignorar" | "adiar" | "mutar" | "estourar";

export interface ContextoDaFalhaDeMicrofone {
  reconectando: boolean;
}

const PEDEM_ACAO_DA_PESSOA = new Set([
  "NotAllowedError",
  "NotFoundError",
  "NotReadableError",
  "OverconstrainedError",
  "SecurityError",
  "PermissionDeniedError",
  "DevicesError",
  "DeviceUnsupportedError",
]);

const PASSAGEIRAS = new Set([
  "AbortError",
  "InvalidStateError",
  "UnexpectedConnectionState",
  "ConnectionError",
  "PublishTrackError",
]);

const ERRO_DE_PROGRAMACAO = new Set(["TypeError", "TrackInvalidError"]);

const SEM_CONEXAO = /not connected|disconnected|no connection|closed/i;

const nomeDoErro = (erro: unknown): string => {
  if (erro instanceof Error) return erro.name;
  if (typeof erro === "object" && erro !== null && "name" in erro) {
    const nome = (erro as { name: unknown }).name;
    return typeof nome === "string" ? nome : "";
  }
  return "";
};

const mensagemDoErro = (erro: unknown): string => {
  if (erro instanceof Error) return erro.message;
  if (typeof erro === "string") return erro;
  if (typeof erro === "object" && erro !== null && "message" in erro) {
    const mensagem = (erro as { message: unknown }).message;
    return typeof mensagem === "string" ? mensagem : "";
  }
  return "";
};

export function reacaoAFalhaDeMicrofone(
  erro: unknown,
  contexto: ContextoDaFalhaDeMicrofone = { reconectando: false },
): ReacaoAFalhaDeMicrofone {
  if (erro === null || erro === undefined) return "ignorar";

  const nome = nomeDoErro(erro);

  if (ERRO_DE_PROGRAMACAO.has(nome)) return "estourar";

  if (PEDEM_ACAO_DA_PESSOA.has(nome)) return "mutar";

  if (PASSAGEIRAS.has(nome)) return "adiar";

  if (SEM_CONEXAO.test(mensagemDoErro(erro))) return "adiar";

  return contexto.reconectando ? "adiar" : "mutar";
}
