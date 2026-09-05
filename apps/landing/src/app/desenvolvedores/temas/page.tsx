import type { Metadata } from "next";

import { Codigo } from "~/components/docs/Codigo";
import { Adiante, Aviso, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import { APP } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Temas — Documentação do Gravaê",
  description:
    "Escrever um tema para o Gravaê: o cabeçalho do arquivo, os tokens de cor, os ganchos que cada elemento carrega e o que muda a forma da tela.",
};

const CABECALHO = `/**
 * @name Papel e tinta
 * @description Um tema claro, de pouco contraste, para quem lê o dia inteiro.
 * @author você
 * @version 1.0.0
 * @tags claro, sóbrio
 */`;

const CORES = `:root {
  --color-surface-0: #f6f4ef;
  --color-surface-1: #efece4;
  --color-surface-2: #f6f4ef;
  --color-ink: #1f1c17;
  --color-ink-muted: #575146;
  --color-brand: #8a5a2b;
}`;

const GANCHO = `/* Toda foto de pessoa vira quadrada. */
.avatar,
.avatar img {
  border-radius: 4px;
}

/* Só o botão de apagar da barra da mensagem. */
[data-gc="conversa.message-item.acao-da-barra.apagar"] {
  color: #b4232a;
}`;

const FORMA = `:root {
  --layout-sidebar-width: 13rem;
  --layout-member-list-width: 12rem;
  --layout-header-height: 2.5rem;
}`;

const REGIOES: { classe: string; oQueE: string }[] = [
  { classe: "trilho-de-servidores", oQueE: "a coluna estreita dos ícones, na ponta esquerda" },
  { classe: "lista-de-canais", oQueE: "a barra com os canais do servidor" },
  { classe: "lista-de-conversas", oQueE: "a barra das mensagens diretas" },
  { classe: "lista-de-comunidades", oQueE: "a barra do Explorar" },
  { classe: "lista-de-membros", oQueE: "a coluna da direita, com quem está online" },
  { classe: "topo-do-canal", oQueE: "a faixa com o nome do canal" },
  { classe: "area-de-conversa", oQueE: "o miolo inteiro, onde as mensagens rolam" },
  { classe: "lista-de-mensagens", oQueE: "só a parte que rola" },
  { classe: "barra-da-mensagem", oQueE: "os botões que aparecem ao passar o mouse" },
  { classe: "caixa-de-escrever", oQueE: "a caixa de escrever" },
  { classe: "area-do-usuario", oQueE: "a faixa inteira do rodapé, que passa sob o trilho" },
  { classe: "painel-do-usuario", oQueE: "o seu cartão, dentro dessa faixa" },
  { classe: "avatar", oQueE: "toda foto de pessoa, em qualquer tamanho" },
  { classe: "janela", oQueE: "qualquer modal" },
  { classe: "menu", oQueE: "os menus de clique direito e de três pontos" },
  { classe: "balao", oQueE: "os popovers" },
  { classe: "dica", oQueE: "as dicas de passar o mouse" },
];

const GRUPOS_DE_COR: { grupo: string; exemplos: string; oQuePinta: string }[] = [
  {
    grupo: "Superfícies",
    exemplos: "--color-surface-0 … --color-surface-4",
    oQuePinta: "os fundos, do mais fundo ao de menu; --color-hover e --color-selecionado moram aqui",
  },
  {
    grupo: "Texto",
    exemplos: "--color-ink, --color-ink-muted, --color-ink-faint",
    oQuePinta: "as três forças de texto, do título ao carimbo de hora",
  },
  {
    grupo: "Marca e realces",
    exemplos: "--color-brand, --color-brand-hover",
    oQuePinta: "botão principal, links, o traço do que está selecionado",
  },
  {
    grupo: "Status",
    exemplos: "--color-online, --color-ausente, --color-ocupado",
    oQuePinta: "a bolinha do avatar e as etiquetas de presença",
  },
  {
    grupo: "Mensagens",
    exemplos: "--message-hover-background, --message-mention-background",
    oQuePinta: "o fundo de cada mensagem, o da que menciona você e o da que responde",
  },
  {
    grupo: "Formulários",
    exemplos: "--color-campo, --color-campo-foco",
    oQuePinta: "campos de texto, seletores e o traço do foco",
  },
  {
    grupo: "Código e terminal",
    exemplos: "--code-background, --code-keyword, --code-string",
    oQuePinta: "os blocos de código e o realce de sintaxe dentro deles",
  },
];

export default function Temas() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Referência" pagina="Temas" />
        <Titulo chamada="Um tema do Gravaê é um arquivo CSS. Esta página diz o que existe para mirar: as cores, os ganchos em cada elemento e as medidas que dão a forma da tela.">
          Temas
        </Titulo>
      </header>

      <Secao id="arquivo" titulo="O arquivo">
        <p>
          Um tema é um <code>.css</code> comum. O que o transforma num tema é o bloco no topo,
          que diz quem ele é — o mesmo formato que o BetterDiscord e o Fluxer usam, então um
          arquivo escrito para eles se apresenta certo aqui.
        </p>

        <Codigo legenda="papel-e-tinta.css">{CABECALHO}</Codigo>

        <p>
          Só o <code>@name</code> importa; o resto é opcional. Sem o bloco o CSS continua
          valendo, ele só entra sem nome no estúdio. Para instalar, abra{" "}
          <strong className="text-ink">Configurações → Aparência → Estúdio de temas</strong> e
          arraste o arquivo — ou uma pasta inteira, que vira uma biblioteca com um tema ativo
          por vez. O botão <strong className="text-ink">Abrir em janela</strong> tira o estúdio do
          modal e o põe numa janela ao lado, com o app vivo atrás: o que você digita pinta na hora.
        </p>
      </Secao>

      <Secao id="cores" titulo="As cores">
        <p>
          São 511 tokens em 21 grupos, e todos são variáveis CSS no <code>:root</code>. Mudar a
          cara do app é redeclarar as que interessam — quase sempre uma dúzia resolve, porque o
          resto é derivado.
        </p>

        <p>
          Vale saber que <strong className="text-ink">78 deles são os que o app realmente lê</strong>
          . Os outros vieram da camada de referência e ainda não estão ligados em lugar nenhum:
          mexer neles não muda nada. O estúdio marca quais são quais e tem um filtro para mostrar
          só os que valem.
        </p>

        <Codigo legenda="as seis que mais mudam a cara">{CORES}</Codigo>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="py-2 pr-4 font-semibold">Grupo</th>
                <th className="py-2 pr-4 font-semibold">Exemplos</th>
                <th className="py-2 font-semibold">O que pinta</th>
              </tr>
            </thead>

            <tbody>
              {GRUPOS_DE_COR.map((linha) => (
                <tr key={linha.grupo} className="border-b border-line/60 align-top">
                  <td className="py-2.5 pr-4 font-medium text-ink">{linha.grupo}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-ink-muted">{linha.exemplos}</td>
                  <td className="py-2.5 text-ink-muted">{linha.oQuePinta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          A lista inteira, com o valor de cada uma e um seletor de cor ao lado, está na aba{" "}
          <strong className="text-ink">Cores</strong> do estúdio. É de lá que sai o{" "}
          <strong className="text-ink">Exportar</strong>, que já escreve o arquivo com o
          cabeçalho pronto.
        </p>
      </Secao>

      <Secao id="ganchos" titulo="Os ganchos">
        <p>
          Cor é metade. Para mexer em forma — arredondamento, densidade, esconder um botão — o
          tema precisa alcançar o elemento, e as classes que o Tailwind gera não servem: mudam a
          cada build e não dizem o que a coisa é.
        </p>

        <p>
          Por isso cada elemento do app carrega um <code>data-gc</code> com o caminho de onde ele
          está: de que tela vem, o que ele é e o que ele faz. São 4764 deles, estáveis entre
          builds. E as regiões grandes têm, além disso, um nome curto de classe.
        </p>

        <Codigo legenda="tema.css">{GANCHO}</Codigo>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="py-2 pr-4 font-semibold">Classe</th>
                <th className="py-2 font-semibold">Que pedaço da tela</th>
              </tr>
            </thead>

            <tbody>
              {REGIOES.map((regiao) => (
                <tr key={regiao.classe} className="border-b border-line/60 align-top">
                  <td className="py-2.5 pr-4 font-mono text-xs text-ink">.{regiao.classe}</td>
                  <td className="py-2.5 text-ink-muted">{regiao.oQueE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Para achar o <code>data-gc</code> de um botão específico, a gaveta{" "}
          <strong className="text-ink">Em que dá para mexer</strong>, no pé do editor de CSS do
          estúdio, tem busca nos 4764 — e clicar joga o seletor pronto no editor.
        </p>
      </Secao>

      <Secao id="forma" titulo="A forma da tela">
        <p>
          Largura das laterais, largura da lista de membros e altura do topo saem de tokens, e
          um tema pode trocá-los.
        </p>

        <Codigo legenda="uma interface mais apertada">{FORMA}</Codigo>

        <p>
          E os raios de canto saem de <code>--radius-sm</code> a <code>--radius-full</code>.
          Zerar os seis tira o arredondamento do app inteiro de uma vez, avatares inclusive.
        </p>

        <Aviso>
          As laterais também são arrastáveis. Quem já arrastou fica com a largura que escolheu, e
          o tema não desfaz isso — a pessoa mandou. O valor do token vale para quem nunca mexeu,
          e o arrastar passa a ir até onde o tema pediu.
        </Aviso>
      </Secao>

      <Secao id="fluxer" titulo="Trazendo um tema do Fluxer">
        <p>
          Temas do Fluxer funcionam aqui, e por dois caminhos. As variáveis atravessam: o estúdio
          lê o que o arquivo declarou e escreve nos nomes de cá — o{" "}
          <code>--background-secondary</code> deles é o nosso <code>--color-surface-1</code>, e
          mais cinquenta pares assim. E o vocabulário deles existe na nossa camada de tokens, então
          um tema que <em>lê</em> <code>--status-online</code> ou <code>--transition-fast</code>{" "}
          também acha o que procura.
        </p>

        <p>
          O outro caminho é a estrutura. Um tema pesado quase não pinta variável: ele mira lugar da
          tela, pelo nome de classe que o build deles gera —{" "}
          <code>[class*=&quot;GuildNavbar.module__guildNavbarContainer_&quot;]</code> — e pelo{" "}
          <code>data-flx</code>. É de lá que saem as bordas por painel, o espaço entre eles, o
          hover na borda e os rótulos. Esses nomes não descrevem código deles: descrevem um lugar,
          e o lugar existe aqui igual, então{" "}
          <strong className="text-ink">os nossos elementos carregam os mesmos nomes</strong>. São
          34 lugares mapeados.
        </p>

        <p>
          O que continua sem efeito é o que um tema faz mirando pedaço que só existe lá — um painel
          nosso que não tem equivalente, ou o contrário. Para isso é que serve o{" "}
          <code>data-gc</code>.
        </p>
      </Secao>

      <Secao id="exemplo" titulo="Um tema de exemplo">
        <p>
          O <strong className="text-ink">Reto</strong> é um tema nosso escrito para servir de
          modelo: tira o arredondamento, aperta a interface e troca a paleta, usando um trecho de
          cada coisa que esta página descreve — token de cor, token de forma, classe de região e{" "}
          <code>data-gc</code>. Cada bloco está comentado.
        </p>

        <p>
          <a
            href={`${APP}/temas/reto.css`}
            className="text-brand transition hover:text-brand-hover"
            download
          >
            Baixar reto.css
          </a>{" "}
          e arrastar para o estúdio.
        </p>
      </Secao>

      <Secao id="compartilhar" titulo="Compartilhar">
        <p>
          <strong className="text-ink">Exportar</strong> baixa o arquivo. E o botão{" "}
          <strong className="text-ink">Publicar</strong> devolve um link do tipo{" "}
          <code>{APP}/temas/…</code>, que colado em qualquer canal vira um cartão com o nome, a
          descrição e um botão de importar — quem clica recebe o tema no próprio estúdio.
        </p>
      </Secao>

      <Secao id="seguranca" titulo="O que um tema pode fazer">
        <Aviso>
          O CSS de um tema roda inteiro, sem caixa de areia: <code>@import</code> e{" "}
          <code>url()</code> de fora funcionam. Isso significa que um tema pode avisar um servidor
          de terceiros toda vez que você abrir o app, e pode desenhar por cima da interface. Só
          importe tema de gente em quem você confia, e leia o arquivo antes se ele veio de um
          link.
        </Aviso>
      </Secao>

      <Adiante href="/desenvolvedores/temas" />
    </article>
  );
}
