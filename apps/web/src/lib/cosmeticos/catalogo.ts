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
  descricao?: string;
}

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

export const PATENTES_DE_PERFIL: Opcao<Patente>[] = catalogar(PATENTES, {
  nenhuma: "Nenhuma",
  orbe: ["Orbe alado", "monta uma vez quando o cartão abre"],
});

export const ESTILOS_DO_CARGO: Opcao<EstiloDeCargo>[] = catalogar(ESTILOS_DE_CARGO, {
  solido: ["Sólido", "uma cor só"],
  gradiente: ["Gradiente", "usa a segunda cor"],
  holografico: "Holográfico",
});

export const VAZIOS = new Set<string>(["nenhum", "nenhuma", "solido", "padrao"]);
