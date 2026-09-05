import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";
import { clientEventSchemas } from "@gravae/shared";

const AQUI = dirname(fileURLToPath(import.meta.url));
const ROTAS = join(AQUI, "..", "..", "api", "src", "routes", "bot-api.ts");
const SAIDA = join(AQUI, "..", "src", "dados", "referencia.json");

const DESCRICOES = {
  "GET /bot/eu": "Quem é o bot deste token.",
  "GET /bot/servidores": "Os servidores em que o bot está.",
  "GET /bot/servidores/:guildId/canais": "Os canais de um servidor, com o que o bot alcança.",
  "PUT /bot/comandos": "Registra a lista de comandos de barra do bot. Substitui a anterior.",
  "POST /bot/canais/:channelId/mensagens": "Manda uma mensagem no canal.",
  "PATCH /bot/mensagens/:messageId": "Edita uma mensagem do próprio bot.",
  "DELETE /bot/mensagens/:messageId": "Apaga uma mensagem do próprio bot.",
  "PUT /bot/mensagens/:messageId/reacoes/:emoji": "Reage a uma mensagem.",
  "DELETE /bot/mensagens/:messageId/reacoes/:emoji": "Tira a reação do bot.",
};

const CORPOS = {
  "PUT /bot/comandos": "definirComandosInput",
  "POST /bot/canais/:channelId/mensagens": "sendMessageInput sem channelId e nonce",
  "PATCH /bot/mensagens/:messageId": "editMessageInput sem messageId",
  "PUT /bot/mensagens/:messageId/reacoes/:emoji": "{ burst?: boolean }",
};

const fonte = await readFile(ROTAS, "utf8");

const rotas = [...fonte.matchAll(/app\.(get|post|patch|put|delete)\(\s*"([^"]+)"/g)].map(
  ([, metodo, caminho]) => ({ metodo: metodo.toUpperCase(), caminho }),
);

if (!rotas.length) {
  console.error("\n  Não achei rota nenhuma no bot-api.ts. O formato mudou?\n");
  process.exit(1);
}

const semDescricao = rotas
  .map(({ metodo, caminho }) => `${metodo} ${caminho}`)
  .filter((chave) => !DESCRICOES[chave]);

if (semDescricao.length) {
  console.error(
    `\n  Rota nova na API sem entrada na documentação:\n\n` +
      semDescricao.map((r) => `    ${r}`).join("\n") +
      `\n\n  Descreva em apps/landing/scripts/gerar-referencia.mts e rode de novo.\n`,
  );
  process.exit(1);
}

const rest = rotas.map(({ metodo, caminho }) => {
  const chave = `${metodo} ${caminho}`;

  return {
    metodo,
    caminho,
    descricao: DESCRICOES[chave],
    corpo: CORPOS[chave] ?? null,
    parametros: [...caminho.matchAll(/:(\w+)/g)].map(([, nome]) => nome),
  };
});

const eventos = Object.entries(clientEventSchemas).map(([nome, schema]) => {
  const json = z.toJSONSchema(schema, { io: "input" });
  const obrigatorios = new Set(json.required ?? []);

  return {
    nome,
    campos: Object.entries(json.properties ?? {}).map(([campo, tipo]) => ({
      nome: campo,
      tipo: tipo.type ?? (tipo.anyOf ? "vários" : "objeto"),
      obrigatorio: obrigatorios.has(campo),
      limite: tipo.maxLength ?? tipo.maximum ?? null,
    })),
  };
});

await mkdir(dirname(SAIDA), { recursive: true });
await writeFile(SAIDA, `${JSON.stringify({ rest, eventos }, null, 2)}\n`);

console.log(
  `referência: ${rest.length} rotas e ${eventos.length} eventos em src/dados/referencia.json`,
);
