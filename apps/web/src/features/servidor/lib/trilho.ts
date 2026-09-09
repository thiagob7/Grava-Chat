export const ICONES_DE_PASTA = ["pasta", "estrela", "coracao", "salvar", "jogo", "escudo", "nota"] as const;
export type IconeDaPasta = (typeof ICONES_DE_PASTA)[number];

export interface Pasta {
  id: string;
  nome: string;
  cor: string | null;
  guildIds: string[];
  aberta: boolean;
  icone?: IconeDaPasta;
  mostrarIconeMinimizado?: boolean;
}

export interface Arrumacao {
  ordem: string[];
  pastas: Pasta[];
}

export type ItemDoTrilho<G> =
  | { tipo: "servidor"; guild: G }
  | { tipo: "pasta"; pasta: Pasta; guilds: G[] };

const marca = (pastaId: string) => `pasta:${pastaId}`;

export function montarTrilho<G extends { id: string }>(
  guilds: G[],
  arrumacao: Arrumacao,
): ItemDoTrilho<G>[] {
  const porId = new Map(guilds.map((g) => [g.id, g]));
  const usados = new Set<string>();
  const itens: ItemDoTrilho<G>[] = [];

  for (const entrada of arrumacao.ordem) {
    if (entrada.startsWith("pasta:")) {
      const pasta = arrumacao.pastas.find((p) => marca(p.id) === entrada);
      if (!pasta) continue;

      const dentro = pasta.guildIds.map((id) => porId.get(id)).filter((g): g is G => Boolean(g));
      dentro.forEach((g) => usados.add(g.id));
      if (dentro.length) itens.push({ tipo: "pasta", pasta, guilds: dentro });
      continue;
    }

    const guild = porId.get(entrada);
    if (guild && !usados.has(guild.id)) {
      usados.add(guild.id);
      itens.push({ tipo: "servidor", guild });
    }
  }

  for (const guild of guilds) {
    if (!usados.has(guild.id)) itens.push({ tipo: "servidor", guild });
  }

  return itens;
}

function completar(guildIds: string[], a: Arrumacao): Arrumacao {
  const nasPastas = new Set(a.pastas.flatMap((p) => p.guildIds));
  const naOrdem = new Set(a.ordem);
  const ordem = [
    ...a.ordem.filter((e) => e.startsWith("pasta:") ? a.pastas.some((p) => marca(p.id) === e) : guildIds.includes(e) && !nasPastas.has(e)),
    ...guildIds.filter((id) => !naOrdem.has(id) && !nasPastas.has(id)),
  ];

  return { ordem, pastas: a.pastas.map((p) => ({ ...p, guildIds: p.guildIds.filter((id) => guildIds.includes(id)) })).filter((p) => p.guildIds.length) };
}

function semServidor(a: Arrumacao, guildId: string): Arrumacao {
  return {
    ordem: a.ordem.filter((e) => e !== guildId),
    pastas: a.pastas
      .map((p) => ({ ...p, guildIds: p.guildIds.filter((id) => id !== guildId) }))
      .filter((p) => p.guildIds.length),
  };
}

function desfazerPastasDeUm(a: Arrumacao): Arrumacao {
  const sozinhas = a.pastas.filter((p) => p.guildIds.length === 1);
  if (!sozinhas.length) return a;

  return {
    ordem: a.ordem.map((e) => sozinhas.find((p) => marca(p.id) === e)?.guildIds[0] ?? e),
    pastas: a.pastas.filter((p) => p.guildIds.length > 1),
  };
}

export type Destino =
  | { tipo: "antes"; de: string }
  | { tipo: "depois"; de: string }
  | { tipo: "juntar"; com: string }
  | { tipo: "pasta"; pastaId: string }
  | { tipo: "fim" };

let contador = 0;
const novoId = () => `${Date.now().toString(36)}${(contador++).toString(36)}`;

export function moverServidor(guildIds: string[], atual: Arrumacao, guildId: string, destino: Destino): Arrumacao {
  const base = semServidor(completar(guildIds, atual), guildId);

  if (destino.tipo === "fim") return desfazerPastasDeUm({ ...base, ordem: [...base.ordem, guildId] });

  if (destino.tipo === "pasta") {
    return desfazerPastasDeUm({
      ...base,
      pastas: base.pastas.map((p) => (p.id === destino.pastaId ? { ...p, guildIds: [...p.guildIds, guildId] } : p)),
    });
  }

  if (destino.tipo === "juntar") {
    if (destino.com === guildId) return atual;
    const pasta: Pasta = { id: novoId(), nome: "", cor: null, guildIds: [destino.com, guildId], aberta: true, icone: "pasta" };
    const semOOutro = semServidor(base, destino.com);
    const onde = base.ordem.indexOf(destino.com);
    const ordem = [...semOOutro.ordem];
    ordem.splice(onde < 0 ? ordem.length : onde, 0, marca(pasta.id));
    return desfazerPastasDeUm({ ordem, pastas: [...semOOutro.pastas, pasta] });
  }

  const alvo = destino.de;
  const ordem = [...base.ordem];
  const onde = ordem.indexOf(alvo);
  if (onde < 0) return desfazerPastasDeUm({ ...base, ordem: [...ordem, guildId] });

  ordem.splice(destino.tipo === "antes" ? onde : onde + 1, 0, guildId);
  return desfazerPastasDeUm({ ...base, ordem });
}

export function alternarPasta(a: Arrumacao, pastaId: string): Arrumacao {
  return { ...a, pastas: a.pastas.map((p) => (p.id === pastaId ? { ...p, aberta: !p.aberta } : p)) };
}

export function editarPasta(
  a: Arrumacao,
  pastaId: string,
  dados: Partial<Pick<Pasta, "nome" | "cor" | "icone" | "mostrarIconeMinimizado">>,
): Arrumacao {
  return { ...a, pastas: a.pastas.map((p) => (p.id === pastaId ? { ...p, ...dados } : p)) };
}

export function desfazerPasta(a: Arrumacao, pastaId: string): Arrumacao {
  const pasta = a.pastas.find((p) => p.id === pastaId);
  if (!pasta) return a;

  return {
    ordem: a.ordem.flatMap((e) => (e === marca(pastaId) ? pasta.guildIds : [e])),
    pastas: a.pastas.filter((p) => p.id !== pastaId),
  };
}
