/*
  O que fazer quando ligar o microfone dá errado.

  Antes daqui, qualquer falha caía no mesmo lugar: `micBlocked: true`. O aviso
  vermelho de "microfone bloqueado" aparecia tanto para quem negou a permissão
  quanto para quem só perdeu a rede por dois segundos — e no segundo caso ele
  mentia, porque não havia nada para a pessoa consertar.

  O pior caso não é o aviso errado, é o silêncio: falhar ao publicar o microfone
  e seguir na chamada com cara de quem está transmitindo. A pessoa fala, ninguém
  ouve, e ela só descobre quando alguém avisa.

  Então a falha é lida antes de virar estado. São quatro reações, e a diferença
  entre elas é o que a pessoa precisa fazer:

  - `mutar`     precisa de ação dela: permissão, aparelho ocupado, sem aparelho
  - `adiar`     não precisa de nada: passageiro, volta quando a conexão voltar
  - `estourar`  bug nosso, e é para aparecer no console em vez de virar aviso
  - `ignorar`   não há falha
*/

export type ReacaoAFalhaDeMicrofone = "ignorar" | "adiar" | "mutar" | "estourar";

export interface ContextoDaFalhaDeMicrofone {
  /// A sala está no meio de uma reconexão do LiveKit?
  reconectando: boolean;
}

/*
  Nomes que o navegador dá quando o problema é do lado de cá e só a pessoa
  resolve. `NotReadableError` é o caso chato: o aparelho existe e a permissão
  está dada, mas outro programa está segurando o microfone.
*/
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

/// Falhas que somem sozinhas: a sala ainda não subiu, ou caiu no meio.
const PASSAGEIRAS = new Set([
  "AbortError",
  "InvalidStateError",
  "UnexpectedConnectionState",
  "ConnectionError",
  "PublishTrackError",
]);

/*
  Argumento errado é bug nosso. Vale mais aparecer no console do que virar aviso
  vermelho para a pessoa, que não tem o que fazer com essa informação.
*/
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

  /*
    Bug nosso vence o resto, inclusive a reconexão: se o argumento está errado,
    ele vai continuar errado quando a rede voltar.
  */
  if (ERRO_DE_PROGRAMACAO.has(nome)) return "estourar";

  /*
    Permissão e aparelho vencem a reconexão pela razão oposta: são verdade
    independente da rede, e esconder isso durante uma queda só adia a descoberta.
  */
  if (PEDEM_ACAO_DA_PESSOA.has(nome)) return "mutar";

  if (PASSAGEIRAS.has(nome)) return "adiar";

  if (SEM_CONEXAO.test(mensagemDoErro(erro))) return "adiar";

  /*
    Sobrou o que não reconhecemos. No meio de uma reconexão o palpite mais
    provável é que a falha veio da queda, então adia em vez de acusar a pessoa.
    Fora dela, mutar é o lado seguro: é melhor mostrar um aviso a mais do que
    deixar alguém falando sozinha achando que está sendo ouvida.
  */
  return contexto.reconectando ? "adiar" : "mutar";
}
