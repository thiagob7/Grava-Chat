import { describe, expect, it } from "vitest";

import { fromCode, languageLabel,
  guessLanguage,
  looksCode,
  textForFile,
} from "./codigo";

describe("partirEmCodigo", () => {
  it("texto sem crase sai inteiro, num pedaço só", () => {
    expect(fromCode("oi, tudo bem?")).toEqual([
      { kind: "texto", text: "oi, tudo bem?" },
    ]);
  });

  it("guarda a língua da cerca e tira a quebra que sobra no fim", () => {
    expect(fromCode('```json\n{ "a": 1 }\n```')).toEqual([
      { kind: "bloco", code: '{ "a": 1 }', language: "json" },
    ]);
  });

  it("sem língua o bloco continua bloco", () => {
    expect(fromCode("```\nls -la\n```")).toEqual([
      { kind: "bloco", code: "ls -la", language: null },
    ]);
  });

  it("do informe só a primeira palavra vira língua", () => {
    const [block] = fromCode("```sh # instala\nyarn\n```");
    expect(block).toEqual({ kind: "bloco", code: "yarn", language: "sh" });
  });

  it("separa o texto de antes e o de depois da cerca", () => {
    expect(fromCode("olha:\n```ts\nconst a = 1;\n```\npronto")).toEqual([
      { kind: "texto", text: "olha:\n" },
      { kind: "bloco", code: "const a = 1;", language: "ts" },
      { kind: "texto", text: "\npronto" },
    ]);
  });

  it("crase solta no meio da frase é código de linha", () => {
    expect(fromCode("roda `yarn dev` aí")).toEqual([
      { kind: "texto", text: "roda " },
      { kind: "linha", code: "yarn dev" },
      { kind: "texto", text: " aí" },
    ]);
  });

  it("cerca vazia é só alguém escrevendo crase, não bloco", () => {
    expect(fromCode("``` ```")).toEqual([{ kind: "texto", text: "``` ```" }]);
  });

  it("link dentro da cerca fica no código, longe do enriquecedor", () => {
    expect(fromCode("```\nhttps://exemplo.com :teste: <@000000000000000000000000>\n```")).toEqual([
      {
        kind: "bloco",
        code: "https://exemplo.com :teste: <@000000000000000000000000>",
        language: null,
      },
    ]);
  });

  it("duas cercas seguidas viram dois blocos", () => {
    const pieces = fromCode("```js\na\n```\ne\n```py\nb\n```");
    expect(pieces.map((p) => p.kind)).toEqual(["bloco", "texto", "bloco"]);
  });

  it("cerca aberta e não fechada continua sendo texto", () => {
    expect(fromCode("```js\nconst a = 1;")).toEqual([
      { kind: "texto", text: "```js\nconst a = 1;" },
    ]);
  });
});

describe("rotuloDaLingua", () => {
  it("normaliza o apelido, seja qual for a caixa", () => {
    expect(languageLabel("js")).toBe("JavaScript");
    expect(languageLabel("JSON")).toBe("JSON");
    expect(languageLabel("  ts  ")).toBe("TypeScript");
  });

  it("o que não está na tabela aparece como veio, com maiúscula", () => {
    expect(languageLabel("zig")).toBe("Zig");
  });

  it("sem língua, o cabeçalho ainda diz o que é", () => {
    expect(languageLabel(null)).toBe("Código");
    expect(languageLabel("")).toBe("Código");
  });
});

const CODE: Record<string, string> = {
  "o TypeScript do print": `import { cameraTimeline } from "@gravae/ai-analytics";

await cameraTimeline({
  path: { left: "/capturas/cam01", right: "/capturas/cam02" },
  result: (ev) => { if (ev.switched) console.log(ev.t, ev.camera); },
});`,
  json: `{
  "mcpServers": {
    "shadcn": { "command": "npx" }
  }
}`,
  python: `def somar(a, b):
    total = a + b
    return total`,
  shell: `cd ~/projeto
yarn install
yarn dev --port 5173`,
  css: `.botao {
  color: red;
  padding: 4px;
}`,
  html: `<div class="cartao">
  <span>oi</span>
</div>`,
  sql: `SELECT nome, idade
FROM pessoas
WHERE idade > 18;`,
};

const NOT_CODE: Record<string, string> = {
  "parágrafo": `Oi gente, tudo bem com vocês?
Queria avisar que amanhã não vou conseguir participar da reunião.
Se alguém puder anotar o que foi decidido eu agradeço muito.`,
  "lista com traços": `- comprar pão
- passar no banco
- ligar pro dentista`,
  "lista numerada": `1. primeiro a gente alinha o escopo
2. depois eu mando o orçamento
3. e aí você me diz se fecha`,
  "endereços": `https://exemplo.com
https://github.com/thiagob7
https://gravae-chat.vercel.app`,
  "conversa colada": `Thiago: bom dia
Leonardo: bom dia, chefe
Thiago: conseguiu ver aquilo?`,
  "letra de música": `Eu sei que vou te amar
Por toda a minha vida eu vou te amar
Em cada despedida eu vou te amar`,
};

describe("reconhecer código sem cerca", () => {
  for (const [name, text] of Object.entries(CODE)) {
    it(`reconhece: ${name}`, () => expect(looksCode(text)).toBe(true));
  }
  for (const [name, text] of Object.entries(NOT_CODE)) {
    it(`NÃO reconhece: ${name}`, () => expect(looksCode(text)).toBe(false));
  }
});

describe("adivinhar a língua", () => {
  it.each([
    ["json", CODE.json],
    ["py", CODE.python],
    ["sh", CODE.shell],
    ["html", CODE.html],
    ["sql", CODE.sql],
    [
      "css",
      ".lista-de-membros {\n  transition: width 0.3s ease;\n  width: 3rem;\n}",
    ],
    ["css", "@media (min-width: 640px) {\n  body { margin: 0; }\n}"],
  ])("%s", (expected, text) => expect(guessLanguage(text!)).toBe(expected));

  it("nao confunde objeto de javascript com css", () => {
    expect(guessLanguage("const a = { cor: azul };")).toBe("js");
  });

  it("nao chuta lingua para texto comum", () => {
    expect(guessLanguage("bom dia, tudo certo por aí?")).toBeNull();
  });
});

const HARD: Record<string, string> = {
  "valores em reais": `Total: R$ 1.200,00
Desconto: R$ 200,00
Final: R$ 1.000,00`,
  "ficha de cadastro": `Nome: Thiago Barbosa
Idade: 30
Cidade: São Paulo`,
  "horários": `Segunda: 09:00 às 18:00
Terça: 09:00 às 18:00
Quarta: 09:00 às 12:00`,
  "caminhos de arquivo": `/Users/thbp7/Documents/gravae-chat
/Users/thbp7/Documents/GRAVAEZAP
/Users/thbp7/oracle-a1`,
  "texto com parênteses": `Olha, eu acho (e posso estar errado) que a gente devia esperar.
O cliente ainda não respondeu (mandei ontem de novo).
Se ele não responder até sexta (o que é bem provável), a gente remarca.`,
  "placar": `Flamengo 2 x 1 Palmeiras
Corinthians 0 x 0 São Paulo
Grêmio 3 x 2 Internacional`,
  "emojis e pontuação": `Genteee 😂😂 vocês viram isso?!
Não acredito que ele fez isso... de novo!!
Alguém me explica pfv 🙏`,
};

const STILL_CODE: Record<string, string> = {
  "erro de pilha": `TypeError: Cannot read properties of undefined (reading 'map')
    at MessageList (MessageList.tsx:214:31)
    at renderWithHooks (react-dom.development.js:15486:18)`,
  "yaml": `services:
  api:
    image: node:22
    ports:
      - "3333:3333"`,
  "env": `GRAVAE_BOT_TOKEN=abc123
GRAVAE_CLIENT_ID=456
GRAVAE_FONTE=soundcloud`,
};

describe("não promove mensagem comum a código", () => {
  for (const [name, text] of Object.entries(HARD)) {
    it(name, () => expect(looksCode(text)).toBe(false));
  }
});

describe("mas continua pegando o que é código", () => {
  for (const [name, text] of Object.entries(STILL_CODE)) {
    it(name, () => expect(looksCode(text)).toBe(true));
  }
});

describe("virar arquivo", () => {
  const block = (language: string, body: string) => "```" + language + "\n" + body + "\n```";

  it("tira as cercas: um .js com ``` dentro nao e JavaScript", () => {
    const { content } = textForFile(block("js", "const a = 1;"));

    expect(content).toBe("const a = 1;");
    expect(content).not.toContain("```");
  });

  it("emenda TODOS os blocos num arquivo so", () => {
    const text = block("js", "const a = 1;") + block("js", "const b = 2;");
    const { content } = textForFile(text);

    expect(content).toBe("const a = 1;\n\nconst b = 2;");
  });

  it("a extensao sai da cerca", () => {
    expect(textForFile(block("ts", "const a: number = 1;")).name).toBe("mensagem.ts");
    expect(textForFile(block("css", "body { color: red; }")).name).toBe("mensagem.css");
  });

  it("sem cerca declarando, adivinha pelo codigo", () => {
    expect(textForFile(block("", "SELECT * FROM gente;")).name).toBe("mensagem.sql");
  });

  it("texto solto no meio derruba tudo para .txt, com as cercas", () => {
    const text = "olha isso:\n" + block("js", "const a = 1;");
    const { name, content } = textForFile(text);

    expect(name).toBe("mensagem.txt");
    expect(content).toContain("olha isso:");
    expect(content).toContain("```");
  });

  it("texto puro vira .txt", () => {
    expect(textForFile("bom dia").name).toBe("mensagem.txt");
  });

  it("markdown colado inteiro vira um .js so, sem cerca aninhada", () => {
    const markdown = block("js", "const a = 1;") + block("js", "const b = 2;");
    const { name, content } = textForFile(markdown);

    expect(name).toBe("mensagem.js");
    expect(content).not.toContain("`");
  });

  it("espaco em branco entre blocos nao conta como texto solto", () => {
    const text = block("js", "const a = 1;") + "\n\n" + block("js", "const b = 2;");

    expect(textForFile(text).name).toBe("mensagem.js");
  });
});
