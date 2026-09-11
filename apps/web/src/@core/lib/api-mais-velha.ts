/*
  O corpo como ele PODE chegar, não como queremos que chegue.

  O web sobe sozinho quando um merge entra na master; a API sobe na mão, por
  script. Os dois nunca estão em passo, e na janela entre um e outro o web
  recebe o corpo antigo.

  Em 11/09/2026 o código do repositório passou a ser escrito em inglês, e os
  nomes dos campos foram junto. O web novo pediu `channel.people`, a API velha
  respondeu `pessoas`, e a soma de quem está em chamada derrubou a tela inteira
  com um `.length` de undefined — logo no trilho, que aparece em toda página.

  Aqui é o único ponto por onde todo corpo passa, então é aqui que o nome
  antigo vira o novo. Quando a API estiver publicada, nada disto casa e a
  função sai de graça. Não custa apagar depois, mas também não custa manter.
*/
const ANTIGOS: Record<string, string> = {
  aceitaPedidos: "acceptedRequests",
  cliente: "client",
  clienteId: "clientId",
  comandos: "commands",
  conexoes: "connections",
  criadoEm: "createdAt",
  decoracao: "decoration",
  descricao: "description",
  detectavel: "detectable",
  duracaoHoras: "durationHours",
  duracaoMs: "durationMs",
  efeito: "effect",
  emblemas: "badges",
  estilo: "style",
  etiqueta: "tag",
  excluirEm: "deleteAt",
  expiraEm: "expiresAt",
  filtroDeSpam: "spamFilter",
  fonte: "font",
  mencionarAutor: "mentionAuthor",
  moldura: "frame",
  mostraAmigosEmComum: "showsFriendsCommon",
  mostraAtividade: "showsActivity",
  mostraServidoresEmComum: "showsServersCommon",
  nome: "name",
  obrigatoria: "required",
  ondas: "waves",
  opcoes: "options",
  patente: "rank",
  perfil: "profile",
  pergunta: "question",
  permitirDmDeMembros: "membersAllowDm",
  pessoas: "people",
  placa: "plate",
  previa: "preview",
  pronomes: "pronouns",
  servico: "service",
  servidoresEmComum: "serversCommon",
  sistema: "system",
  texto: "text",
  tipo: "kind",
  transmitindo: "broadcasting",
  usuario: "user",
  valor: "value",
  verificada: "verified",
};

/*
  Só o nome da chave muda. O valor segue intocado, inclusive quando é string:
  texto de mensagem, CSS de tema e nome de canal passam por aqui e saem iguais.
*/
export function comNomesNovos<T>(corpo: T): T {
  if (Array.isArray(corpo)) return corpo.map(comNomesNovos) as T;

  if (!corpo || typeof corpo !== "object") return corpo;
  if (corpo instanceof Date || corpo instanceof Blob) return corpo;

  const saida: Record<string, unknown> = {};

  for (const [chave, valor] of Object.entries(corpo as Record<string, unknown>)) {
    const novo = ANTIGOS[chave];
    /* Se o corpo já veio novo, o antigo não sobrescreve o que chegou certo. */
    const destino = novo && !(novo in (corpo as Record<string, unknown>)) ? novo : chave;

    saida[destino] = comNomesNovos(valor);
  }

  return saida as T;
}
