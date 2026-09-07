import { create } from "zustand";

import existeNaReferencia from "~/features/configuracoes/lib/existe-na-referencia.json";

import { lerCabecalhoDoTema } from "@gravae/shared";

import {
  CORRECOES_DE_TEMA,
  pareceTemaDeFora,
} from "~/features/configuracoes/lib/correcoes-de-tema";
import { resolverAtivos } from "~/features/configuracoes/lib/ativos-do-tema";
import {
  completarComDerivacao,
  montarTema,
} from "~/features/configuracoes/lib/cores-mae";
import {
  ID_DO_ESCUDO,
  cssDoEscudo,
  medirBase,
} from "~/features/configuracoes/lib/escudo-do-estudio";
import { avisarTemaAplicado } from "~/features/configuracoes/lib/evento-de-tema";
import {
  traduzirSeletoresTravados,
  filtrarRegrasMortas,
} from "~/features/configuracoes/lib/normalizar-tema";
import { temaDesligadoPelaUrl } from "~/features/configuracoes/lib/saida-de-emergencia";
import {
  NOMES_DE_ORIGEM,
  nomesDeclaradosNoTema,
  traduzirTema,
} from "~/features/configuracoes/lib/ponte-de-tema";

export interface TemaSalvo {
  id: string;
  nome: string;
  /// Saem do cabeçalho do CSS quando o tema vem de um arquivo.
  autor?: string | null;
  versao?: string | null;
  descricao?: string | null;
  tags?: string[];
  substituicoes: Record<string, string>;
  /// As quatro cores-mãe escolhidas, e o que a pessoa mexeu à mão.
  coresMae?: Record<string, string>;
  saturacao?: number;
  manuais?: Record<string, string>;
  css: string;
  /*
    Se este tema entra como está escrito, sem tradução de nome.

    Ausente é o normal, e quer dizer "decida por mim": o app olha o arquivo e
    escolhe — veja `deveTraduzir` no `normalizar-tema.ts`. Só vira `true` ou
    `false` quando alguém mexe na chave, e aí a escolha manda.
  */
  aRisca?: boolean | null;
  /// Só as regras que pegam no app da referência hoje. `null` = o padrão do app (ligado).
  soOQueExisteLa?: boolean | null;
}

export interface AtivoDoTema {
  id: string;
  nome: string;
  url: string;
  tipo: string;
}

interface EstadoDoEstudio {
  /*
    O que vale de verdade na tela. NÃO é escrito à mão: sai de `coresMae` +
    `manuais` toda vez que um dos dois muda. Continua guardado porque o script
    anti-piscada do `index.html` lê exatamente isto, antes do app existir.
  */
  substituicoes: Record<string, string>;
  /// Qual cor cada mãe está pintando. Vazio é o tema base.
  coresMae: Record<string, string>;
  /// Multiplica a saturação de tudo que é derivado. 1 é como foi medido.
  saturacao: number;
  /// O que a pessoa mexeu token a token. Vence a derivação, sempre.
  manuais: Record<string, string>;
  css: string;
  biblioteca: TemaSalvo[];
  ativos: AtivoDoTema[];
  /// Qual tema da biblioteca está valendo agora. Null é o tema base.
  ativoId: string | null;
  /*
    A escolha de quem está com CSS colado à mão, sem tema da biblioteca ativo.

    `null` é o padrão e quer dizer "decida por mim". Ligada, o arquivo entra
    exatamente como foi escrito — que é o que o `useCustomThemeStyle` da referência
    faz. Desligada, a gente traduz o que o build de quem escreveu datou.
  */
  aRisca: boolean | null;
  soOQueExisteLa: boolean | null;
}

interface EstudioStore extends EstadoDoEstudio {
  definirToken: (nome: string, valor: string | null) => void;
  definirCorMae: (id: string, valor: string | null) => void;
  definirSaturacao: (fator: number) => void;
  definirCss: (css: string) => void;
  salvarNaBiblioteca: (nome: string) => void;
  aplicarDaBiblioteca: (id: string) => void;
  apagarDaBiblioteca: (id: string) => void;
  importar: (tema: { substituicoes?: Record<string, string>; css?: string; nome?: string }) => void;
  importarCssComoTema: (css: string, nomeDoArquivo?: string) => string;
  atualizarNaBiblioteca: (id: string, dados: Partial<Omit<TemaSalvo, "id">>) => void;
  duplicarDaBiblioteca: (id: string) => void;
  alternarTema: (id: string) => void;
  definirARisca: (aRisca: boolean) => void;
  definirSoOQueExisteLa: (ligado: boolean) => void;
  importarBiblioteca: (temas: TemaSalvo[]) => void;
  guardarAtivo: (ativo: Omit<AtivoDoTema, "id">) => void;
  apagarAtivo: (id: string) => void;
  limparSubstituicoes: () => void;
  limparTudo: () => void;
}

const CHAVE = "gravae:estudio";

/// Só existe quando há outra janela para avisar.
let canal: BroadcastChannel | null = null;
const VAZIO: EstadoDoEstudio = {
  substituicoes: {},
  coresMae: {},
  saturacao: 1,
  manuais: {},
  css: "",
  biblioteca: [],
  ativos: [],
  ativoId: null,
  aRisca: null,
  soOQueExisteLa: null,
};

function ler(): EstadoDoEstudio {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (!salvo) return VAZIO;

    const guardado = JSON.parse(salvo) as Partial<EstadoDoEstudio>;

    /*
      Quem já tinha tema salvo não tinha `manuais`: naquele desenho tudo que
      estava em `substituicoes` fora escolhido a dedo. Continua sendo verdade
      — e é o que preserva o tema de quem atualizar o app com um em uso.
    */
    /*
      O `aRisca` nasceu desligado e virou ligado no mesmo dia, depois de
      comparar tema a tema com a referência. Quem guardou o `false` guardou o meu
      padrão de então, não uma escolha — e nenhum tema da biblioteca tinha a
      chave própria ainda. Nesse caso ele volta ao padrão de hoje; assim que
      alguém mexer na chave, a escolha passa a valer e não é mais tocada.
    */
    const escolheuARisca = (guardado.biblioteca ?? []).some((t) => t.aRisca !== undefined);

    return {
      ...VAZIO,
      ...guardado,
      manuais: guardado.manuais ?? guardado.substituicoes ?? {},
      aRisca: escolheuARisca ? (guardado.aRisca ?? null) : null,
    };
  } catch {
    return VAZIO;
  }
}

/// Voltar ao tema base: sem mãe, sem mexida à mão, saturação como foi medida.
const SEM_TEMA = { coresMae: {}, saturacao: 1, manuais: {} };

/*
  Um tema salvo antes das cores-mãe só tem `substituicoes`. Ele continua
  valendo: tudo que ele traz entra como escolha à mão.
*/
function doTema(tema: TemaSalvo) {
  return {
    coresMae: { ...(tema.coresMae ?? {}) },
    saturacao: tema.saturacao ?? 1,
    manuais: { ...(tema.manuais ?? tema.substituicoes) },
  };
}

const ID_DO_ESTILO = "gc-estudio-css";
const ID_DAS_CORRECOES = "gc-correcoes-de-tema";

/*
  A janela do estúdio não veste o tema.

  Um tema pode esconder botão, zerar contraste, tirar borda — e é justo, é o
  trabalho dele. Só que se ele fizer isso na própria oficina, a pessoa fica sem
  como desfazer o que acabou de escrever.

  Então a janela do estúdio fica neutra e a janela do app veste. As duas
  compartilham o estado; quem pinta é só a de trás, que é justamente a que se
  quer ver mudando.
*/
const ehAJanelaDoEstudio = () =>
  typeof window !== "undefined" && window.location.pathname === "/estudio";

let escritos = new Set<string>();

function aplicar(estado: EstadoDoEstudio) {
  const raiz = document.documentElement;

  for (const nome of escritos) {
    if (!(nome in estado.substituicoes)) raiz.style.removeProperty(nome);
  }

  escritos = new Set(Object.keys(estado.substituicoes));

  /*
    A janela do estúdio nunca veste o tema, e `?sem-tema` desliga em qualquer
    janela — é a saída para quando um tema esconde o caminho de volta.
  */
  if (ehAJanelaDoEstudio() || temaDesligadoPelaUrl()) {
    avisarTemaAplicado();
    return;
  }

  for (const [nome, valor] of Object.entries(estado.substituicoes)) {
    raiz.style.setProperty(nome, valor);
  }

  /*
    A saturação virou CSS.

    Ela nasceu como número de JavaScript, dentro do `derivar()`: cada filha saía
    da mãe já com a saturação embutida no valor. Só que a referência resolve isso na
    folha — 86 variáveis da base dele passam por `calc(x% * var(--saturation-factor))`,
    e o `base-de-tema.css` trouxe essa cadeia para cá. Escrever a propriedade faz
    o app inteiro reagir, e não só as filhas das quatro mães.

    Só quando alguém mexeu de verdade: valor embutido na raiz vence a folha do
    tema, então no padrão a gente cala a boca e deixa o arquivo mandar — um tema
    da referência pode declarar `--saturation-factor` e tem o direito de valer.
  */
  if (estado.saturacao === 1) raiz.style.removeProperty("--saturation-factor");
  else raiz.style.setProperty("--saturation-factor", String(estado.saturacao));

  let estilo = document.getElementById(ID_DO_ESTILO);
  if (!estilo) {
    estilo = document.createElement("style");
    estilo.id = ID_DO_ESTILO;
    document.head.appendChild(estilo);
  }

  /*
    A tag do seletor entra intocada — a nossa árvore usa as mesmas da referência, e
    reescrever faria o tema pegar onde lá não pega. Só o hash é traduzido, e só
    com a chave desligada; o porquê está no `normalizar-tema.ts`.

    O `gc-ativo("x")` vira endereço aqui de qualquer jeito, com a lista de
    ativos em mãos — eles fazem o mesmo com a biblioteca de temas deles.
  */
  /*
    Quem escolheu, manda. Quem não escolheu, o arquivo decide: um tema que é
    quase só hash não tem como entrar "como está" — como está, ele é nada.
  */
  const doAtivo = estado.biblioteca.find((t) => t.id === estado.ativoId);
  const escolha = doAtivo ? doAtivo.aRisca : estado.aRisca;

  /*
    Traduzir é o padrão, sempre. A conta dos 70% decidia "à risca" para tema
    com pouco hash — e foi assim que o Galaxy ficou meses sem pintar a lateral:
    as cinco regras presas a hash dele eram justamente a lateral e o trilho.

    Traduzir nunca tira uma regra que pousaria: um hash nunca casa com o nosso
    `_gc`, e um `div` na frente só deixa de casar com `aside`, `nav`, `header`.
    A chave "à risca" continua existindo para quem quiser, mas é escolha, não
    padrão. O `deveTraduzir` fica só para o estúdio mostrar o custo.
  */
  const aRisca = escolha ?? false;

  /*
    "Só o que existe lá hoje" — ligado por padrão. É o que faz o tema aparecer
    aqui como aparece no app da referência: as regras que lá morreram (nome de
    um build antigo) morrem aqui também. Desligado, o arquivo vale inteiro, e um
    tema escrito para a casca antiga pinta tudo que carregamos dela.
  */
  const escolhaDeExistir = doAtivo ? doAtivo.soOQueExisteLa : estado.soOQueExisteLa;
  const soOQueExisteLa = escolhaDeExistir ?? true;
  const cssVisto = soOQueExisteLa ? filtrarRegrasMortas(estado.css, existeNaReferencia) : estado.css;

  const resolvido = resolverAtivos(
    aRisca ? cssVisto : traduzirSeletoresTravados(cssVisto),
    estado.ativos,
  );

  faltandoAgora = resolvido.faltando;
  estilo.textContent = resolvido.css;

  /*
    Depois da folha do tema, senão não corrige nada: aqui é a última palavra
    sobre o que a nossa árvore mede.
  */
  let correcoes = document.getElementById(ID_DAS_CORRECOES);

  if (pareceTemaDeFora(estado.css)) {
    if (!correcoes) {
      correcoes = document.createElement("style");
      correcoes.id = ID_DAS_CORRECOES;
      document.head.appendChild(correcoes);
    }

    correcoes.textContent = CORRECOES_DE_TEMA;
  } else {
    correcoes?.remove();
  }

  aplicarPonte(estado);
  aplicarEscudo();
  avisarTemaAplicado();
}

/*
  O escudo entra por ÚLTIMO, depois da folha do tema e das correções.
  `!important` contra `!important` empata na especificidade, e quem chega
  depois ganha — então a ordem aqui é a regra, não um detalhe.
*/
/*
  Os arquivos que o CSS pediu e não existem. Fica aqui, e não no estado, porque
  é resultado de aplicar — quem grava não precisa saber, quem olha a aba Ativos
  precisa. `avisarTemaAplicado()` avisa a tela de que mudou.
*/
let faltandoAgora: string[] = [];

export const ativosFaltando = () => faltandoAgora;

let escudoDe: string | null = null;

function aplicarEscudo() {
  /*
    A base só muda quando muda a VARIANTE — claro, escuro, Gravaê. Escrever no
    editor de CSS chama isto a cada tecla, e medir de novo obrigaria o
    navegador a recalcular estilo a cada letra digitada.
  */
  const variante = document.documentElement.dataset.tema ?? "";
  if (escudoDe === variante) return;

  let escudo = document.getElementById(ID_DO_ESCUDO);

  if (!escudo) {
    escudo = document.createElement("style");
    escudo.id = ID_DO_ESCUDO;
  }

  escudo.textContent = cssDoEscudo(medirBase(ID_DO_ESTILO));
  document.head.appendChild(escudo);
  escudoDe = variante;
}

/*
  Trocar de variante muda a base inteira, e a marca `data-tema` é escrita
  depois que este módulo carrega — então o escudo precisa ser refeito quando
  ela chega, senão o estúdio fica com as cores do escuro num app claro.
*/
export function revisarEscudo() {
  escudoDe = null;
  aplicarEscudo();
}

/// O que a ponte escreveu da última vez, para limpar quando o tema sair.
let daPonte = new Set<string>();

/*
  Depois que a folha do tema entra, lemos as variáveis que ELE declarou e
  escrevemos nos nossos nomes. Precisa ser depois: só com a folha aplicada o
  getComputedStyle enxerga o que ela definiu.
*/
function aplicarPonte(estado: EstadoDoEstudio) {
  const raiz = document.documentElement;

  for (const nome of daPonte) {
    if (!(nome in estado.substituicoes)) raiz.style.removeProperty(nome);
  }

  daPonte = new Set();

  if (!estado.css.trim()) return;

  /*
    Só os nomes que o próprio arquivo declara. Ler tudo do computado achava
    valor para o vocabulário inteiro da referência — que a nossa camada de tokens
    já declara — e escrevia a camada de referência por cima das cores reais.
  */
  const declarados = nomesDeclaradosNoTema(estado.css);

  /*
    Lê do `body`, não da raiz.

    Metade dos temas da comunidade escreve `:root { --background-primary: … }`
    e a outra metade escreve `body { … }` — as duas formas são corretas no
    mundo deles. Lendo a raiz, a segunda ficava invisível: o `<html>` não
    enxerga o que o `<body>` declara, e a ponte traduzia zero.

    O `body` resolve as duas de uma vez, porque herda o que veio da raiz e
    ainda vê o que foi declarado nele mesmo. A escrita continua na raiz.
  */
  const lido = getComputedStyle(document.body ?? raiz);
  const origens: Record<string, string> = {};

  for (const nome of NOMES_DE_ORIGEM) {
    if (declarados.has(nome)) origens[nome] = lido.getPropertyValue(nome);
  }

  const escolhidos = new Set(Object.keys(estado.substituicoes));
  const traduzidos = traduzirTema(origens, escolhidos);

  /*
    O buraco que fazia um tema importado quase não mudar nada.

    Um tema é escrito contra a árvore de OUTRO app, e cobre o vocabulário
    daquele app — não o nosso. Mesmo com a ponte alargada, ele nunca vai falar
    de `--color-palco`, `--color-veu` ou `--color-line-sutil`: esses nomes não
    existem no mundo dele. O resultado era um app metade pintado, com o miolo
    do tema e as bordas de fábrica.

    Agora o que o tema NÃO disse é derivado do que ele disse. Se ele declarou o
    fundo, as superfícies, o hover, as bordas e o palco de voz saem dali pela
    mesma rampa da aba Cores. É a ideia da referência — lá as cores nascem de
    famílias, não soltas — só que aplicada ao que chega de fora.

    Vem ANTES da tradução de propósito: o que o tema disse com todas as letras
    tem que vencer o que a gente deduziu por ele.
  */
  for (const [nome, valor] of Object.entries(
    completarComDerivacao(traduzidos, estado.saturacao),
  )) {
    if (escolhidos.has(nome)) continue;

    raiz.style.setProperty(nome, valor);
    daPonte.add(nome);
  }

  /*
    A tradução em si saiu daqui — agora é CSS.

    As cores do `@theme` nascem do nome da referência: `--color-surface-0` é
    `var(--background-primary, …)`. Um tema que declara `--background-primary`
    repinta tudo que é `bg-surface-0` sozinho, sem JS, sem ler estilo computado,
    e sem esta função saber que aquele nome existe.

    Escrever `traduzidos` na raiz aqui era pior do que redundante: um valor
    embutido no elemento VENCE a cadeia, então congelava a cor e o que viesse
    depois no arquivo do tema não valia mais.

    O que sobra é o que o CSS não sabe fazer: deduzir o que o tema NÃO disse a
    partir do que ele disse.
  */
}

export const useEstudio = create<EstudioStore>((set, store) => {
  const guardar = (mudanca: Partial<EstadoDoEstudio>) => {
    set(mudanca);

    const { css, biblioteca, ativos, ativoId, coresMae, saturacao, manuais, aRisca, soOQueExisteLa } = store();

    /// Nunca se grava `substituicoes` direto: ela é sempre o resultado.
    const substituicoes = montarTema(coresMae, saturacao, manuais);
    set({ substituicoes });

    const inteiro = {
      substituicoes,
      coresMae,
      saturacao,
      manuais,
      css,
      biblioteca,
      ativos,
      ativoId,
      aRisca,
      soOQueExisteLa,
    };

    aplicar(inteiro);

    try {
      localStorage.setItem(CHAVE, JSON.stringify(inteiro));
    } catch {
      /// Sem localStorage o estúdio ainda funciona; só não sobrevive ao F5.
    }

    canal?.postMessage(1);
  };

  return {
    ...ler(),

    definirToken: (nome, valor) => {
      const manuais = { ...store().manuais };
      if (valor === null) delete manuais[nome];
      else manuais[nome] = valor;

      guardar({ manuais });
    },

    /*
      Escolher uma mãe NÃO apaga o que foi mexido à mão: a derivação entra por
      baixo. Voltar a mãe para o padrão (null) devolve as filhas ao tema base,
      e o que estava à mão continua onde estava.
    */
    definirCorMae: (id, valor) => {
      const coresMae = { ...store().coresMae };
      if (valor === null) delete coresMae[id];
      else coresMae[id] = valor;

      guardar({ coresMae });
    },

    definirSaturacao: (fator) => guardar({ saturacao: fator }),

    definirARisca: (aRisca) => {
      const { ativoId, biblioteca } = store();
      if (!ativoId) return guardar({ aRisca });

      guardar({
        aRisca,
        biblioteca: biblioteca.map((t) => (t.id === ativoId ? { ...t, aRisca } : t)),
      });
    },

    definirSoOQueExisteLa: (ligado) => {
      const { ativoId, biblioteca } = store();
      if (!ativoId) return guardar({ soOQueExisteLa: ligado });

      guardar({
        soOQueExisteLa: ligado,
        biblioteca: biblioteca.map((t) => (t.id === ativoId ? { ...t, soOQueExisteLa: ligado } : t)),
      });
    },

    definirCss: (css) => guardar({ css }),

    salvarNaBiblioteca: (nome) =>
      guardar({
        biblioteca: [
          ...store().biblioteca,
          {
            id: crypto.randomUUID(),
            nome,
            substituicoes: { ...store().substituicoes },
            coresMae: { ...store().coresMae },
            saturacao: store().saturacao,
            manuais: { ...store().manuais },
            css: store().css,
          },
        ],
      }),

    aplicarDaBiblioteca: (id) => {
      const tema = store().biblioteca.find((t) => t.id === id);
      if (!tema) return;

      guardar({ ...doTema(tema), css: tema.css, ativoId: id });
    },

    /// Ligar troca o tema que está valendo; desligar volta para o base.
    alternarTema: (id) => {
      const tema = store().biblioteca.find((t) => t.id === id);
      if (!tema) return;

      if (store().ativoId === id) {
        guardar({ ...SEM_TEMA, css: "", ativoId: null });
        return;
      }

      guardar({ ...doTema(tema), css: tema.css, ativoId: id });
    },

    atualizarNaBiblioteca: (id, dados) => {
      const biblioteca = store().biblioteca.map((tema) =>
        tema.id === id ? { ...tema, ...dados } : tema,
      );

      /// Editar o tema que está no ar precisa repintar na hora, senão a
      /// pessoa salva e não vê nada acontecer.
      const valendo = store().ativoId === id;
      const atual = biblioteca.find((t) => t.id === id);

      guardar(
        valendo && atual
          ? { biblioteca, ...doTema(atual), css: atual.css }
          : { biblioteca },
      );
    },

    duplicarDaBiblioteca: (id) => {
      const tema = store().biblioteca.find((t) => t.id === id);
      if (!tema) return;

      guardar({
        biblioteca: [
          ...store().biblioteca,
          { ...tema, id: crypto.randomUUID(), nome: `${tema.nome} (cópia)` },
        ],
      });
    },

    importarCssComoTema: (css, nomeDoArquivo) => {
      const cabecalho = lerCabecalhoDoTema(css);
      const id = crypto.randomUUID();

      guardar({
        biblioteca: [
          ...store().biblioteca,
          {
            id,
            nome: cabecalho.nome ?? nomeDoArquivo ?? "Tema sem nome",
            autor: cabecalho.autor,
            versao: cabecalho.versao,
            descricao: cabecalho.descricao,
            tags: cabecalho.tags,
            substituicoes: {},
            css,
          },
        ],
      });

      return id;
    },

    importarBiblioteca: (temas) =>
      guardar({
        biblioteca: [
          ...store().biblioteca,
          ...temas.map((tema) => ({ ...tema, id: crypto.randomUUID() })),
        ],
      }),

    apagarDaBiblioteca: (id) =>
      guardar({
        biblioteca: store().biblioteca.filter((tema) => tema.id !== id),
        ...(store().ativoId === id ? { ...SEM_TEMA, css: "", ativoId: null } : {}),
      }),

    /*
      O que um tema de fora traz em `substituicoes` foi escolhido a dedo por
      quem o escreveu: entra como manual, e as mães começam limpas.
    */
    importar: ({ substituicoes, css }) =>
      guardar({
        ...SEM_TEMA,
        manuais: { ...(substituicoes ?? {}) },
        css: css ?? "",
      }),

    guardarAtivo: (ativo) =>
      guardar({ ativos: [...store().ativos, { ...ativo, id: crypto.randomUUID() }] }),

    apagarAtivo: (id) => guardar({ ativos: store().ativos.filter((a) => a.id !== id) }),

    limparSubstituicoes: () => guardar({ ...SEM_TEMA }),

    limparTudo: () =>
      guardar({ ...SEM_TEMA, css: "", biblioteca: [], ativos: [], ativoId: null }),
  };
});

aplicar(useEstudio.getState());

/*
  O estúdio pode estar aberto em duas janelas ao mesmo tempo: a do app e a que
  sai no "Abrir em janela". O tema tem que mudar nas duas enquanto se escreve —
  é o ponto de ter uma janela à parte.

  São dois caminhos porque nenhum sozinho cobre os dois mundos: o evento de
  storage é o do navegador, e o canal é o que atravessa entre janelas do
  Electron. Quem grava não recebe o próprio aviso, então não há laço.
*/
function receber() {
  const chegou = ler();

  useEstudio.setState(chegou);
  aplicar(chegou);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (evento) => {
    if (evento.key === CHAVE) receber();
  });

  if (typeof BroadcastChannel !== "undefined") {
    canal = new BroadcastChannel(CHAVE);
    canal.onmessage = receber;
  }
}
