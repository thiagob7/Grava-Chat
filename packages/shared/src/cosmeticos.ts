import { z } from "zod";

/**
 * O catálogo de enfeites: estilo de nome, decoração de avatar, moldura, efeito
 * de perfil e placa de identificação.
 *
 * No Discord esses itens vêm de uma loja com ilustração pronta; aqui não há loja
 * nem assinatura, então todo mundo tem tudo. A maior parte é GERADA EM CSS; o
 * resto (as decorações animadas e as patentes) é arte embutida no pacote do
 * front. O que nenhum deles é: arquivo hospedado. Nada aqui busca nada em tempo
 * de execução, então não há link pra quebrar e funciona offline no aplicativo de
 * desktop.
 *
 * Os ids viram `z.enum` de propósito. Com `z.string()` livre, o front acabaria
 * interpolando um id vindo do banco dentro de uma classe CSS ou de um atributo
 * `data-` — e aí um valor inventado por qualquer cliente escolhe o que renderiza.
 * Com enum o conjunto é fechado e o lookup no front é total.
 */

// ---------------------------------------------------------------- nome

/**
 * As fontes ficam aqui só como IDENTIDADE; o `@font-face` de cada uma mora no
 * front (`lib/cosmeticos/fontes.ts`), carregado sob demanda.
 */
export const FONTES_DE_NOME = ["padrao", "serifada", "monoespacada", "titulo", "manuscrita"] as const;
export type FonteDeNome = (typeof FONTES_DE_NOME)[number];

/**
 * `solido` é o padrão e não é um efeito de verdade — existe na lista pra a tela
 * ter o que marcar como "nenhum" sem precisar de um caso especial.
 */
export const EFEITOS_DE_NOME = ["solido", "gradiente", "neon", "brilho"] as const;
export type EfeitoDeNome = (typeof EFEITOS_DE_NOME)[number];

// ------------------------------------------------------------- avatar

/**
 * As decoracoes de avatar.
 *
 * A maioria e CSS. As ANIMADAS (`aro` em diante) sao arquivos Lottie — animacao
 * vetorial em JSON, o mesmo espirito do que o Discord faz (la e APNG desenhado
 * quadro a quadro). Aqui o id continua sendo so um id: quem sabe se ele vira
 * classe CSS ou player e o front, em `lib/cosmeticos/animadas.ts`.
 */
export const DECORACOES = [
  "nenhuma",
  "aurora",
  "chamas",
  "circuito",
  "petalas",
  "orbita",
  "aro",
  "alada",
  "sol",
  "caveiras",
] as const;
export type Decoracao = (typeof DECORACOES)[number];

export const MOLDURAS = ["nenhuma", "neon", "dourada", "vidro", "pixel", "espinhos"] as const;
export type Moldura = (typeof MOLDURAS)[number];

// ------------------------------------------------------------- perfil

export const EFEITOS_DE_PERFIL = ["nenhum", "poeira", "chuva", "brasas", "bolhas"] as const;
export type EfeitoDePerfil = (typeof EFEITOS_DE_PERFIL)[number];

export const PLACAS = ["nenhuma", "fita", "holograma", "carimbo", "cristal"] as const;
export type Placa = (typeof PLACAS)[number];

/**
 * A patente: a insignia que fica ao lado do nome.
 *
 * NAO e `emblemas`, e a diferenca e de dono. Emblema o SERVIDOR cria e o membro
 * veste, entao ele e ObjectId e some quando a pessoa sai dali. A patente e como
 * decoracao e moldura: um conjunto fechado que vem com o app, escolhido pela
 * PESSOA, e que a acompanha em qualquer servidor e na conversa privada.
 *
 * Tambem e o unico enfeite daqui que nao e CSS nem camada em volta do avatar —
 * a arte e Lottie e mora em `assets/patentes/` no front. Aqui o id continua
 * sendo so um id.
 */
export const PATENTES = ["nenhuma", "orbe"] as const;
export type Patente = (typeof PATENTES)[number];

// ------------------------------------------------------------- cargo

export const ESTILOS_DE_CARGO = ["solido", "gradiente", "holografico"] as const;
export type EstiloDeCargo = (typeof ESTILOS_DE_CARGO)[number];

// ------------------------------------------------------------- schema

/** Id do Mongo. Repetido aqui porque `models.ts` importa deste arquivo, e nao o contrario. */
const objectIdCosmetico = z.string().regex(/^[a-f\d]{24}$/i);

/** Hex de 6 dígitos. O mesmo formato que `validations/role.ts` já exige na cor do cargo. */
export const corHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

/**
 * Como o nome da pessoa é pintado.
 *
 * `cor` é opcional mesmo com efeito escolhido: sem ela, o front usa a cor do
 * cargo mais alto como cor 1. É o que mantém a hierarquia do servidor visível
 * mesmo depois de todo mundo enfeitar o nome.
 */
export const estiloDeNomeSchema = z.object({
  fonte: z.enum(FONTES_DE_NOME).optional(),
  efeito: z.enum(EFEITOS_DE_NOME).optional(),
  cor: corHex.nullable().optional(),
  /** segunda cor do gradiente; ignorada pelos efeitos de uma cor só */
  cor2: corHex.nullable().optional(),
});
export type EstiloDeNome = z.infer<typeof estiloDeNomeSchema>;

/**
 * Tudo que a pessoa escolheu pra se enfeitar.
 *
 * Guardado como UM documento embutido, não como doze colunas soltas em `User`.
 * O ganho não é de disco — é de fronteira: `profile` é um nó só, que dá pra
 * incluir ou excluir inteiro num `select`, normalizar inteiro numa escrita e
 * espelhar 1:1 num schema. Doze campos soltos não têm como ser tratados como
 * grupo, e `User` é lido em massa (lista de membros, autor de cada mensagem).
 */
export const estiloDePerfilSchema = z.object({
  nome: estiloDeNomeSchema.optional(),
  /**
   * A etiqueta: um nome curto seu, ao lado do @usuario no cartao.
   *
   * NAO e a etiqueta do servidor (`guild.tag`), que e do servidor e vale pra
   * todo mundo dentro dele. Esta e sua e te acompanha em qualquer lugar — o
   * apelido de quatro letras que os amigos usam.
   */
  etiqueta: z.string().max(6).nullable().optional(),
  patente: z.enum(PATENTES).optional(),
  decoracao: z.enum(DECORACOES).optional(),
  moldura: z.enum(MOLDURAS).optional(),
  efeito: z.enum(EFEITOS_DE_PERFIL).optional(),
  placa: z.enum(PLACAS).optional(),
  /**
   * De qual servidor eu visto a etiqueta.
   *
   * A escolha e da PESSOA e vale em todo lugar — ela te acompanha nos outros
   * servidores e na conversa privada. Antes a etiqueta era do servidor e
   * grudava em todo mundo que estava nele, o que fazia dela um enfeite do
   * cenario, nao de quem esta ali.
   */
  tagGuildId: objectIdCosmetico.nullable().optional(),
  /** faixa do topo do cartão: imagem OU cor sólida */
  bannerUrl: z.string().nullable().optional(),
  bannerCor: corHex.nullable().optional(),
  /** as duas cores do tema do cartão de perfil */
  temaPrimario: corHex.nullable().optional(),
  temaSecundario: corHex.nullable().optional(),
});
export type EstiloDePerfil = z.infer<typeof estiloDePerfilSchema>;

/**
 * Status personalizado. `expiraEm` nulo = não expira.
 *
 * A expiração é conferida na SERIALIZAÇÃO, não por tarefa agendada — é o mesmo
 * idioma que o castigo já usa comparando `timeoutUntil` com a hora atual.
 */
export const statusPersonalizadoSchema = z.object({
  texto: z.string().max(96),
  emoji: z.string().max(64).nullable().optional(),
  expiraEm: z.iso.datetime().nullable().optional(),
});
export type StatusPersonalizado = z.infer<typeof statusPersonalizadoSchema>;

/**
 * O que os OUTROS veem de enfeite seu.
 *
 * Repare no que NÃO está aqui: banner, tema e efeito de perfil. Eles só
 * aparecem no cartão de perfil, que é aberto um de cada vez — mandá-los junto
 * da lista de membros seria pagar por todo mundo pra mostrar um.
 */
export const perfilPublicoSchema = z.object({
  nome: estiloDeNomeSchema.optional(),
  etiqueta: z.string().max(6).nullable().optional(),
  /**
   * A etiqueta do SERVIDOR que a pessoa escolheu vestir, ja resolvida.
   *
   * Vem pronta (`tag` e `tagIcon`, nao so o id) porque quem le nao tem como
   * resolver: e a etiqueta de um servidor que o observador pode nem conhecer.
   */
  etiquetaDoServidor: z
    .object({ guildId: objectIdCosmetico, tag: z.string(), tagIcon: z.string().nullable() })
    .nullable()
    .optional(),
  /**
   * Os emblemas que a pessoa escolheu vestir NESTE servidor.
   *
   * Vem daqui e nao de `User` porque emblema e do servidor: quem cria e o
   * servidor, e a escolha de vestir e por servidor. O mapa `profiles` ja e
   * montado por servidor, entao isto viaja de graca.
   */
  emblemas: z.array(objectIdCosmetico).optional(),
  /**
   * A patente vem no perfil PUBLICO e nao no mapa do servidor porque ela e da
   * pessoa, nao do servidor: o mesmo id vale numa DM, onde nao ha mapa nenhum
   * de onde tira-la. E o oposto exato de `emblemas`, logo acima.
   */
  patente: z.enum(PATENTES).optional(),
  decoracao: z.enum(DECORACOES).optional(),
  moldura: z.enum(MOLDURAS).optional(),
  placa: z.enum(PLACAS).optional(),
  status: statusPersonalizadoSchema.nullable().optional(),
});
export type PerfilPublico = z.infer<typeof perfilPublicoSchema>;
