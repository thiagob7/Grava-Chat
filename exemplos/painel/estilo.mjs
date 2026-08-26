/**
 * O CSS da plataforma, num arquivo só.
 *
 * Vive em JS e não num `.css` porque o exemplo inteiro roda com `node
 * servidor.mjs`, sem build e sem servir arquivo estático: quem clonar o
 * repositório tem um site de pé no primeiro comando.
 */
export const ESTILO = /* css */ `
:root {
  --fundo: #0e0e10;
  --superficie: #17171a;
  --superficie-2: #1e1e22;
  --linha: #2a2a30;
  --texto: #e8e8ec;
  --texto-fraco: #a1a1aa;
  --texto-apagado: #6b6b76;
  --marca: #d30404;
  --marca-clara: #ff3b3b;
  --ok: #17c964;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--fundo);
  color: var(--texto);
  font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }
h1, h2, h3 { line-height: 1.2; margin: 0; }

/* ── barra de cima ────────────────────────────────────────────────────── */
.topo {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: 20px;
  padding: 14px 28px;
  background: rgba(14, 14, 16, .85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--linha);
}
.topo .marca { font-weight: 800; font-size: 17px; letter-spacing: -.3px; }
.topo .marca span { color: var(--marca-clara); }
.topo nav { display: flex; gap: 18px; margin-left: auto; align-items: center; font-size: 14px; }
.topo nav a { color: var(--texto-fraco); transition: color .15s; }
.topo nav a:hover { color: var(--texto); }

/* ── botões ───────────────────────────────────────────────────────────── */
.botao, button.botao {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--marca); color: #fff;
  border: 0; border-radius: 10px;
  padding: 11px 20px;
  font: 600 14px/1 inherit;
  cursor: pointer;
  transition: filter .15s, transform .05s;
}
.botao:hover { filter: brightness(1.15); }
.botao:active { transform: translateY(1px); }
.botao.fantasma { background: var(--superficie-2); color: var(--texto); border: 1px solid var(--linha); }
.botao.pequeno { padding: 8px 14px; font-size: 13px; }

/* ── a capa ───────────────────────────────────────────────────────────── */
.capa {
  position: relative; overflow: hidden;
  padding: 90px 28px 110px;
  text-align: center;
  background:
    radial-gradient(900px 420px at 50% -10%, rgba(211, 4, 4, .28), transparent 70%),
    linear-gradient(180deg, #141416, var(--fundo));
}
.capa h1 { font-size: clamp(38px, 7vw, 68px); font-weight: 850; letter-spacing: -1.5px; }
.capa h1 span { color: var(--marca-clara); }
.capa p { max-width: 560px; margin: 18px auto 30px; color: var(--texto-fraco); font-size: 17px; }
.capa .acoes { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

.selo {
  display: inline-block; margin-bottom: 20px;
  padding: 5px 14px; border-radius: 999px;
  background: rgba(211, 4, 4, .12); border: 1px solid rgba(211, 4, 4, .3);
  color: var(--marca-clara); font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .8px;
}

/* ── grades ───────────────────────────────────────────────────────────── */
.secao { max-width: 1000px; margin: 0 auto; padding: 64px 28px; }
.secao > h2 { font-size: 28px; margin-bottom: 8px; letter-spacing: -.5px; }
.secao > p.sub { color: var(--texto-fraco); margin: 0 0 28px; }

.grade { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }

.cartao {
  background: var(--superficie);
  border: 1px solid var(--linha);
  border-radius: 14px;
  padding: 20px;
  transition: border-color .15s, transform .15s;
}
.cartao:hover { border-color: #3a3a44; }
.cartao h3 { font-size: 16px; margin-bottom: 6px; }
.cartao p { margin: 0; color: var(--texto-fraco); font-size: 14px; }
.cartao code {
  display: inline-block; margin-bottom: 8px;
  background: var(--superficie-2); border: 1px solid var(--linha);
  border-radius: 6px; padding: 3px 9px;
  font: 600 13px/1.4 ui-monospace, monospace; color: var(--marca-clara);
}

/* ── o painel ─────────────────────────────────────────────────────────── */
.painel { display: flex; min-height: 100dvh; }

.lateral {
  width: 260px; flex-shrink: 0;
  background: var(--superficie);
  border-right: 1px solid var(--linha);
  padding: 20px 12px;
  display: flex; flex-direction: column;
}
.lateral .servidor {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; margin-bottom: 16px;
  background: var(--superficie-2); border-radius: 10px;
}
.lateral .servidor b { font-size: 14px; }
.lateral .servidor small { display: block; color: var(--texto-apagado); font-size: 12px; }

.lateral .grupo {
  margin: 18px 0 6px; padding: 0 12px;
  color: var(--texto-apagado); font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .8px;
}
.lateral a.item {
  display: block; padding: 9px 12px; border-radius: 8px;
  color: var(--texto-fraco); font-size: 14px;
  transition: background .12s, color .12s;
}
.lateral a.item:hover { background: var(--superficie-2); color: var(--texto); }
.lateral a.item.ativo { background: rgba(211, 4, 4, .14); color: var(--marca-clara); font-weight: 600; }

.conteudo { flex: 1; padding: 36px 40px; max-width: 780px; }
.conteudo h1 { font-size: 26px; margin-bottom: 6px; letter-spacing: -.4px; }
.conteudo > p.sub { color: var(--texto-fraco); margin: 0 0 28px; }

/* ── formulário ───────────────────────────────────────────────────────── */
.campo { margin-bottom: 22px; }
.campo > label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; }
.campo > small { display: block; margin-top: 6px; color: var(--texto-apagado); font-size: 12.5px; }

input[type=text], input[type=number], textarea, select {
  width: 100%;
  background: var(--superficie-2);
  color: var(--texto);
  border: 1px solid var(--linha);
  border-radius: 9px;
  padding: 11px 13px;
  font: inherit;
  transition: border-color .15s;
}
input:focus, textarea:focus, select:focus { outline: none; border-color: #52525b; }
textarea { resize: vertical; min-height: 84px; }

.interruptor { display: flex; align-items: center; gap: 12px; justify-content: space-between; }
.interruptor .texto b { display: block; font-size: 14px; }
.interruptor .texto small { color: var(--texto-apagado); font-size: 12.5px; }

input[type=checkbox].chave { appearance: none; width: 42px; height: 24px; border-radius: 999px; background: var(--linha); position: relative; cursor: pointer; transition: background .15s; flex-shrink: 0; }
input[type=checkbox].chave::after { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .15s; }
input[type=checkbox].chave:checked { background: var(--ok); }
input[type=checkbox].chave:checked::after { transform: translateX(18px); }

.barra-salvar {
  position: sticky; bottom: 20px;
  display: flex; align-items: center; gap: 14px;
  margin-top: 30px; padding: 14px 18px;
  background: var(--superficie); border: 1px solid var(--linha);
  border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,.5);
}
.barra-salvar span { flex: 1; font-size: 13.5px; color: var(--texto-fraco); }

/* ── lista de servidores ──────────────────────────────────────────────── */
.servidores { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
.servidores .linha {
  display: flex; align-items: center; gap: 14px;
  background: var(--superficie); border: 1px solid var(--linha);
  border-radius: 12px; padding: 14px 16px;
  transition: border-color .15s;
}
.servidores .linha:hover { border-color: #3a3a44; }
.servidores .linha b { flex: 1; font-size: 15px; }
.servidores .linha small { display: block; color: var(--texto-apagado); font-size: 12px; font-weight: 400; }

.icone {
  width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
  display: grid; place-items: center;
  background: var(--superficie-2); color: var(--texto-fraco);
  font-weight: 700; font-size: 14px; text-transform: uppercase;
  object-fit: cover;
}

.aviso {
  display: flex; gap: 10px; align-items: flex-start;
  background: rgba(211, 4, 4, .1); border: 1px solid rgba(211, 4, 4, .3);
  border-radius: 10px; padding: 12px 14px; margin-bottom: 22px;
  font-size: 13.5px; color: var(--texto-fraco);
}

.vazio { text-align: center; padding: 60px 20px; color: var(--texto-apagado); }

.centro { min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
.caixa { width: 100%; max-width: 420px; background: var(--superficie); border: 1px solid var(--linha); border-radius: 16px; padding: 32px; text-align: center; }

.rodape { border-top: 1px solid var(--linha); padding: 28px; text-align: center; color: var(--texto-apagado); font-size: 13px; }

@media (max-width: 780px) {
  .painel { flex-direction: column; }
  .lateral { width: auto; border-right: 0; border-bottom: 1px solid var(--linha); }
  .conteudo { padding: 24px 20px; }
}
`;
