import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { ptBR } from "./pt-br";
import { IDIOMAS, languages, pastaDoIdioma } from "./settings";

/*
  Trinta e quatro catálogos são trinta e quatro listas da mesma coisa, e listas
  divergem.

  O TypeScript já pega chave FALTANDO — é para isso que `typeof ptBR` serve de
  molde. O que ele não pega é o resto: chave sobrando num idioma, texto vazio,
  e interpolação (`{{feito}}`) perdida na tradução, que vira um buraco no meio
  da frase e só aparece para quem usa aquele idioma.
*/
function achatar(objeto: unknown, prefixo = ""): Record<string, string> {
  const saida: Record<string, string> = {};

  for (const [chave, valor] of Object.entries(
    objeto as Record<string, unknown>,
  )) {
    const caminho = prefixo ? `${prefixo}.${chave}` : chave;

    if (typeof valor === "string") saida[caminho] = valor;
    else if (valor && typeof valor === "object")
      Object.assign(saida, achatar(valor, caminho));
  }

  return saida;
}

/// Carregados pelo mesmo caminho que o app usa — se a pasta de um idioma não
/// existir, o teste falha aqui, que é onde deve falhar.
const catalogos = Object.fromEntries(
  await Promise.all(
    languages.map(async (lng) => {
      const modulo = (await import(`./${pastaDoIdioma(lng)}/index.ts`)) as {
        default: typeof ptBR;
      };

      return [lng, achatar(modulo.default)] as const;
    }),
  ),
);

const origem = achatar(ptBR);

describe("catálogos de tradução", () => {
  it("tem um catálogo para cada idioma anunciado", () => {
    expect(Object.keys(catalogos).sort()).toEqual([...languages].sort());
  });

  it("oferece na tela exatamente os idiomas que existem", () => {
    expect(IDIOMAS.map((i) => i.lng).sort()).toEqual([...languages].sort());
  });

  it("não repete idioma na lista da tela", () => {
    const codigos = IDIOMAS.map((i) => i.lng);

    expect(codigos).toHaveLength(new Set(codigos).size);
  });

  it("nenhum idioma tem chave a mais nem a menos", () => {
    const daOrigem = Object.keys(origem).sort();

    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      expect({ idioma, chaves: Object.keys(catalogo).sort() }).toEqual({
        idioma,
        chaves: daOrigem,
      });
    }
  });

  /*
    `{{feito}} de {{total}}` traduzido como "{{feito}} of {{total}}" está certo;
    traduzido sem os dois vira uma frase que perde o número. O i18next não
    reclama — ele só não interpola nada, e a tela mostra a frase truncada.
  */
  it("não perde interpolação na tradução", () => {
    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      for (const [chave, texto] of Object.entries(origem)) {
        const esperadas = [...texto.matchAll(/\{\{(\w+)\}\}/g)]
          .map((m) => m[1])
          .sort();
        const traduzido = catalogo[chave] ?? "";
        const achadas = [...traduzido.matchAll(/\{\{(\w+)\}\}/g)]
          .map((m) => m[1])
          .sort();

        expect({ idioma, chave, vars: achadas }).toEqual({
          idioma,
          chave,
          vars: esperadas,
        });
      }
    }
  });

  it("não deixa texto vazio", () => {
    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      const vazias = Object.entries(catalogo)
        .filter(([, texto]) => !texto.trim())
        .map(([chave]) => chave);

      expect({ idioma, vazias }).toEqual({ idioma, vazias: [] });
    }
  });

  /*
    Deixar o texto em português dentro de outro idioma é o erro mais fácil de
    cometer numa tradução em lote — e o mais difícil de ver, porque a tela
    continua funcionando.

    A conta é uma PROPORÇÃO, e não um número de chaves, e isso custou um teste
    vermelho para ficar claro. Com sessenta e cinco textos, "menos de vinte
    iguais" parecia generoso; ao passar de cento e oitenta, o espanhol bateu
    nele — e nenhuma daquelas linhas estava por traduzir. "Mostrar",
    "cancelar", "Copiar", "Enviar", "Ver" e "spoiler" se escrevem igual nos
    dois idiomas, e a lista só cresce junto com o catálogo. Um limite absoluto
    transformaria cada rodada de tradução numa negociação com o teste.

    Quarenta por cento é o ponto onde a coincidência acaba e o descuido começa:
    o espanhol, que é o mais próximo de todos, mora perto dos vinte; um
    catálogo copiado e não traduzido nasce acima dos oitenta.
  */
  it("não deixa um idioma inteiro em português", () => {
    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      if (idioma === "pt-BR") continue;

      const iguais = Object.entries(origem).filter(
        ([chave, texto]) => catalogo[chave] === texto,
      );

      const proporcao = iguais.length / Object.keys(origem).length;

      expect({ idioma, traduzido: proporcao < 0.4 }).toEqual({
        idioma,
        traduzido: true,
      });
    }
  });

  /*
    Toda chave que a tela pede tem que existir.

    A chave viaja como string, e string errada não é erro de tipo: o i18next
    devolve a própria chave, e a lateral passa a mostrar
    "configuracoes.telas.conta" no lugar de "Minha conta".

    A varredura é do `src` inteiro, e não de uma lista de arquivos. A lista
    existia enquanto só as configurações traduziam — três caminhos escritos à
    mão. Com a conversa, viraram doze componentes, e uma lista de arquivos que
    alguém precisa lembrar de aumentar é uma guarda que envelhece calada: o
    componente novo entra, ninguém o inscreve, e o teste continua verde
    olhando para o lugar errado.
  */
  it("tem tradução para toda chave que a tela pede", () => {
    const raiz = dirname(fileURLToPath(import.meta.url));

    /// O próprio `traducao/` fica de fora: lá as chaves são a definição, não o
    /// pedido, e o teste acima já cuida delas.
    const varrer = (pasta: string): string[] =>
      readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
        const caminho = join(pasta, item.name);

        if (item.isDirectory()) return item.name === "traducao" ? [] : varrer(caminho);
        return /\.tsx?$/.test(item.name) ? [readFileSync(caminho, "utf8")] : [];
      });

    const pedidas = new Set(
      varrer(join(raiz, "..")).flatMap((src) =>
        [
          ...src.matchAll(/"((?:comum|configuracoes|conversa|idioma|perfil)\.[\w.]+)"/g),
        ].map((m) => m[1]!),
      ),
    );

    const semTraducao = [...pedidas].filter((chave) => !(chave in origem));

    expect(semTraducao).toEqual([]);
  });

  /*
    As chaves que a tela MONTA, e que a varredura acima nunca vê.

    Duas listas do perfil vivem fora do componente — os quatro estados de
    presença e os seis prazos do status — e guardam a chave, não o texto,
    justamente para não congelar o idioma na carga do arquivo. O preço é que
    elas chegam ao `t` como `perfil.presenca.${estado.chave}`: uma interpolação,
    que nenhum grep de literal enxerga.

    Errar a letra de uma delas não quebra nada — o i18next devolve a própria
    chave, e o menu passa a mostrar "perfil.presenca.disponivel" no lugar de
    "Disponível".

    O teste LÊ AS CHAVES DO ARQUIVO, e não de uma lista repetida aqui. A
    primeira versão trazia os dez nomes escritos à mão e conferia se existiam
    no catálogo: passava com o componente quebrado, porque conferia a lista
    contra si mesma. Guarda que não sabe o que o código faz não guarda nada.
  */
  it("tem tradução para as chaves que a tela monta por interpolação", () => {
    const raiz = dirname(fileURLToPath(import.meta.url));
    const fontes: [string, string][] = [
      ["perfil.presenca", join(raiz, "..", "components", "profile", "MenuDoProprioCartao.tsx")],
      ["perfil.status", join(raiz, "..", "components", "profile", "StatusModal.tsx")],
    ];

    const montadas = fontes.flatMap(([prefixo, caminho]) =>
      [
        ...readFileSync(caminho, "utf8").matchAll(/\b(?:chave|detalhe): "(\w+)"/g),
      ].map((m) => `${prefixo}.${m[1]}`),
    );

    /// Se um dia a lista mudar de forma e o `matchAll` não achar nada, o teste
    /// passaria vazio e calado — daí a conferência de que ele achou algo.
    expect(montadas.length).toBeGreaterThan(8);
    expect(montadas.filter((chave) => !(chave in origem))).toEqual([]);
  });
});
