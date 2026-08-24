import type {
  Decoracao,
  EfeitoDeNome,
  EfeitoDePerfil,
  EstiloDePerfil,
  FonteDeNome,
  Moldura,
  Patente,
  Placa,
} from "@gravae/shared";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { VAZIOS } from "~/lib/cosmeticos/catalogo";

/**
 * O rascunho é ACHATADO de propósito.
 *
 * `EstiloDePerfil` é aninhado (`perfil.nome.cor`), e `use-rascunho` compara
 * campo a campo com `Object.is`: um objeto aninhado nunca é igual a outro, e
 * então "mudou?" daria sempre `true` e o botão Descartar nunca apagaria. Aqui
 * cada coisa escolhível é um campo raso; a montagem do objeto acontece na
 * saída, em `paraPerfil`.
 */
export interface RascunhoDePerfil {
  displayName: string;
  /** o nome curto ao lado do @usuario; nao confundir com a etiqueta do servidor */
  etiqueta: string;
  /** de qual servidor eu visto a etiqueta; `null` = nenhuma */
  tagGuildId: string | null;
  bio: string;
  avatarUrl: string | null;

  /**
   * Os ids são os do enum do shared, não `string`. É o que garante que a grade
   * de opções e o CSS falem do mesmo conjunto fechado — com `string`, um id
   * inventado viraria classe CSS sem ninguém reclamar.
   */
  fonte: FonteDeNome;
  efeitoDoNome: EfeitoDeNome;
  cor: string | null;
  cor2: string | null;

  patente: Patente;
  decoracao: Decoracao;
  moldura: Moldura;
  efeitoDoPerfil: EfeitoDePerfil;
  placa: Placa;

  bannerUrl: string | null;
  bannerCor: string | null;
  temaPrimario: string | null;
  temaSecundario: string | null;
}

export function doUsuario(user: SelfUserModel): RascunhoDePerfil {
  const p = user.perfil;

  return {
    displayName: user.displayName,
    etiqueta: p?.etiqueta ?? "",
    tagGuildId: p?.tagGuildId ?? null,
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl,

    fonte: p?.nome?.fonte ?? "padrao",
    efeitoDoNome: p?.nome?.efeito ?? "solido",
    cor: p?.nome?.cor ?? null,
    cor2: p?.nome?.cor2 ?? null,

    patente: p?.patente ?? "nenhuma",
    decoracao: p?.decoracao ?? "nenhuma",
    moldura: p?.moldura ?? "nenhuma",
    efeitoDoPerfil: p?.efeito ?? "nenhum",
    placa: p?.placa ?? "nenhuma",

    bannerUrl: p?.bannerUrl ?? null,
    bannerCor: p?.bannerCor ?? null,
    temaPrimario: p?.temaPrimario ?? null,
    temaSecundario: p?.temaSecundario ?? null,
  };
}

/**
 * Volta ao formato que o servidor guarda, e devolve `null` quando não sobrou
 * escolha nenhuma.
 *
 * O `null` importa: ele faz o `me-service` APAGAR o documento embutido em vez
 * de gravar `{}`. Um objeto vazio no banco obrigaria todo leitor a saber que
 * vazio e ausente são a mesma coisa — e um dia alguém esqueceria.
 */
export function paraPerfil(r: RascunhoDePerfil): EstiloDePerfil | null {
  const nome = semVazios({
    fonte: r.fonte,
    efeito: r.efeitoDoNome,
    cor: r.cor,
    cor2: r.cor2,
  });

  const perfil = semVazios({
    ...(Object.keys(nome).length ? { nome } : {}),
    etiqueta: r.etiqueta.trim(),
    tagGuildId: r.tagGuildId,
    patente: r.patente,
    decoracao: r.decoracao,
    moldura: r.moldura,
    efeito: r.efeitoDoPerfil,
    placa: r.placa,
    bannerUrl: r.bannerUrl,
    bannerCor: r.bannerCor,
    temaPrimario: r.temaPrimario,
    temaSecundario: r.temaSecundario,
  });

  return Object.keys(perfil).length ? (perfil as EstiloDePerfil) : null;
}

/**
 * Tira o que significa "não escolhi": nulo, vazio, e os ids do catálogo que são
 * a própria ausência (`padrao`, `solido`, `nenhum`, `nenhuma`).
 *
 * Sem isto, quem só abriu o editor e fechou gravaria um documento inteiro de
 * padrões — e aí `profiles` deixaria de ser "só quem personalizou" e voltaria a
 * pesar por todo mundo no detalhe do servidor.
 */
function semVazios<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const saida: Record<string, unknown> = {};

  for (const [chave, valor] of Object.entries(obj)) {
    if (valor === null || valor === undefined || valor === "") continue;
    if (typeof valor === "string" && VAZIOS.has(valor)) continue;

    saida[chave] = valor;
  }

  return saida as Partial<T>;
}
