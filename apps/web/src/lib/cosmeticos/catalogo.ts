/**
 * O catálogo, do lado de quem desenha a tela.
 *
 * O `packages/shared/src/cosmeticos.ts` tem os ids — o que o banco guarda e o
 * que o servidor aceita. Aqui ficam os **rótulos em português** e a ordem em que
 * as opções aparecem no editor. A separação importa: id é contrato (nunca muda,
 * está gravado em milhares de documentos), rótulo é texto de tela (muda quando
 * alguém achar um nome melhor).
 *
 * Cada lista é a fonte da grade de opções da Fase 2. Adicionar enfeite novo é
 * uma entrada aqui e mais uma coisa só: um bloco em `styles/cosmeticos.css` se
 * for CSS, ou uma entrada em `animadas.ts`/`patentes.ts` se for arte. Componente
 * nenhum precisa saber.
 */
import {
  DECORACOES,
  EFEITOS_DE_NOME,
  EFEITOS_DE_PERFIL,
  ESTILOS_DE_CARGO,
  FONTES_DE_NOME,
  MOLDURAS,
  PATENTES,
  PLACAS,
  type Decoracao,
  type EfeitoDeNome,
  type EfeitoDePerfil,
  type EstiloDeCargo,
  type FonteDeNome,
  type Moldura,
  type Patente,
  type Placa,
} from "@gravae/shared";

export interface Opcao<T extends string> {
  id: T;
  rotulo: string;
  /** uma frase curta pro editor; nem toda opção precisa */
  descricao?: string;
}

/**
 * Monta a lista na ORDEM DO ENUM, e o `tsc` cobra rótulo pra todo id.
 *
 * Sem isto, acrescentar um efeito no shared compila liso e o editor
 * simplesmente não mostra a opção nova — o tipo de erro que ninguém percebe
 * até alguém perguntar por que o item sumiu.
 */
function catalogar<T extends string>(
  ids: readonly T[],
  rotulos: Record<T, string | [string, string]>,
): Opcao<T>[] {
  return ids.map((id) => {
    const entrada = rotulos[id];
    const [rotulo, descricao] = Array.isArray(entrada) ? entrada : [entrada, undefined];

    return { id, rotulo, descricao };
  });
}

export const FONTES: Opcao<FonteDeNome>[] = catalogar(FONTES_DE_NOME, {
  padrao: ["Padrão", "a mesma fonte do resto do app"],
  serifada: "Serifada",
  monoespacada: "Monoespaçada",
  titulo: "Título",
  manuscrita: "Manuscrita",
});

export const EFEITOS_DO_NOME: Opcao<EfeitoDeNome>[] = catalogar(EFEITOS_DE_NOME, {
  solido: ["Nenhum", "cor chapada"],
  gradiente: ["Gradiente", "duas cores; some em texto pequeno"],
  neon: "Neon",
  brilho: ["Brilho", "um lampejo que atravessa o nome"],
});

export const DECORACOES_DE_AVATAR: Opcao<Decoracao>[] = catalogar(DECORACOES, {
  nenhuma: "Nenhuma",
  aurora: "Aurora",
  chamas: "Chamas",
  circuito: "Circuito",
  petalas: "Pétalas",
  orbita: "Órbita",
  aro: ["Aro dourado", "animada — arquivo Lottie, não CSS"],
  alada: ["Moldura alada", "animada — asas e estrela"],
  sol: ["Selo do sol", "animada — pontas e faíscas"],
  caveiras: ["Chamas infernais", "animada — fogo azul e cinco caveiras"],
});

export const MOLDURAS_DE_AVATAR: Opcao<Moldura>[] = catalogar(MOLDURAS, {
  nenhuma: "Nenhuma",
  neon: "Neon",
  dourada: "Dourada",
  vidro: "Vidro",
  pixel: "Pixel",
  espinhos: "Espinhos",
});

export const EFEITOS_DO_PERFIL: Opcao<EfeitoDePerfil>[] = catalogar(EFEITOS_DE_PERFIL, {
  nenhum: "Nenhum",
  poeira: "Poeira",
  chuva: "Chuva",
  brasas: "Brasas",
  bolhas: "Bolhas",
});

export const PLACAS_DE_PERFIL: Opcao<Placa>[] = catalogar(PLACAS, {
  nenhuma: "Nenhuma",
  fita: "Fita",
  holograma: "Holograma",
  carimbo: "Carimbo",
  cristal: "Cristal",
});

/**
 * As patentes. Ordem crescente de "quanto isso chama atenção" — `nenhuma`
 * primeiro, como no resto do catálogo.
 */
export const PATENTES_DE_PERFIL: Opcao<Patente>[] = catalogar(PATENTES, {
  nenhuma: "Nenhuma",
  orbe: ["Orbe alado", "monta uma vez quando o cartão abre"],
});

export const ESTILOS_DO_CARGO: Opcao<EstiloDeCargo>[] = catalogar(ESTILOS_DE_CARGO, {
  solido: ["Sólido", "uma cor só"],
  gradiente: ["Gradiente", "usa a segunda cor"],
  holografico: "Holográfico",
});

/**
 * Os ids que significam "sem enfeite".
 *
 * Existem no enum pra a grade do editor ter o que marcar como escolha vazia sem
 * um caso especial. Na renderização eles não viram classe nenhuma — é o que faz
 * a promessa da Fase 0 (com tudo `null`, a tela fica idêntica) se sustentar.
 */
export const VAZIOS = new Set<string>(["nenhum", "nenhuma", "solido", "padrao"]);
