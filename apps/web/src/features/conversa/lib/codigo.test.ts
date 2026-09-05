import { describe, expect, it } from "vitest";

import { partirEmCodigo, rotuloDaLingua,
  adivinharLingua,
  pareceCodigo,
  textoParaArquivo,
} from "./codigo";

describe("partirEmCodigo", () => {
  it("texto sem crase sai inteiro, num pedaço só", () => {
    expect(partirEmCodigo("oi, tudo bem?")).toEqual([
      { tipo: "texto", texto: "oi, tudo bem?" },
    ]);
  });

  it("guarda a língua da cerca e tira a quebra que sobra no fim", () => {
    expect(partirEmCodigo('```json\n{ "a": 1 }\n```')).toEqual([
      { tipo: "bloco", codigo: '{ "a": 1 }', lingua: "json" },
    ]);
  });

  it("sem língua o bloco continua bloco", () => {
    expect(partirEmCodigo("```\nls -la\n```")).toEqual([
      { tipo: "bloco", codigo: "ls -la", lingua: null },
    ]);
  });

  it("do informe só a primeira palavra vira língua", () => {
    const [bloco] = partirEmCodigo("```sh # instala\nyarn\n```");
    expect(bloco).toEqual({ tipo: "bloco", codigo: "yarn", lingua: "sh" });
  });

  it("separa o texto de antes e o de depois da cerca", () => {
    expect(partirEmCodigo("olha:\n```ts\nconst a = 1;\n```\npronto")).toEqual([
      { tipo: "texto", texto: "olha:\n" },
      { tipo: "bloco", codigo: "const a = 1;", lingua: "ts" },
      { tipo: "texto", texto: "\npronto" },
    ]);
  });

  it("crase solta no meio da frase é código de linha", () => {
    expect(partirEmCodigo("roda `yarn dev` aí")).toEqual([
      { tipo: "texto", texto: "roda " },
      { tipo: "linha", codigo: "yarn dev" },
      { tipo: "texto", texto: " aí" },
    ]);
  });

  it("cerca vazia é só alguém escrevendo crase, não bloco", () => {
    expect(partirEmCodigo("``` ```")).toEqual([{ tipo: "texto", texto: "``` ```" }]);
  });

  it("link dentro da cerca fica no código, longe do enriquecedor", () => {
    expect(partirEmCodigo("```\nhttps://gravae.io :teste: <@000000000000000000000000>\n```")).toEqual([
      {
        tipo: "bloco",
        codigo: "https://gravae.io :teste: <@000000000000000000000000>",
        lingua: null,
      },
    ]);
  });

  it("duas cercas seguidas viram dois blocos", () => {
    const pedacos = partirEmCodigo("```js\na\n```\ne\n```py\nb\n```");
    expect(pedacos.map((p) => p.tipo)).toEqual(["bloco", "texto", "bloco"]);
  });

  it("cerca aberta e não fechada continua sendo texto", () => {
    expect(partirEmCodigo("```js\nconst a = 1;")).toEqual([
      { tipo: "texto", texto: "```js\nconst a = 1;" },
    ]);
  });
});

describe("rotuloDaLingua", () => {
  it("normaliza o apelido, seja qual for a caixa", () => {
    expect(rotuloDaLingua("js")).toBe("JavaScript");
    expect(rotuloDaLingua("JSON")).toBe("JSON");
    expect(rotuloDaLingua("  ts  ")).toBe("TypeScript");
  });

  it("o que não está na tabela aparece como veio, com maiúscula", () => {
    expect(rotuloDaLingua("zig")).toBe("Zig");
  });

  it("sem língua, o cabeçalho ainda diz o que é", () => {
    expect(rotuloDaLingua(null)).toBe("Código");
    expect(rotuloDaLingua("")).toBe("Código");
  });
});

const CODIGO: Record<string, string> = {
  "o TypeScript do print": `import { cameraTimeline } from "@gravae/ai-analytics";

// mínimo — só path e result
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

const NAO_CODIGO: Record<string, string> = {
  "parágrafo": `Oi gente, tudo bem com vocês?
Queria avisar que amanhã não vou conseguir participar da reunião.
Se alguém puder anotar o que foi decidido eu agradeço muito.`,
  "lista com traços": `- comprar pão
- passar no banco
- ligar pro dentista`,
  "lista numerada": `1. primeiro a gente alinha o escopo
2. depois eu mando o orçamento
3. e aí você me diz se fecha`,
  "endereços": `https://gravae.io
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
  for (const [nome, texto] of Object.entries(CODIGO)) {
    it(`reconhece: ${nome}`, () => expect(pareceCodigo(texto)).toBe(true));
  }
  for (const [nome, texto] of Object.entries(NAO_CODIGO)) {
    it(`NÃO reconhece: ${nome}`, () => expect(pareceCodigo(texto)).toBe(false));
  }
});

describe("adivinhar a língua", () => {
  it.each([
    ["json", CODIGO.json],
    ["py", CODIGO.python],
    ["sh", CODIGO.shell],
    ["html", CODIGO.html],
    ["sql", CODIGO.sql],
    [
      "css",
      ".lista-de-membros {\n  transition: width 0.3s ease;\n  width: 3rem;\n}",
    ],
    ["css", "@media (min-width: 640px) {\n  body { margin: 0; }\n}"],
  ])("%s", (esperada, texto) => expect(adivinharLingua(texto!)).toBe(esperada));

  it("nao confunde objeto de javascript com css", () => {
    expect(adivinharLingua("const a = { cor: azul };")).toBe("js");
  });

  it("nao chuta lingua para texto comum", () => {
    expect(adivinharLingua("bom dia, tudo certo por aí?")).toBeNull();
  });
});

const DIFICEIS: Record<string, string> = {
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

const AINDA_CODIGO: Record<string, string> = {
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
  for (const [nome, texto] of Object.entries(DIFICEIS)) {
    it(nome, () => expect(pareceCodigo(texto)).toBe(false));
  }
});

describe("mas continua pegando o que é código", () => {
  for (const [nome, texto] of Object.entries(AINDA_CODIGO)) {
    it(nome, () => expect(pareceCodigo(texto)).toBe(true));
  }
});


describe("virar arquivo", () => {
  const bloco = (lingua: string, corpo: string) => "```" + lingua + "\n" + corpo + "\n```";

  it("tira as cercas: um .js com ``` dentro nao e JavaScript", () => {
    const { conteudo } = textoParaArquivo(bloco("js", "const a = 1;"));

    expect(conteudo).toBe("const a = 1;");
    expect(conteudo).not.toContain("```");
  });

  it("emenda TODOS os blocos num arquivo so", () => {
    const texto = bloco("js", "const a = 1;") + bloco("js", "const b = 2;");
    const { conteudo } = textoParaArquivo(texto);

    expect(conteudo).toBe("const a = 1;\n\nconst b = 2;");
  });

  it("a extensao sai da cerca", () => {
    expect(textoParaArquivo(bloco("ts", "const a: number = 1;")).nome).toBe("mensagem.ts");
    expect(textoParaArquivo(bloco("css", "body { color: red; }")).nome).toBe("mensagem.css");
  });

  it("sem cerca declarando, adivinha pelo codigo", () => {
    expect(textoParaArquivo(bloco("", "SELECT * FROM gente;")).nome).toBe("mensagem.sql");
  });

  it("texto solto no meio derruba tudo para .txt, com as cercas", () => {
    const texto = "olha isso:\n" + bloco("js", "const a = 1;");
    const { nome, conteudo } = textoParaArquivo(texto);

    expect(nome).toBe("mensagem.txt");
    expect(conteudo).toContain("olha isso:");
    expect(conteudo).toContain("```");
  });

  it("texto puro vira .txt", () => {
    expect(textoParaArquivo("bom dia").nome).toBe("mensagem.txt");
  });

  it("espaco em branco entre blocos nao conta como texto solto", () => {
    const texto = bloco("js", "const a = 1;") + "\n\n" + bloco("js", "const b = 2;");

    expect(textoParaArquivo(texto).nome).toBe("mensagem.js");
  });
});
