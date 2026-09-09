import { LUGARES } from "~/lib/compat-de-tema";

export interface Compatibilidade {
  achados: string[];
  faltando: string[];
}

const nomesQueTemos = () => {
  const todos = new Set<string>();

  for (const lugar of Object.values(LUGARES)) {
    for (const classe of lugar.classes as readonly string[]) todos.add(classe);
    if ("flx" in lugar) todos.add(lugar.flx);
  }

  return todos;
};

export function conferirCompatibilidade(css: string): Compatibilidade {
  const nossos = nomesQueTemos();

  const pedidos = new Set<string>();

  for (const achado of css.matchAll(/\[class\*=["']([^"']+)["']\]/g)) {
    if (achado[1]) pedidos.add(achado[1]);
  }

  for (const achado of css.matchAll(/\[data-flx=["']([^"']+)["']\]/g)) {
    if (achado[1]) pedidos.add(achado[1]);
  }

  const achados: string[] = [];
  const faltando: string[] = [];

  for (const pedido of [...pedidos].sort()) {
    const temos = [...nossos].some((nosso) => nosso.includes(pedido));

    (temos ? achados : faltando).push(pedido);
  }

  return { achados, faltando };
}
