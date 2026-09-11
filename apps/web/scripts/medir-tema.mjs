import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORTA = 9333;

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const LOOK = [
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

async function cdp(ws, method, params = {}, id = { n: 0 }) {
  const call = ++id.n;
  ws.send(JSON.stringify({ id: call, method: method, params }));

  return new Promise((ok, failed) => {
    const listen = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id !== call) return;
      ws.removeEventListener("message", listen);
      msg.error ? failed(new Error(`${method}: ${msg.error.message}`)) : ok(msg.result);
    };
    ws.addEventListener("message", listen);
    setTimeout(() => failed(new Error(`${method}: sem resposta em 30s`)), 30_000);
  });
}

async function wait(condition, howMuch = 20_000, step = 200) {
  const until = Date.now() + howMuch;
  while (Date.now() < until) {
    try {
      const r = await condition();
      if (r) return r;
    } catch {
    }
    await new Promise((r) => setTimeout(r, step));
  }
  return null;
}

const PAINTS = [
  "backgroundColor",
  "backgroundImage",
  "color",
  "borderColor",
  "outlineColor",
  "boxShadow",
  "borderRadius",
  "fontFamily",
];

function byHookUnique(list) {
  const times = new Map();
  for (const e of list) times.set(e.hook, (times.get(e.hook) ?? 0) + 1);

  return new Map(list.filter((e) => times.get(e.hook) === 1).map((e) => [e.hook, e]));
}

function difference(a, b, everything = false) {
  const before = byHookUnique(a);
  const after = byHookUnique(b);
  const look = everything ? LOOK : PAINTS;
  const lines = [];

  for (const [hook, now] of after) {
    const was = before.get(hook);
    if (!was) continue;

    const changed = look.filter((p) => was.style[p] !== now.style[p]);
    if (!changed.length) continue;

    lines.push(`~ ${hook}`);
    for (const p of changed) lines.push(`    ${p.padEnd(16)} ${was.style[p]}  →  ${now.style[p]}`);
  }

  return { lines, compared: [...after].filter(([g]) => before.has(g)).length };
}

if (process.argv.includes("--diff")) {
  const i = process.argv.indexOf("--diff");
  const a = JSON.parse(readFileSync(process.argv[i + 1], "utf8"));
  const b = JSON.parse(readFileSync(process.argv[i + 2], "utf8"));
  const { lines, compared } = difference(a.elements, b.elements, process.argv.includes("--tudo"));
  const count = lines.filter((l) => l.startsWith("~")).length;

  console.log(
    lines.length
      ? `${count} de ${compared} elementos mudaram\n\n${lines.join("\n")}`
      : `nada mudou em ${compared} elementos comparados`,
  );

  process.exit(0);
}

const profile = mkdtempSync(join(tmpdir(), "gc-medir-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORTA}`,
    `--user-data-dir=${profile}`,
    "--window-size=1920,1080",
    "--no-first-run",
    "--disable-gpu",
  ],
  { stdio: "ignore" },
);

let ended = false;

const end = () => {
  if (ended) return;
  ended = true;
  chrome.kill();

  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      return;
    } catch {
    }
  }
};
process.on("exit", end);

try {
  const version = await wait(() => fetch(`http://127.0.0.1:${PORTA}/json/version`).then((r) => r.json()));
  if (!version) throw new Error("o Chrome não abriu a porta de depuração");

  const url = arg("--url", "http://localhost:5173");
  const tab = await fetch(`http://127.0.0.1:${PORTA}/json/new?${encodeURIComponent(url)}`, {
    method: "PUT",
  }).then((r) => r.json());

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));

  const id = { n: 0 };
  const run = (expr) =>
    cdp(ws, "Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }, id)
      .then((r) => r.result.value);

  await cdp(ws, "Runtime.enable", {}, id);
  await cdp(ws, "Page.enable", {}, id);

  const email = arg("--email", "thbp777@gmail.com");
  const joined = await run(`
    fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: ${JSON.stringify(email)} }),
    }).then((r) => r.status)
  `);

  if (joined !== 200) throw new Error(`o login de desenvolvimento devolveu ${joined}`);

  const themePath = arg("--tema");
  const css = themePath ? readFileSync(themePath, "utf8") : "";
  await run(`
    (() => {
      const chave = "gravae:estudio";
      const atual = JSON.parse(localStorage.getItem(chave) ?? "{}");
      localStorage.setItem(chave, JSON.stringify({ ...atual, css: ${JSON.stringify(css)}, ativoId: null }));
      return true;
    })()
  `);

  await cdp(ws, "Page.navigate", { url }, id);

  const built = await wait(
    () => run(`document.querySelectorAll("[data-gc]").length > ${arg("--minimo", "80")}`),
    25_000,
    500,
  );

  if (!built) throw new Error("o app não montou a tempo");

  const appTheme = arg("--tema-do-app");
  if (appTheme) {
    await run(
      `document.documentElement.setAttribute("data-tema", ${JSON.stringify(appTheme)}), true`,
    );
  }

  await new Promise((r) => setTimeout(r, 2500));

  const filter = arg("--gancho", "");
  const elements = await run(`
    (() => {
      const olhar = ${JSON.stringify(LOOK)};
      const filtro = ${JSON.stringify(filter)};
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

  const photo = arg("--foto");
  if (photo) {
    const { data } = await cdp(ws, "Page.captureScreenshot", { format: "png" }, id);
    writeFileSync(photo, Buffer.from(data, "base64"));
    console.log(`foto → ${photo}`);
  }

  if (!elements?.length) throw new Error("nenhum elemento medido — o app carregou?");

  const measure = { url, theme: themePath, when: new Date().toISOString(), elements };
  const output = arg("--saida");

  if (output) {
    writeFileSync(output, `${JSON.stringify(measure, null, 2)}\n`);
    console.log(`${elements.length} elementos medidos → ${output}`);
  } else {
    for (const e of elements.slice(0, 40))
      console.log(
        `${e.hook.padEnd(52)} <${e.tag}> ${e.box[2]}x${e.box[3]}  ${e.style.backgroundColor}`,
      );
    console.log(`\n${elements.length} elementos medidos (use --saida para o JSON inteiro)`);
  }
} finally {
  end();
}
