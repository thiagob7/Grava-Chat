import { z } from "zod";

export const FONTES_DE_NOME = ["padrao", "serifada", "monoespacada", "titulo", "manuscrita"] as const;
export type FonteDeNome = (typeof FONTES_DE_NOME)[number];

export const EFEITOS_DE_NOME = ["solido", "gradiente", "neon", "brilho"] as const;
export type EfeitoDeNome = (typeof EFEITOS_DE_NOME)[number];

export const DECORACOES = [
  "nenhuma",
  "aurora",
  "chamas",
  "circuito",
  "petalas",
  "orbita",
  "aro",
  "alada",
  "gelo",
  "coroa",
  "runas",
  "loureiro",
] as const;
export type Decoracao = (typeof DECORACOES)[number];

export const MOLDURAS = ["nenhuma", "neon", "dourada", "vidro", "pixel", "espinhos"] as const;
export type Moldura = (typeof MOLDURAS)[number];

export const EFEITOS_DE_PERFIL = ["nenhum", "poeira", "chuva", "brasas", "bolhas"] as const;
export type EfeitoDePerfil = (typeof EFEITOS_DE_PERFIL)[number];

export const PLACAS = ["nenhuma", "fita", "holograma", "carimbo", "cristal"] as const;
export type Placa = (typeof PLACAS)[number];

export const PATENTES = ["nenhuma", "orbe"] as const;
export type Patente = (typeof PATENTES)[number];

export const ESTILOS_DE_CARGO = ["solido", "gradiente", "holografico"] as const;
export type EstiloDeCargo = (typeof ESTILOS_DE_CARGO)[number];

const objectIdCosmetico = z.string().regex(/^[a-f\d]{24}$/i);

export const corHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

export const estiloDeNomeSchema = z.object({
  fonte: z.enum(FONTES_DE_NOME).optional(),
  efeito: z.enum(EFEITOS_DE_NOME).optional(),
  cor: corHex.nullable().optional(),
  cor2: corHex.nullable().optional(),
});
export type EstiloDeNome = z.infer<typeof estiloDeNomeSchema>;

export const estiloDePerfilSchema = z.object({
  nome: estiloDeNomeSchema.optional(),
  etiqueta: z.string().max(6).nullable().optional(),
  patente: z.enum(PATENTES).optional(),
  decoracao: z.enum(DECORACOES).optional(),
  moldura: z.enum(MOLDURAS).optional(),
  efeito: z.enum(EFEITOS_DE_PERFIL).optional(),
  placa: z.enum(PLACAS).optional(),
  tagGuildId: objectIdCosmetico.nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  bannerCor: corHex.nullable().optional(),
  temaPrimario: corHex.nullable().optional(),
  temaSecundario: corHex.nullable().optional(),
});
export type EstiloDePerfil = z.infer<typeof estiloDePerfilSchema>;

export const statusPersonalizadoSchema = z.object({
  texto: z.string().max(96),
  emoji: z.string().max(64).nullable().optional(),
  expiraEm: z.iso.datetime().nullable().optional(),
});
export type StatusPersonalizado = z.infer<typeof statusPersonalizadoSchema>;

export const perfilPublicoSchema = z.object({
  nome: estiloDeNomeSchema.optional(),
  etiqueta: z.string().max(6).nullable().optional(),
  etiquetaDoServidor: z
    .object({ guildId: objectIdCosmetico, tag: z.string(), tagIcon: z.string().nullable() })
    .nullable()
    .optional(),
  emblemas: z.array(objectIdCosmetico).optional(),
  patente: z.enum(PATENTES).optional(),
  decoracao: z.enum(DECORACOES).optional(),
  moldura: z.enum(MOLDURAS).optional(),
  placa: z.enum(PLACAS).optional(),
  status: statusPersonalizadoSchema.nullable().optional(),
});
export type PerfilPublico = z.infer<typeof perfilPublicoSchema>;
