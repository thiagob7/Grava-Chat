import { create } from "zustand";

import { lerCabecalhoDoTema } from "@gravae/shared";

import {
  CORRECOES_DO_FLUXER,
  pareceTemaDoFluxer,
} from "~/features/configuracoes/lib/correcoes-do-fluxer";
import { derivar } from "~/features/configuracoes/lib/cores-mae";
import {
  ID_DO_ESCUDO,
  cssDoEscudo,
  medirBase,
} from "~/features/configuracoes/lib/escudo-do-estudio";
import { avisarTemaAplicado } from "~/features/configuracoes/lib/evento-de-tema";
import { normalizarSeletoresDoFluxer } from "~/features/configuracoes/lib/normalizar-tema";
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
    return {
      ...VAZIO,
      ...guardado,
      manuais: guardado.manuais ?? guardado.substituicoes ?? {},
    };
  } catch {
    return VAZIO;
  }
}

/*
  O que vai para a tela: as filhas de cada mãe, e por cima o que foi mexido à
  mão. A ordem é a regra — quem abriu o token e escolheu a cor não pode ver a
  derivação desmanchar a escolha no clique seguinte.
*/
function montar(
  coresMae: Record<string, string>,
  saturacao: number,
  manuais: Record<string, string>,
): Record<string, string> {
  const derivadas: Record<string, string> = {};

  for (const [id, cor] of Object.entries(coresMae)) {
    Object.assign(derivadas, derivar(id, cor, saturacao));
  }

  return { ...derivadas, ...manuais };
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
const ID_DAS_CORRECOES = "gc-correcoes-fluxer";

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

  let estilo = document.getElementById(ID_DO_ESTILO);
  if (!estilo) {
    estilo = document.createElement("style");
    estilo.id = ID_DO_ESTILO;
    document.head.appendChild(estilo);
  }

  /*
    O CSS entra normalizado: seletor travado no hash de um build do Fluxer não
    acha nada em lugar nenhum, nem lá com outro build. O arquivo de quem
    escreveu fica como está; muda só o que é aplicado.
  */
  estilo.textContent = normalizarSeletoresDoFluxer(estado.css);

  /*
    Depois da folha do tema, senão não corrige nada: aqui é a última palavra
    sobre o que a nossa árvore mede.
  */
  let correcoes = document.getElementById(ID_DAS_CORRECOES);

  if (pareceTemaDoFluxer(estado.css)) {
    if (!correcoes) {
      correcoes = document.createElement("style");
      correcoes.id = ID_DAS_CORRECOES;
      document.head.appendChild(correcoes);
    }

    correcoes.textContent = CORRECOES_DO_FLUXER;
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
    valor para o vocabulário inteiro do Fluxer — que a nossa camada de tokens
    já declara — e escrevia a camada de referência por cima das cores reais.
  */
  const declarados = nomesDeclaradosNoTema(estado.css);

  const lido = getComputedStyle(raiz);
  const origens: Record<string, string> = {};

  for (const nome of NOMES_DE_ORIGEM) {
    if (declarados.has(nome)) origens[nome] = lido.getPropertyValue(nome);
  }

  const escolhidos = new Set(Object.keys(estado.substituicoes));

  for (const [nome, valor] of Object.entries(traduzirTema(origens, escolhidos))) {
    raiz.style.setProperty(nome, valor);
    daPonte.add(nome);
  }
}

export const useEstudio = create<EstudioStore>((set, store) => {
  const guardar = (mudanca: Partial<EstadoDoEstudio>) => {
    set(mudanca);

    const { css, biblioteca, ativos, ativoId, coresMae, saturacao, manuais } = store();

    /// Nunca se grava `substituicoes` direto: ela é sempre o resultado.
    const substituicoes = montar(coresMae, saturacao, manuais);
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
