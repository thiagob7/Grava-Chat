import { describe, expect, it } from "vitest";

import {
  NOMES_DE_ORIGEM,
  nomesDeclaradosNoTema,
  PONTE_DE_TEMA,
  traduzirTema,
} from "./ponte-de-tema";
import tokensVivos from "~/features/configuracoes/lib/tokens-vivos.json";

describe("ponte de tema", () => {
  it("traduz o fundo da lateral para o nosso nome", () => {
    expect(traduzirTema({ "--background-secondary": "#1a181e" })).toEqual({
      "--color-surface-1": "#1a181e",
    });
  });

  it("uma origem pode pintar varios dos nossos", () => {
    const saida = traduzirTema({ "--background-secondary-lighter": "#1e1d23" });

    expect(saida["--color-surface-2"]).toBe("#1e1d23");
    expect(saida["--color-composer"]).toBe("#1e1d23");
  });

  it("o cabecalho do canal vem do token proprio deles", () => {
    expect(traduzirTema({ "--background-channel-header": "#111" })["--color-cabecalho"]).toBe(
      "#111",
    );
  });

  it("varias origens podem cair no mesmo destino, e a ultima vale", () => {
    const saida = traduzirTema({
      "--background-header-secondary": "#aaa",
      "--border-color": "#bbb",
    });

    expect(saida["--color-line"]).toBe("#bbb");
  });

  it("ignora o que o tema nao declarou", () => {
    expect(traduzirTema({ "--background-secondary": "" })).toEqual({});
    expect(traduzirTema({})).toEqual({});
  });

  it("nao pisa no token que a pessoa escolheu na mao", () => {
    const saida = traduzirTema(
      { "--background-secondary": "#000" },
      new Set(["--color-surface-1"]),
    );

    expect(saida).toEqual({});
  });

  it("apara espaco em volta do valor", () => {
    expect(traduzirTema({ "--text-primary": "  #fff  " })["--color-ink"]).toBe("#fff");
  });

  it("os nomes de origem batem com o mapa", () => {
    expect(NOMES_DE_ORIGEM).toEqual(Object.keys(PONTE_DE_TEMA));
    expect(NOMES_DE_ORIGEM.every((n) => n.startsWith("--"))).toBe(true);
  });

  /*
    Antes isto só conferia o prefixo do nome, e prefixo certo em token morto
    passa liso: a ponte traduziria para um lugar que ninguém lê, e o tema
    pareceria não pegar. Agora a pergunta é a mesma do estúdio — o token está
    vivo no CSS construído?

    `--font-display` é a exceção, e é de propósito: nós não temos esse token, e
    a linha existe para o dia em que tiver. Fica anotada aqui em vez de virar
    uma tradução silenciosa para o vazio.
  */
  it("todo destino é um token que o app realmente lê", () => {
    const vivos = new Set(tokensVivos as string[]);
    const combinado = new Set(["--font-display"]);

    const mortos = [
      ...new Set(Object.values(PONTE_DE_TEMA).flat()),
    ].filter((destino) => !vivos.has(destino) && !combinado.has(destino));

    expect(mortos).toEqual([]);
  });
});

describe("o que o tema declarou", () => {
  it("acha as variáveis que o arquivo escreve", () => {
    const nomes = nomesDeclaradosNoTema(`
      :root { --background-secondary: #111; --text-primary: #fff }
      body { --brand-primary: rgb(254, 128, 25); }
    `);

    expect([...nomes].sort()).toEqual([
      "--background-secondary",
      "--brand-primary",
      "--text-primary",
    ]);
  });

  /*
    A camada de tokens já declara o vocabulário inteiro do Fluxer. Se ler uma
    variável contasse como declarar, a ponte escreveria a camada de referência
    por cima das cores reais — que foi o que deixou o cabeçalho de outra cor.
  */
  it("não conta variável que o tema só lê", () => {
    const nomes = nomesDeclaradosNoTema(
      ".x { color: var(--background-channel-header); border: 1px solid var(--text-primary) }",
    );

    expect([...nomes]).toEqual([]);
  });

  it("conta a que o tema declara em função de outra", () => {
    const nomes = nomesDeclaradosNoTema(":root { --background-primary: var(--ThemeFlatDarker) }");

    expect([...nomes]).toEqual(["--background-primary"]);
  });

  /*
    A ordem da tabela É a regra de precedência, e é fácil de quebrar sem
    perceber: basta alguém acrescentar um nome no lugar errado. Eles têm cores
    independentes para a marca e para o preenchimento do botão; nós temos um
    token só. Quem mexeu nos dois quis que a marca mandasse.
  */
  it("deixa o nome canônico vencer o específico", () => {
    const nomes = Object.keys(PONTE_DE_TEMA);
    const antes = (especifico: string, canonico: string) =>
      nomes.indexOf(especifico) < nomes.indexOf(canonico);

    const pares: [string, string][] = [
      ["--button-primary-fill", "--brand-primary"],
      ["--button-primary-active-fill", "--brand-secondary"],
      ["--button-danger-fill", "--accent-danger"],
      ["--interactive-active", "--text-primary"],
      ["--interactive-muted", "--text-tertiary"],
      ["--bg-hover", "--background-modifier-hover"],
      ["--bg-active", "--background-modifier-selected"],
      ["--bg-primary", "--background-primary"],
      ["--accent-info", "--text-link"],
      ["--control-button-normal-text", "--text-secondary"],
    ];

    expect(pares.filter(([e, c]) => !antes(e, c))).toEqual([]);
  });

  it("o botão do tema pinta a nossa marca quando o tema só fala de botão", () => {
    expect(traduzirTema({ "--button-primary-fill": "#ff0000" })).toEqual({
      "--color-brand": "#ff0000",
    });
  });

  it("mas a marca do tema vence o botão quando ele fala dos dois", () => {
    const saida = traduzirTema({
      "--button-primary-fill": "#ff0000",
      "--brand-primary": "#00ff00",
    });

    expect(saida["--color-brand"]).toBe("#00ff00");
  });

  it("não repete um nome de origem em duas linhas", () => {
    const nomes = Object.keys(PONTE_DE_TEMA);

    expect(nomes).toHaveLength(new Set(nomes).size);
  });
});
