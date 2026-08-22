import { useCallback, useMemo } from "react";
import type { PerfilPublico } from "@gravae/shared";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";

export interface EnfeitesDaPessoa {
  /** o que ela escolheu; `null` para quem nunca mexeu — a maioria */
  perfil: PerfilPublico | null;
  /** cor do cargo mais alto que tem cor, já resolvida */
  corDoCargo: string | null;
}

const SEM_ENFEITE: EnfeitesDaPessoa = { perfil: null, corDoCargo: null };

/**
 * Resolve o enfeite de qualquer pessoa do servidor pelo id.
 *
 * Existe porque o dado chega em duas formas diferentes — `profiles` é um mapa
 * pronto, mas a cor do cargo precisa ser deduzida cruzando `members` com
 * `roles` — e porque quem renderiza um nome (a linha do chat, o item da lista)
 * não deve ter que saber disso. Sai do cache do React Query: o detalhe do
 * servidor já foi buscado quando a tela abriu, então isto não gera requisição
 * nenhuma.
 *
 * Sem `guildId` — uma DM — devolve sempre "sem enfeite" em vez de quebrar. Lá
 * quem tem o enfeite é o próprio cartão de perfil, que já o traz consigo.
 */
export function useEnfeites(guildId: string | undefined) {
  const { data: detail } = useFindGuild(guildId);

  /**
   * A cor de todo mundo de uma vez, e os cargos ordenados UMA vez.
   *
   * A versão anterior disto vivia dentro da `MemberList` e ordenava a lista de
   * cargos inteira por membro — cem membros, cem ordenações da mesma lista. Aqui
   * a ordenação acontece uma vez e cada pessoa só procura o primeiro que serve.
   */
  const cores = useMemo(() => {
    const mapa = new Map<string, string>();
    if (!detail) return mapa;

    const comCor = detail.roles.filter((r) => r.color).sort((a, b) => b.position - a.position);
    if (comCor.length === 0) return mapa;

    for (const m of detail.members) {
      const cargo = comCor.find((r) => m.roleIds.includes(r.id));
      if (cargo?.color) mapa.set(m.user.id, cargo.color);
    }

    return mapa;
  }, [detail]);

  /**
   * Os emblemas VESTIDOS por alguém, já resolvidos das definições do servidor.
   *
   * O mapa `profiles` guarda só os ids; as definições vêm uma vez em
   * `detail.emblemas`. Resolver aqui evita que cada tela que mostra um emblema
   * refaça o cruzamento — e faz um emblema apagado sumir sozinho, porque o id
   * simplesmente não encontra definição.
   */
  const emblemasDe = useCallback(
    (userId: string) => {
      const ids = detail?.profiles?.[userId]?.emblemas ?? [];
      if (!ids.length) return [];

      const porId = new Map((detail?.emblemas ?? []).map((e) => [e.id, e]));
      return ids.map((id) => porId.get(id)).filter((e) => e !== undefined);
    },
    [detail],
  );

  const resolver = useCallback(
    (userId: string): EnfeitesDaPessoa => {
      const perfil = detail?.profiles?.[userId] ?? null;
      const corDoCargo = cores.get(userId) ?? null;

      // devolver o MESMO objeto quando não há nada evita re-render em cascata
      // nas listas, que recebem isto como prop
      if (!perfil && !corDoCargo) return SEM_ENFEITE;

      return { perfil, corDoCargo };
    },
    [detail, cores],
  );

  return Object.assign(resolver, { emblemasDe });
}

export type ResolverEnfeites = ReturnType<typeof useEnfeites>;
