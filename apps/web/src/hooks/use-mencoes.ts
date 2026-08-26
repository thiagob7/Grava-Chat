import { useCallback, useMemo } from "react";
import type { Role } from "@gravae/shared";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";

export interface Mencionavel {
  texto: string;
  id: string;
  tipo: "usuario" | "cargo" | "todos";
  nome: string;
  detalhe?: string;
  avatarUrl?: string | null;
  cor?: string | null;
}

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

      return lista.filter(casa).slice(0, 10);
    },
    [lista],
  );

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

export function detectarMencao(texto: string, cursor: number) {
  const casamento = /(^|\s)@([^\s@]*)$/.exec(texto.slice(0, cursor));
  if (!casamento) return null;

  const termo = casamento[2] ?? "";
  return { termo, inicio: cursor - termo.length - 1 };
}
