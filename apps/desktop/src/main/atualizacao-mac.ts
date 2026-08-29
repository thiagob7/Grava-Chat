import { spawn } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

/*
  Tira o app de dentro do .dmg e deixa pronto para entrar no lugar do atual.

  Três cuidados que não são opcionais:

  - `ditto` em vez de `cp`: preserva links simbólicos, permissões e a assinatura
    do pacote. Um `cp -r` produz um app que o macOS recusa abrir.
  - Confere identificador e versão ANTES de aceitar. O arquivo veio da nossa
    release por HTTPS, mas trocar o app instalado por algo que a gente não
    verificou seria confiar demais numa resposta de rede.
  - Tira a quarentena. Todo download ganha essa marca, e com assinatura ad-hoc
    ela faz o Gatekeeper barrar a abertura — a mesma janela chata da primeira
    instalação apareceria a cada atualização.
*/
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

/*
  O roteiro que faz a troca depois que o app morre.

  Precisa ser um processo de FORA: ninguém apaga o próprio pacote enquanto está
  rodando dentro dele. E precisa ter volta — se a cópia falhar no meio, o app
  antigo volta pro lugar. Sem isso, uma queda de energia na hora errada deixa a
  pessoa sem aplicativo nenhum.
*/
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
