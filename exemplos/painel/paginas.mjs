import { ESTILO } from "./estilo.mjs";

const escapar = (texto = "") =>
  String(texto).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const NOME = "Gravaê Music";

const moldura = (titulo, corpo, { topo = true, usuario = null } = {}) => `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(titulo)}</title>
<style>${ESTILO}</style>
</head><body>
${
  topo
    ? `<header class="topo">
        <a class="marca" href="/">Gravaê <span>Music</span></a>
        <nav>
          <a href="/#comandos">Comandos</a>
          <a href="/painel">Painel</a>
          ${usuario ? `<a href="/sair">Sair (${escapar(usuario)})</a>` : `<a class="botao pequeno" href="/entrar">Entrar</a>`}
        </nav>
      </header>`
    : ""
}
${corpo}
</body></html>`;

const COMANDOS = [
  { nome: "play", uso: "play <música ou link>", texto: "Toca no seu canal de voz. Se já tem algo tocando, entra na fila." },
  { nome: "skip", uso: "skip", texto: "Pula a música atual e vai pra próxima da fila." },
  { nome: "stop", uso: "stop", texto: "Para tudo, limpa a fila e sai do canal." },
  { nome: "fila", uso: "fila", texto: "Mostra o que está tocando e o que vem depois." },
];

// ── a capa ──────────────────────────────────────────────────────────────
export const landing = ({ usuario, linkDeConvite }) =>
  moldura(
    `${NOME} — música no seu servidor`,
    `<main>
      <section class="capa">
        <span class="selo">bot de música</span>
        <h1>Música no seu <span>servidor</span></h1>
        <p>
          Toca do YouTube direto no canal de voz, com fila, controle de volume e
          boas-vindas. Configure tudo por aqui — sem comando decorado.
        </p>
        <div class="acoes">
          <a class="botao" href="${linkDeConvite}">Adicionar ao meu servidor</a>
          <a class="botao fantasma" href="/painel">Abrir o painel</a>
        </div>
      </section>

      <section class="secao" id="comandos">
        <h2>Comandos</h2>
        <p class="sub">O prefixo é seu — troque no painel se <code>!</code> não servir.</p>
        <div class="grade">
          ${COMANDOS.map(
            (c) => `<div class="cartao">
              <code>!${escapar(c.uso)}</code>
              <p>${escapar(c.texto)}</p>
            </div>`,
          ).join("")}
        </div>
      </section>

      <section class="secao">
        <h2>O que dá pra configurar</h2>
        <p class="sub">Cada servidor com as suas regras, num painel só.</p>
        <div class="grade">
          <div class="cartao"><h3>Prefixo e canal</h3><p>Escolha o símbolo dos comandos e prenda o bot a um canal, se quiser.</p></div>
          <div class="cartao"><h3>Volume e fila</h3><p>Volume padrão e quantas músicas cabem na fila antes de recusar.</p></div>
          <div class="cartao"><h3>Boas-vindas</h3><p>Uma mensagem quando alguém entra, com o nome da pessoa.</p></div>
          <div class="cartao"><h3>Anúncios</h3><p>Ligue ou desligue o aviso de "tocando agora" no chat.</p></div>
        </div>
      </section>

      <footer class="rodape">
        Exemplo de plataforma para bots do Gravaê · <code>exemplos/painel</code>
      </footer>
    </main>`,
    { usuario },
  );

// ── entrar ──────────────────────────────────────────────────────────────
export const precisaEntrar = () =>
  moldura(
    "Entrar",
    `<main class="centro"><div class="caixa">
      <h1 style="font-size:22px">Entre para configurar</h1>
      <p style="color:var(--texto-fraco);margin:12px 0 22px">
        Use sua conta do Gravaê. A gente só vê seu nome e em quais servidores você manda.
      </p>
      <a class="botao" href="/entrar" style="width:100%;justify-content:center">Entrar com o Gravaê</a>
    </div></main>`,
    { topo: false },
  );

// ── escolher servidor ───────────────────────────────────────────────────
export const listaDeServidores = ({ usuario, servidores, linkDeConvite }) => {
  const gerencia = servidores.filter((g) => g.gerencia);

  const icone = (g) =>
    g.iconUrl
      ? `<img class="icone" src="${escapar(g.iconUrl)}" alt="">`
      : `<span class="icone">${escapar(g.name.slice(0, 2))}</span>`;

  return moldura(
    "Escolha um servidor",
    `<main class="secao">
      <h2>Seus servidores</h2>
      <p class="sub">
        ${gerencia.length} de ${servidores.length} você gerencia. Só esses podem receber o bot.
      </p>

      <div class="servidores">
        ${
          gerencia
            .map(
              (g) => `<div class="linha">
                ${icone(g)}
                <b>${escapar(g.name)}<small>${g.owner ? "Dono" : "Administrador"}</small></b>
                ${
                  g.temOBot
                    ? `<a class="botao pequeno" href="/painel/${g.id}">Configurar</a>`
                    : `<a class="botao pequeno fantasma" href="${linkDeConvite}">Adicionar</a>`
                }
              </div>`,
            )
            .join("") ||
          `<div class="vazio">
            <p>Você não gerencia nenhum servidor ainda.</p>
            <p>Crie um no Gravaê, ou peça pra quem manda te dar “Gerenciar servidor”.</p>
          </div>`
        }
      </div>
    </main>`,
    { usuario },
  );
};

// ── o painel de um servidor ─────────────────────────────────────────────
const SECOES = [
  { grupo: "Bot", itens: [["geral", "Visão geral"], ["musica", "Música"]] },
  { grupo: "Comunidade", itens: [["boas-vindas", "Boas-vindas"]] },
];

const lateral = (guild, atual) => `
  <aside class="lateral">
    <div class="servidor">
      ${
        guild.iconUrl
          ? `<img class="icone" style="width:34px;height:34px" src="${escapar(guild.iconUrl)}" alt="">`
          : `<span class="icone" style="width:34px;height:34px;font-size:12px">${escapar(guild.name.slice(0, 2))}</span>`
      }
      <div><b>${escapar(guild.name)}</b><small>${guild.temOBot ? "bot ativo" : "sem o bot"}</small></div>
    </div>

    <a class="item" href="/painel">← Trocar de servidor</a>

    ${SECOES.map(
      (s) => `<div class="grupo">${s.grupo}</div>
        ${s.itens
          .map(
            ([id, rotulo]) =>
              `<a class="item ${atual === id ? "ativo" : ""}" href="/painel/${guild.id}/${id}">${rotulo}</a>`,
          )
          .join("")}`,
    ).join("")}
  </aside>`;

const salvar = (mensagem = "Alterações não salvas são perdidas ao sair.", extra = "") => `
  <div class="barra-salvar">
    <span>${mensagem}</span>
    ${extra}
    <button class="botao" name="acao" value="salvar">Salvar</button>
  </div>`;

/*
  O botão de testar.

  Manda a mensagem de verdade, no canal escolhido, pela API REST do bot — é o
  jeito de descobrir que o bot não pode escrever ali ANTES de alguém entrar no
  servidor e a mensagem não sair. Salva junto: testar o texto antigo enquanto
  você olha para o novo na tela seria pior que não testar.
*/
const botaoDeTeste = `
  <button class="botao fantasma" name="acao" value="testar">Salvar e testar</button>`;

export const painelDoServidor = ({ usuario, guild, secao, config, canais, salvo, recado }) => {
  const opcoesDeCanal = (escolhido, vazio) =>
    [`<option value="">${vazio}</option>`]
      .concat(
        canais.map(
          (c) =>
            `<option value="${c.id}" ${c.id === escolhido ? "selected" : ""}>#${escapar(c.name)}</option>`,
        ),
      )
      .join("");

  const corpos = {
    geral: `
      <h1>Visão geral</h1>
      <p class="sub">Como o bot está neste servidor.</p>

      ${
        guild.temOBot
          ? ""
          : `<div class="aviso">
              <b>O bot ainda não está aqui.</b> As configurações ficam guardadas, mas nada acontece
              enquanto ele não entrar no servidor.
            </div>`
      }

      <div class="grade">
        <div class="cartao"><h3>Prefixo</h3><p><code>${escapar(config.prefixo)}</code> — ex.: <code>${escapar(config.prefixo)}play</code></p></div>
        <div class="cartao"><h3>Volume padrão</h3><p>${config.volume}%</p></div>
        <div class="cartao"><h3>Fila máxima</h3><p>${config.filaMaxima} músicas</p></div>
        <div class="cartao"><h3>Boas-vindas</h3><p>${config.boasVindasLigadas ? "Ligadas" : "Desligadas"}</p></div>
      </div>`,

    musica: `
      <h1>Música</h1>
      <p class="sub">Como o bot se comporta ao tocar.</p>

      <form method="post">
        <div class="campo">
          <label for="prefixo">Prefixo dos comandos</label>
          <input type="text" id="prefixo" name="prefixo" maxlength="3" value="${escapar(config.prefixo)}">
          <small>O que vem antes do comando. Com <code>!</code>, o comando é <code>!play</code>.</small>
        </div>

        <div class="campo">
          <label for="canalDeComandos">Canal dos comandos</label>
          <select id="canalDeComandos" name="canalDeComandos">
            ${opcoesDeCanal(config.canalDeComandos, "Qualquer canal")}
          </select>
          <small>Escolhendo um canal, o bot ignora comandos em todos os outros.</small>
        </div>

        <div class="campo">
          <label for="volume">Volume padrão (%)</label>
          <input type="number" id="volume" name="volume" min="10" max="150" value="${config.volume}">
        </div>

        <div class="campo">
          <label for="filaMaxima">Fila máxima</label>
          <input type="number" id="filaMaxima" name="filaMaxima" min="1" max="500" value="${config.filaMaxima}">
          <small>Passando disso, o bot recusa em vez de aceitar uma fila infinita.</small>
        </div>

        <div class="campo interruptor">
          <div class="texto">
            <b>Anunciar a música no chat</b>
            <small>O “▶️ tocando agora” a cada faixa.</small>
          </div>
          <input type="hidden" name="anunciarMusica__presente" value="1">
          <input type="checkbox" class="chave" name="anunciarMusica" ${config.anunciarMusica ? "checked" : ""}>
        </div>

        ${salvar(salvo ? "Salvo." : "Mexeu em algo? Salve antes de sair.")}
      </form>`,

    "boas-vindas": `
      <h1>Boas-vindas</h1>
      <p class="sub">Uma mensagem quando alguém entra no servidor.</p>

      <form method="post">
        <div class="campo interruptor">
          <div class="texto">
            <b>Mandar boas-vindas</b>
            <small>O bot precisa poder escrever no canal escolhido.</small>
          </div>
          <input type="hidden" name="boasVindasLigadas__presente" value="1">
          <input type="checkbox" class="chave" name="boasVindasLigadas" ${config.boasVindasLigadas ? "checked" : ""}>
        </div>

        <div class="campo">
          <label for="boasVindasCanal">Canal</label>
          <select id="boasVindasCanal" name="boasVindasCanal">
            ${opcoesDeCanal(config.boasVindasCanal, "Escolha um canal")}
          </select>
          <small>Sem canal, a mensagem não é enviada.</small>
        </div>

        <div class="campo">
          <label for="boasVindasTexto">Mensagem</label>
          <textarea id="boasVindasTexto" name="boasVindasTexto" maxlength="400">${escapar(config.boasVindasTexto)}</textarea>
          <small>
            <code>{pessoa}</code> marca quem entrou · <code>{nome}</code> só o nome ·
            <code>{servidor}</code> · <code>{prefixo}</code>
          </small>
        </div>

        ${salvar(recado ?? (salvo ? "Salvo." : "Mexeu em algo? Salve antes de sair."), botaoDeTeste)}
      </form>`,
  };

  return moldura(
    `${guild.name} — ${NOME}`,
    `<div class="painel">
      ${lateral(guild, secao)}
      <main class="conteudo">${corpos[secao] ?? corpos.geral}</main>
    </div>`,
    { topo: false, usuario },
  );
};

export const erro = (titulo, texto) =>
  moldura(
    titulo,
    `<main class="centro"><div class="caixa">
      <h1 style="font-size:22px">${escapar(titulo)}</h1>
      <p style="color:var(--texto-fraco);margin:12px 0 22px">${escapar(texto)}</p>
      <a class="botao fantasma" href="/" style="width:100%;justify-content:center">Voltar ao início</a>
    </div></main>`,
    { topo: false },
  );
