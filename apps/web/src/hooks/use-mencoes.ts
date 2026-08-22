import { useCallback, useMemo } from "react";
import type { Role } from "@gravae/shared";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";

export interface Mencionavel {
  /** `<@id>` pra pessoa, `<@&id>` pra cargo, `@everyone` pro servidor */
  texto: string;
  id: string;
  tipo: "usuario" | "cargo" | "todos";
  nome: string;
  /** o `@username`, só pra pessoa: é o que desempata dois "Leo" */
  detalhe?: string;
  avatarUrl?: string | null;
  cor?: string | null;
}

/**
 * Quem dá pra mencionar neste servidor, e como transformar id em nome.
 *
 * Sai do cache do detalhe do servidor — o mesmo que a lista de membros usa —
 * então nem o autocomplete nem o desenho da mensagem custam requisição.
 *
 * Numa DM (`guildId` indefinido) devolve lista vazia: não há cargo nem
 * `@everyone` pra mencionar, e a outra pessoa já está lendo a conversa.
 */
export function useMencoes(
  guildId: string | undefined,
  podeMencionarTodos = false,
  currentUserId?: string,
) {
  const { data: detail } = useFindGuild(guildId);

  const lista = useMemo<Mencionavel[]>(() => {
    if (!detail) return [];

    const pessoas: Mencionavel[] = detail.members.map((m) => ({
      texto: `<@${m.user.id}>`,
      id: m.user.id,
      tipo: "usuario",
      nome: m.nickname ?? m.user.displayName,
      detalhe: m.user.username,
      avatarUrl: m.user.avatarUrl,
    }));

    /**
     * O cargo só entra na lista se for mencionável — ou se você pode
     * `MENTION_EVERYONE`. É a mesma regra que o servidor aplica ao gravar;
     * oferecer aqui o que lá será descartado seria prometer um ping que não
     * acontece.
     */
    const cargos: Mencionavel[] = detail.roles
      .filter((r) => !r.isEveryone && (podeMencionarTodos || r.mentionable))
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        texto: `<@&${r.id}>`,
        id: r.id,
        tipo: "cargo",
        nome: r.name,
        cor: r.color,
      }));

    const todos: Mencionavel[] = podeMencionarTodos
      ? [
          { texto: "@everyone", id: "everyone", tipo: "todos", nome: "everyone", detalhe: "Notifica todo mundo do servidor" },
          { texto: "@here", id: "here", tipo: "todos", nome: "here", detalhe: "Notifica só quem está online" },
        ]
      : [];

    return [...todos, ...cargos, ...pessoas];
  }, [detail, podeMencionarTodos]);

  /** Mapa de id → nome, para o texto da mensagem virar `@Fulano`. */
  const nomes = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const m of detail?.members ?? []) mapa.set(m.user.id, m.nickname ?? m.user.displayName);

    return mapa;
  }, [detail]);

  const cargos = useMemo(() => {
    const mapa = new Map<string, Role>();
    for (const r of detail?.roles ?? []) mapa.set(r.id, r);

    return mapa;
  }, [detail]);

  const filtrar = useCallback(
    (termo: string) => {
      const alvo = termo.toLowerCase().trim();
      const casa = (m: Mencionavel) =>
        !alvo || m.nome.toLowerCase().includes(alvo) || (m.detalhe ?? "").toLowerCase().includes(alvo);

      // dez cabe na tela sem virar rolagem dentro de uma lista flutuante
      return lista.filter(casa).slice(0, 10);
    },
    [lista],
  );

  /**
   * Esta mensagem é pra mim?
   *
   * A expansão cargo → pessoas acontece AQUI, na leitura, e nunca na escrita:
   * congelada no envio, quem entrasse no cargo depois seria ignorado e quem
   * saísse continuaria sendo pingado pra sempre.
   *
   * A própria mensagem nunca conta. Quem escreve `@everyone` sabe que escreveu;
   * destacar a própria linha só treinaria o olho a ignorar o destaque.
   */
  const meusCargos = useMemo(() => {
    const eu = detail?.members.find((m) => m.user.id === currentUserId);
    return new Set(eu?.roleIds ?? []);
  }, [detail, currentUserId]);

  const mencionaVoce = useCallback(
    (m: {
      author: { id: string };
      mentions: string[];
      mentionRoleIds: string[];
      mentionEveryone: boolean;
    }) => {
      if (!currentUserId || m.author.id === currentUserId) return false;
      if (m.mentionEveryone) return true;
      if (m.mentions.includes(currentUserId)) return true;

      return m.mentionRoleIds.some((id) => meusCargos.has(id));
    },
    [currentUserId, meusCargos],
  );

  return { filtrar, nomes, cargos, mencionaVoce };
}

export type ResolverMencoes = Pick<ReturnType<typeof useMencoes>, "nomes" | "cargos">;

/**
 * O `@` que está sendo digitado agora, se houver.
 *
 * Só vale `@` no começo do texto ou depois de um espaço: sem isso, um e-mail
 * digitado no meio da frase abriria a lista de membros. E o termo não aceita
 * espaço, o que fecha a lista sozinho quando a pessoa segue escrevendo a frase.
 */
export function detectarMencao(texto: string, cursor: number) {
  const casamento = /(^|\s)@([^\s@]*)$/.exec(texto.slice(0, cursor));
  if (!casamento) return null;

  const termo = casamento[2] ?? "";
  return { termo, inicio: cursor - termo.length - 1 };
}
