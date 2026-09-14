import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

function aindaERodando(pid, script) {
  try {
    const comando = execFileSync("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return comando.includes(script);
  } catch {
    return false;
  }
}

export function instanciaUnica(nome) {
  const arquivo = join(tmpdir(), `gravae-${nome}.pid`);
  const script = basename(process.argv[1] ?? nome);

  try {
    const dono = Number.parseInt(readFileSync(arquivo, "utf8").trim(), 10);

    if (Number.isInteger(dono) && dono !== process.pid && aindaERodando(dono, script)) {
      console.error(
        `Já tem um "${nome}" no ar (PID ${dono}).\n` +
          `Dois ao mesmo tempo fazem o bot responder duas vezes a cada comando.\n` +
          `Para derrubar o antigo:  kill ${dono}`,
      );
      process.exit(1);
    }
  } catch {
  }

  writeFileSync(arquivo, String(process.pid));

  process.on("exit", () => {
    try {
      if (readFileSync(arquivo, "utf8").trim() === String(process.pid)) unlinkSync(arquivo);
    } catch {
    }
  });

  for (const sinal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(sinal, () => process.exit(0));
  }
}
