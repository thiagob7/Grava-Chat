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
import { VAZIOS } from "~/features/perfil/lib/catalogo";

export interface RascunhoDePerfil {
  displayName: string;
  etiqueta: string;
  tagGuildId: string | null;
  bio: string;
  avatarUrl: string | null;

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

function semVazios<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const saida: Record<string, unknown> = {};

  for (const [chave, valor] of Object.entries(obj)) {
    if (valor === null || valor === undefined || valor === "") continue;
    if (typeof valor === "string" && VAZIOS.has(valor)) continue;

    saida[chave] = valor;
  }

  return saida as Partial<T>;
}
