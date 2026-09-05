import { GRUPOS } from "~/dados/docs";
import referencia from "~/dados/referencia.json";

export type Achado = {
  titulo: string;
  contexto: string;
  href: string;
  tipo: "Página" | "Rota" | "Evento" | "Permissão" | "Limite";
};

const paginas: Achado[] = GRUPOS.flatMap((grupo) =>
  grupo.paginas.map((pagina) => ({
    titulo: pagina.titulo,
    contexto: pagina.resumo,
    href: pagina.href,
    tipo: "Página" as const,
  })),
);

const rotas: Achado[] = referencia.rest.map((rota) => ({
  titulo: `${rota.metodo} ${rota.caminho}`,
  contexto: rota.descricao,
  href: "/desenvolvedores/referencia",
  tipo: "Rota",
}));

const enviados: Achado[] = referencia.eventos.map((evento) => ({
  titulo: evento.nome,
  contexto: `Evento que o bot envia — ${
    evento.campos.map((campo) => campo.nome).join(", ") || "sem campos"
  }`,
  href: "/desenvolvedores/eventos#enviados",
  tipo: "Evento",
}));

const recebidos: Achado[] = referencia.recebidos.map((evento) => ({
  titulo: evento.nome,
  contexto: evento.descricao,
  href: "/desenvolvedores/eventos#recebidos",
  tipo: "Evento",
}));

const permissoes: Achado[] = referencia.permissoes.flatMap((grupo) =>
  grupo.itens.map((item) => ({
    titulo: item.nome,
    contexto: `${item.chave} — ${item.descricao}`,
    href: "/desenvolvedores/permissoes",
    tipo: "Permissão" as const,
  })),
);

const limites: Achado[] = referencia.limites.map((limite) => ({
  titulo: limite.rotulo,
  contexto: "Limite que o servidor aplica",
  href: "/desenvolvedores/limites",
  tipo: "Limite",
}));

export const INDICE: Achado[] = [
  ...paginas,
  ...rotas,
  ...enviados,
  ...recebidos,
  ...permissoes,
  ...limites,
];

const semAcento = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const buscar = (termo: string) => {
  const alvo = semAcento(termo.trim());

  if (!alvo) return [];

  return INDICE.map((achado) => {
    const titulo = semAcento(achado.titulo);
    const contexto = semAcento(achado.contexto);

    if (titulo.startsWith(alvo)) return { achado, peso: 0 };
    if (titulo.includes(alvo)) return { achado, peso: 1 };
    if (contexto.includes(alvo)) return { achado, peso: 2 };

    return null;
  })
    .filter((linha) => linha !== null)
    .sort((a, b) => a.peso - b.peso)
    .slice(0, 12)
    .map((linha) => linha.achado);
};
