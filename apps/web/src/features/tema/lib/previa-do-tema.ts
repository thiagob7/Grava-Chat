/*
  A prévia de um tema é o próprio tema rodando, não um retrato dele.

  Roda dentro de um iframe porque tema mexe em `:root`, `body` e nos
  pseudo-elementos do `html` — não dá para escopar isso num `div` sem
  reescrever o CSS inteiro, e reescrever mentiria sobre o resultado. O iframe
  entrega o mesmo documento que o tema vai encontrar quando for instalado.

  O `sandbox` vazio corta script. E o `@import` sai fora: ele puxaria CSS de
  um servidor de terceiro só por alguém ter passado o olho na galeria, e
  ninguém pediu isso ainda — quem instala é avisado, quem só navega não.
*/
const IMPORTACAO = /@import\s+[^;]+;/gi;

const BASE = `
:root {
  --color-surface-0: var(--background-primary, #1a181e);
  --color-surface-1: var(--background-secondary, #1a181e);
  --color-surface-2: var(--background-secondary-lighter, #1e1d23);
  --color-surface-3: var(--guild-list-foreground, #232028);
  --color-line: var(--border-color, rgb(201 197 211 / 0.15));
  --color-composer: var(--composer-surface-color, #1e1d23);
  --color-cabecalho: var(--background-channel-header, #1e1d23);
  --color-painel: var(--background-secondary-alt, #232028);
  --color-ink: var(--text-chat, #f4f4f6);
  --color-ink-muted: var(--text-chat-muted, #cecbd4);
  --color-ink-faint: var(--text-tertiary-muted, #b1acbb);
  --color-brand: var(--accent-primary, #413cdd);
}
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; overflow: hidden; }
body {
  font: 13px system-ui, sans-serif;
  color: var(--color-ink);
  background: var(--color-surface-0);
}
.linha-do-app { display: flex; height: 100%; }
.lista-de-comunidades {
  width: 44px; padding: 8px 0; display: flex; flex-direction: column;
  align-items: center; gap: 7px; background: var(--color-surface-1);
}
.bolha { width: 28px; height: 28px; border-radius: 10px; background: var(--color-surface-3); }
.coluna { width: 128px; display: flex; flex-direction: column; }
.lista-de-canais { flex: 1; padding: 9px 6px; background: var(--color-surface-2); }
.canal { padding: 3px 6px; border-radius: 4px; font-size: 11px; color: var(--color-ink-muted); }
.canal.aqui { background: var(--color-surface-3); color: var(--color-ink); }
.area-do-usuario { padding: 6px; background: var(--color-surface-1); }
.cartao-do-usuario {
  display: flex; gap: 6px; align-items: center; padding: 5px;
  border-radius: 7px; background: var(--color-painel);
}
.miolo { flex: 1; display: flex; flex-direction: column; background: var(--color-surface-0); }
.topo-do-canal {
  height: 30px; display: flex; align-items: center; padding: 0 11px;
  font-size: 11px; font-weight: 600;
  background: var(--color-cabecalho); border-bottom: 1px solid var(--color-line);
}
.lista-de-mensagens { flex: 1; padding: 11px; }
.recado { display: flex; gap: 8px; margin-bottom: 9px; }
.retrato { width: 24px; height: 24px; border-radius: 50%; background: var(--color-surface-3); flex: none; }
.quem { font-size: 11px; font-weight: 600; color: var(--color-brand); }
.dito { font-size: 11px; color: var(--color-ink-muted); }
.caixa-de-escrever {
  margin: 0 11px 11px; padding: 7px 10px; border-radius: 7px;
  font-size: 11px; color: var(--color-ink-faint); background: var(--color-composer);
}
.lista-de-membros { width: 108px; padding: 9px 6px; background: var(--color-surface-2); }
.membro { display: flex; gap: 6px; align-items: center; padding: 3px 5px; font-size: 11px; color: var(--color-ink-muted); }
.ponto { width: 18px; height: 18px; border-radius: 50%; background: var(--color-surface-3); }
`;

const CORPO = `
<div class="linha-do-app">
  <div class="lista-de-comunidades"><div class="bolha"></div><div class="bolha"></div><div class="bolha"></div></div>
  <div class="coluna">
    <div class="lista-de-canais">
      <div class="canal aqui"># geral</div>
      <div class="canal"># avisos</div>
      <div class="canal"># temas</div>
    </div>
    <div class="area-do-usuario">
      <div class="cartao-do-usuario"><div class="ponto"></div><div>você</div></div>
    </div>
  </div>
  <div class="miolo">
    <div class="topo-do-canal"># geral</div>
    <div class="lista-de-mensagens">
      <div class="recado"><div class="retrato"></div><div><div class="quem">Alguém</div><div class="dito">é assim que o tema fica</div></div></div>
      <div class="recado"><div class="retrato"></div><div><div class="quem">Você</div><div class="dito">dá para ler por cima do fundo</div></div></div>
    </div>
    <div class="caixa-de-escrever">Conversar em #geral</div>
  </div>
  <div class="lista-de-membros">
    <div class="membro"><div class="ponto"></div>Alguém</div>
    <div class="membro"><div class="ponto"></div>Você</div>
  </div>
</div>`;

export function documentoDaPrevia(css: string, substituicoes: Record<string, string>): string {
  const tokens = Object.entries(substituicoes)
    .map(([nome, valor]) => `  ${nome}: ${valor};`)
    .join("\n");

  return [
    '<meta name="referrer" content="no-referrer">',
    "<style>",
    BASE,
    tokens ? `:root {\n${tokens}\n}` : "",
    css.replace(IMPORTACAO, ""),
    "</style>",
    CORPO,
  ].join("\n");
}
