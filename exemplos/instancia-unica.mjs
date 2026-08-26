/**
 * Uma instância só, por bot.
 *
 * Rodar `node bot.mjs` duas vezes não dá erro nenhum: os dois entram no
 * gateway com o mesmo token, os dois leem a mesma mensagem, e o bot responde
 * em dobro. Nada no console diz o que está acontecendo — a gente perde tempo
 * procurando o problema no código antes de lembrar do terminal esquecido
 * atrás da janela.
 *
 * A trava é um arquivo com o PID na pasta temporária do sistema. Zero
 * dependência, some no `reboot`, e o processo que sair limpa o seu.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

/**
 * Aquele PID ainda é o bot?
 *
 * `process.kill(pid, 0)` só diz que EXISTE alguém com esse número. Depois de
 * uma queda de energia o arquivo fica para trás e o sistema reaproveita o
 * número para outra coisa qualquer — aí a trava barraria um bot que ninguém
 * está rodando. Por isso a segunda pergunta: o comando desse processo é mesmo
 * este script?
 *
 * A comparação é pelo NOME do arquivo, não pelo caminho: o `ps` devolve a
 * linha como foi digitada — `node bot.mjs` —, enquanto o `process.argv[1]`
 * já vem resolvido em caminho absoluto. Os dois nunca batem inteiros.
 */
function aindaERodando(pid, script) {
  try {
    const comando = execFileSync("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return comando.includes(script);
  } catch {
    /// `ps` sai com código 1 quando não existe processo com aquele PID.
    return false;
  }
}

/**
 * Trava o nome para este processo, ou desiste com uma explicação.
 *
 * Chame no topo do bot, antes de abrir o socket — a graça é não chegar a
 * conectar.
 */
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
    /// Sem arquivo, ou com lixo dentro: é a primeira vez, ou sobrou de um
    /// processo morto. Nos dois casos o caminho é seguir e reescrever.
  }

  writeFileSync(arquivo, String(process.pid));

  /*
    Limpar na saída.

    `exit` cobre a saída normal e o `process.exit()`. Os sinais não: quem
    escuta um sinal tira do Node o comportamento padrão de morrer, então cada
    um precisa terminar a saída na mão — e é o `process.exit()` deles que
    dispara o `exit` acima.

    Um `kill -9` não passa por aqui. Fica o arquivo órfão, que o próximo
    `aindaERodando` descarta.
  */
  process.on("exit", () => {
    try {
      if (readFileSync(arquivo, "utf8").trim() === String(process.pid)) unlinkSync(arquivo);
    } catch {
      /// Alguém já apagou. Ótimo.
    }
  });

  for (const sinal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(sinal, () => process.exit(0));
  }
}
