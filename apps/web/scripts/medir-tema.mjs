/*
  Mede o app rodando, em vez de adivinhar pelo fonte.

  Todos os erros de tema que passaram por aqui foram invisíveis para as
  ferramentas que leem código: uma classe do Tailwind roubando uma regra do
  tema, dois nomes da referência no mesmo elemento matando 35 regras de uma vez,
  uma chave com o padrão invertido. Contar nome dizia "217 de 312 pousam"
  enquanto a tela estava errada. Quem pegou os três foi um print.

  Este script abre o app num Chrome de verdade, aplica um tema, e anota o que
  o navegador REALMENTE calculou para cada elemento carimbado. Aí "faltou
  estilização" vira uma linha de diferença, não uma impressão.

  Sem dependência nova: usa o Chrome que já está instalado e conversa com ele
  por CDP, com o `WebSocket` que o Node já traz. O disco desta máquina não tem
  espaço para um Chromium do Playwright, e nem precisa.

  Rodar (com o `yarn dev` de pé):
    node scripts/medir-tema.mjs --saida /tmp/sem.json
    node scripts/medir-tema.mjs --tema ~/Downloads/Galaxy.css --saida /tmp/com.json
    node scripts/medir-tema.mjs --diff /tmp/sem.json /tmp/com.json
    node scripts/medir-tema.mjs --tema … --gancho app.rodape   só o que casa
    node scripts/medir-tema.mjs --tema … --foto /tmp/tela.png  a tela renderizada
*/
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORTA = 9333;

const arg = (nome, padrao = null) => {
  const i = process.argv.indexOf(nome);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
};

/*
  As propriedades que um tema mexe. A lista é curta de propósito: despejar o
  `getComputedStyle` inteiro dá 340 linhas por elemento e some com a diferença
  que importa no meio do ruído.
*/
const OLHAR = [
  "backgroundColor",
  "backgroundImage",
  "color",
  "borderColor",
  "borderWidth",
  "borderRadius",
  "outlineColor",
  "outlineWidth",
  "boxShadow",
  "opacity",
  "fontFamily",
  "fontSize",
  "padding",
  "margin",
  "display",
  "width",
  "height",
];

async function cdp(ws, metodo, params = {}, id = { n: 0 }) {
  const chamada = ++id.n;
  ws.send(JSON.stringify({ id: chamada, method: metodo, params }));

  return new Promise((ok, falhou) => {
    const ouvir = (evento) => {
      const msg = JSON.parse(evento.data);
      if (msg.id !== chamada) return;
      ws.removeEventListener("message", ouvir);
      msg.error ? falhou(new Error(`${metodo}: ${msg.error.message}`)) : ok(msg.result);
    };
    ws.addEventListener("message", ouvir);
    setTimeout(() => falhou(new Error(`${metodo}: sem resposta em 30s`)), 30_000);
  });
}

async function esperar(condicao, quanto = 20_000, passo = 200) {
  const ate = Date.now() + quanto;
  while (Date.now() < ate) {
    try {
      const r = await condicao();
      if (r) return r;
    } catch {
      /* ainda não */
    }
    await new Promise((r) => setTimeout(r, passo));
  }
  return null;
}

/*
  A comparação olha COR primeiro, e só em elemento que aparece uma vez de cada
  lado.

  Duas medições do mesmo app não são idênticas: o canal selecionado muda, um
  tooltip abre, a contagem de elementos oscila. Comparando tudo, esse ruído
  afogava a diferença de verdade — a primeira rodada acusou 44 elementos
  "mudados" e nenhum era cor.
*/
const PINTA = [
  "backgroundColor",
  "backgroundImage",
  "color",
  "borderColor",
  "outlineColor",
  "boxShadow",
  "borderRadius",
  "fontFamily",
];

function porGanchoUnico(lista) {
  const vezes = new Map();
  for (const e of lista) vezes.set(e.gancho, (vezes.get(e.gancho) ?? 0) + 1);

  return new Map(lista.filter((e) => vezes.get(e.gancho) === 1).map((e) => [e.gancho, e]));
}

function diferenca(a, b, tudo = false) {
  const antes = porGanchoUnico(a);
  const depois = porGanchoUnico(b);
  const olhar = tudo ? OLHAR : PINTA;
  const linhas = [];

  for (const [gancho, agora] of depois) {
    const era = antes.get(gancho);
    if (!era) continue;

    const mudou = olhar.filter((p) => era.estilo[p] !== agora.estilo[p]);
    if (!mudou.length) continue;

    linhas.push(`~ ${gancho}`);
    for (const p of mudou) linhas.push(`    ${p.padEnd(16)} ${era.estilo[p]}  →  ${agora.estilo[p]}`);
  }

  return { linhas, comparados: [...depois].filter(([g]) => antes.has(g)).length };
}

if (process.argv.includes("--diff")) {
  const i = process.argv.indexOf("--diff");
  const a = JSON.parse(readFileSync(process.argv[i + 1], "utf8"));
  const b = JSON.parse(readFileSync(process.argv[i + 2], "utf8"));
  const { linhas, comparados } = diferenca(a.elementos, b.elementos, process.argv.includes("--tudo"));
  const quantos = linhas.filter((l) => l.startsWith("~")).length;

  console.log(
    linhas.length
      ? `${quantos} de ${comparados} elementos mudaram\n\n${linhas.join("\n")}`
      : `nada mudou em ${comparados} elementos comparados`,
  );

  process.exit(0);
}

const perfil = mkdtempSync(join(tmpdir(), "gc-medir-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORTA}`,
    `--user-data-dir=${perfil}`,
    "--window-size=1920,1080",
    "--no-first-run",
    "--disable-gpu",
  ],
  { stdio: "ignore" },
);

let encerrado = false;

/// O Chrome ainda escreve no perfil por um instante depois do kill.
const encerrar = () => {
  if (encerrado) return;
  encerrado = true;
  chrome.kill();

  for (let tentativa = 0; tentativa < 20; tentativa++) {
    try {
      rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      return;
    } catch {
      /* ainda escrevendo */
    }
  }
};
process.on("exit", encerrar);

try {
  const versao = await esperar(() => fetch(`http://127.0.0.1:${PORTA}/json/version`).then((r) => r.json()));
  if (!versao) throw new Error("o Chrome não abriu a porta de depuração");

  const url = arg("--url", "http://localhost:5173");
  const aba = await fetch(`http://127.0.0.1:${PORTA}/json/new?${encodeURIComponent(url)}`, {
    method: "PUT",
  }).then((r) => r.json());

  const ws = new WebSocket(aba.webSocketDebuggerUrl);
  await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));

  const id = { n: 0 };
  const rodar = (expr) =>
    cdp(ws, "Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }, id)
      .then((r) => r.result.value);

  await cdp(ws, "Runtime.enable", {}, id);
  await cdp(ws, "Page.enable", {}, id);

  /*
    Entra com o login de desenvolvimento — sem sessão a tela é a de entrar, e
    já perdi uma medição inteira fotografando a tela de login sem perceber.
    Por isso o status é conferido, não torcido.
  */
  const email = arg("--email", "thbp777@gmail.com");
  const entrou = await rodar(`
    fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: ${JSON.stringify(email)} }),
    }).then((r) => r.status)
  `);

  if (entrou !== 200) throw new Error(`o login de desenvolvimento devolveu ${entrou}`);

  /// O tema entra pelo mesmo caminho do estúdio: a chave do localStorage.
  const caminhoDoTema = arg("--tema");
  const css = caminhoDoTema ? readFileSync(caminhoDoTema, "utf8") : "";
  await rodar(`
    (() => {
      const chave = "gravae:estudio";
      const atual = JSON.parse(localStorage.getItem(chave) ?? "{}");
      localStorage.setItem(chave, JSON.stringify({ ...atual, css: ${JSON.stringify(css)}, ativoId: null }));
      return true;
    })()
  `);

  await cdp(ws, "Page.navigate", { url }, id);

  /*
    Espera a casca montar em vez de contar até seis. O app monta em tempos
    diferentes conforme a máquina, e medir cedo demais devolve a tela de
    carregamento — que não é a que interessa.
  */
  const montou = await esperar(
    () => rodar(`document.querySelectorAll("[data-gc]").length > ${arg("--minimo", "80")}`),
    25_000,
    500,
  );

  if (!montou) throw new Error("o app não montou a tempo");

  /*
    O tema DO APP — escuro, mais escuro, claro, gravaê — é outra dimensão do
    tema importado, e as duas se cruzam. Medir só o padrão deixava as variantes
    sem prova.
  */
  const temaDoApp = arg("--tema-do-app");
  if (temaDoApp) {
    await rodar(
      `document.documentElement.setAttribute("data-tema", ${JSON.stringify(temaDoApp)}), true`,
    );
  }

  /// Um respiro para a fonte do tema e as animações assentarem.
  await new Promise((r) => setTimeout(r, 2500));

  const filtro = arg("--gancho", "");
  const elementos = await rodar(`
    (() => {
      const olhar = ${JSON.stringify(OLHAR)};
      const filtro = ${JSON.stringify(filtro)};
      const saida = [];

      for (const el of document.querySelectorAll("[data-gc]")) {
        const gancho = el.getAttribute("data-gc");
        if (filtro && !gancho.includes(filtro)) continue;

        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) continue;

        const c = getComputedStyle(el);
        const estilo = {};
        for (const p of olhar) estilo[p] = c[p];

        saida.push({
          gancho,
          tag: el.tagName.toLowerCase(),
          caixa: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
          estilo,
        });
      }

      return saida;
    })()
  `);

  /*
    A foto sai do mesmo canal. Não é enfeite: com ela eu vejo a tela que você vê,
    em vez de pedir print e adivinhar pelo que dá para ler numa imagem comprimida.
  */
  const foto = arg("--foto");
  if (foto) {
    const { data } = await cdp(ws, "Page.captureScreenshot", { format: "png" }, id);
    writeFileSync(foto, Buffer.from(data, "base64"));
    console.log(`foto → ${foto}`);
  }

  if (!elementos?.length) throw new Error("nenhum elemento medido — o app carregou?");

  const medida = { url, tema: caminhoDoTema, quando: new Date().toISOString(), elementos };
  const saida = arg("--saida");

  if (saida) {
    writeFileSync(saida, `${JSON.stringify(medida, null, 2)}\n`);
    console.log(`${elementos.length} elementos medidos → ${saida}`);
  } else {
    for (const e of elementos.slice(0, 40))
      console.log(
        `${e.gancho.padEnd(52)} <${e.tag}> ${e.caixa[2]}x${e.caixa[3]}  ${e.estilo.backgroundColor}`,
      );
    console.log(`\n${elementos.length} elementos medidos (use --saida para o JSON inteiro)`);
  }
} finally {
  encerrar();
}
