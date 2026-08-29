/**
 * Os moldes oferecidos a quem acabou de criar a conta.
 *
 * Um molde é só um nome sugerido e uma lista de canais. Ele não desbloqueia
 * nada — quem escolhe "Criar o meu" chega no mesmo lugar depois de criar os
 * canais na mão. O que ele resolve é a página em branco: alguém que acabou de
 * chegar não sabe que canais fazem sentido, e um servidor com um `#geral`
 * solitário parece que deu errado.
 *
 * Todo servidor já nasce com `#geral` e um canal de voz pelo servidor (ver
 * `guildService.create`); estes são os canais A MAIS. Por isso nenhum molde
 * repete "geral" na lista.
 */
export interface MoldeDeServidor {
  id: string;
  nome: string;
  emoji: string;
  /// sugestão para o nome do servidor — quem cria pode trocar
  sugestaoDeNome: string;
  canais: { nome: string; tipo: "TEXT" | "VOICE" }[];
}

export const MOLDES: MoldeDeServidor[] = [
  {
    id: "jogos",
    nome: "Jogos",
    emoji: "🎮",
    sugestaoDeNome: "Squad",
    canais: [
      { nome: "combinar-jogo", tipo: "TEXT" },
      { nome: "clipes", tipo: "TEXT" },
      { nome: "Sala 2", tipo: "VOICE" },
    ],
  },
  {
    id: "amigos",
    nome: "Amigos",
    emoji: "💜",
    sugestaoDeNome: "A turma",
    canais: [
      { nome: "figurinhas", tipo: "TEXT" },
      { nome: "rolês", tipo: "TEXT" },
    ],
  },
  {
    id: "estudos",
    nome: "Grupo de estudos",
    emoji: "📚",
    sugestaoDeNome: "Grupo de estudos",
    canais: [
      { nome: "materiais", tipo: "TEXT" },
      { nome: "dúvidas", tipo: "TEXT" },
      { nome: "Sala de estudo", tipo: "VOICE" },
    ],
  },
  {
    id: "criadores",
    nome: "Artistas e criadores",
    emoji: "🎨",
    sugestaoDeNome: "Ateliê",
    canais: [
      { nome: "trabalhos", tipo: "TEXT" },
      { nome: "feedback", tipo: "TEXT" },
    ],
  },
];

/**
 * O código de um convite, seja ele colado como link ou digitado sozinho.
 *
 * Ninguém copia só o código: copia-se a URL inteira, e às vezes com um espaço
 * ou uma quebra de linha grudada. Exigir o código puro seria transformar um
 * "cola aqui" num pequeno exercício de edição de texto.
 */
export function codigoDoConvite(entrada: string): string | null {
  const limpo = entrada.trim();
  if (!limpo) return null;

  /// pega o último trecho depois de barra, cobrindo link completo e código solto
  const ultimo = limpo.split(/[/\\]/).filter(Boolean).pop() ?? "";

  /// tira query e âncora, que vêm junto quando o link foi copiado do navegador
  const codigo = ultimo.split(/[?#]/)[0]?.trim() ?? "";

  return codigo.length ? codigo : null;
}
