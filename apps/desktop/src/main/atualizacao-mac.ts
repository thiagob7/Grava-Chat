import { spawn } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export async function prepararNoMac(dmg: string, versaoEsperada: string): Promise<string> {
  const montado = await comando("hdiutil", ["attach", "-nobrowse", "-readonly", dmg]);
  const ponto = montado
    .split("\n")
    .map((linha) => linha.match(/(\/Volumes\/.+)$/)?.[1]?.trim())
    .filter(Boolean)
    .pop();

  if (!ponto) throw new Error("Não consegui montar o arquivo baixado.");

  try {
    const origem = path.join(ponto, "Gravae Chat.app");
    await access(origem, constants.R_OK);

    const plist = await readFile(path.join(origem, "Contents", "Info.plist"), "utf8");
    const identificador = plist.match(
      /<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/,
    )?.[1];
    const versao = plist.match(
      /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/,
    )?.[1];

    if (identificador !== "io.gravae.chat") throw new Error("O app baixado não é o Gravaê.");
    if (versao !== versaoEsperada) {
      throw new Error(`O app baixado diz ${versao}, e a release diz ${versaoEsperada}.`);
    }

    const guardado = path.join(path.dirname(dmg), "Gravae Chat.app");
    await comando("ditto", [origem, guardado]);
    await comando("xattr", ["-dr", "com.apple.quarantine", guardado]).catch(() => "");

    return guardado;
  } finally {
    await comando("hdiutil", ["detach", ponto, "-quiet"]).catch(() => "");
  }
}

export async function escreverTroca(pacote: string, novo: string): Promise<string> {
  const roteiro = path.join(path.dirname(novo), "trocar.sh");

  await writeFile(
    roteiro,
    `#!/bin/sh
set -e

# espera o app fechar de verdade (no máximo 30s)
for _ in $(seq 1 60); do
  pgrep -f ${JSON.stringify(`${pacote}/Contents/MacOS/`)} >/dev/null 2>&1 || break
  sleep 0.5
done

ANTIGO=${JSON.stringify(`${pacote}.antigo`)}
rm -rf "$ANTIGO"
mv ${JSON.stringify(pacote)} "$ANTIGO"

if ditto ${JSON.stringify(novo)} ${JSON.stringify(pacote)}; then
  rm -rf "$ANTIGO"
else
  # deu errado: devolve o que estava lá antes
  rm -rf ${JSON.stringify(pacote)}
  mv "$ANTIGO" ${JSON.stringify(pacote)}
fi

open ${JSON.stringify(pacote)}
rm -rf ${JSON.stringify(path.dirname(novo))}
`,
    { mode: 0o755 },
  );

  return roteiro;
}

function comando(programa: string, argumentos: string[]): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const processo = spawn(programa, argumentos);
    let saida = "";
    let erro = "";

    processo.stdout.on("data", (d) => (saida += d));
    processo.stderr.on("data", (d) => (erro += d));
    processo.on("error", rejeitar);
    processo.on("close", (codigo) =>
      codigo === 0 ? resolver(saida) : rejeitar(new Error(erro.trim() || `${programa} falhou`)),
    );
  });
}
