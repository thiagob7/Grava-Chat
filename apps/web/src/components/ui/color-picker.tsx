import * as React from "react";
import Color from "color";
import { Pipette } from "lucide-react";

import { Input } from "~/components/ui/input";
import { CampoSelect } from "~/components/ui/select";
import { cn } from "~/lib/utils";

/**
 * O seletor de cor do estúdio de temas.
 *
 * **Origem:** o `color-picker` do Kibo UI (`github.com/haydenbleasel/kibo`,
 * MIT), que por sua vez copia o desenho do Figma — quadrado de saturação em
 * cima, matiz e transparência embaixo, conta-gotas e o valor escrito. A
 * licença é MIT, então trazer o código é permitido; isto NÃO vale para a
 * referência visual do app, que é AGPL e só se olha.
 *
 * Foi reescrito e não colado. Três motivos, e os dois primeiros são defeitos
 * do original que só aparecem quando ele é usado CONTROLADO — que é o nosso
 * caso, porque cada linha do estúdio abre o seletor já com a cor do token:
 *
 * 1. **O original embaralha os canais ao receber um valor.** O efeito que
 *    sincroniza faz `setHue(cor.r)`, `setSaturation(cor.g)`,
 *    `setLightness(cor.b)` — vermelho vira matiz, verde vira saturação, azul
 *    vira luminosidade. Abrir com `#1a181e` daria uma cor que não tem nada a
 *    ver. Aqui a leitura é `Color(texto).hsl()`, que é o que ele queria dizer.
 * 2. **O original avisa o pai a cada mudança de estado, inclusive na
 *    montagem.** Com `onChange` dentro de um `useEffect`, só ABRIR o seletor
 *    já dispararia uma escrita — e no estúdio escrever é marcar o token como
 *    substituído. Aqui não há efeito nenhum: quem avisa é o gesto, no `mudar`.
 * 3. **A bolinha do quadrado nascia sempre no canto.** Ela vinha de um estado
 *    local que começava em zero e nunca ouvia a cor de fora. Aqui a posição é
 *    DERIVADA da saturação e da luminosidade, então não existe o que
 *    dessincronizar.
 *
 * As réguas são `input[type=range]` com o trilho pintado no fundo, que é o
 * mesmo jeito do `ui/slider.tsx` daqui — o original usa o slider do Radix, que
 * não é dependência deste projeto e não daria nada que o range nativo já não
 * dê (teclado, toque, `aria` de faixa).
 */

export interface Cor {
  /// 0–360
  h: number;
  /// 0–100
  s: number;
  /// 0–100
  l: number;
  /// 0–1
  a: number;
}

/**
 * Lê qualquer cor que o CSS aceite — `#1a181e`, `rgb(201 197 211 / 0.15)`,
 * `white`. Devolve `null` no que não der, em vez de estourar: os tokens do
 * tema são texto livre, e um dia pode aparecer um `color-mix()` ali.
 */
export function lerCor(texto: string): Cor | null {
  try {
    const cor = Color(texto.trim());
    const [h = 0, s = 0, l = 0] = cor.hsl().array();

    /// Cinza puro não tem matiz, e o `color` devolve `NaN` nesse caso.
    return { h: Number.isFinite(h) ? h : 0, s, l, a: cor.alpha() };
  } catch {
    return null;
  }
}

/**
 * Escreve a cor de volta no formato que a folha de estilo usa: hexadecimal
 * quando é opaca, `rgb(r g b / a)` quando não é.
 *
 * O hex sai em minúsculas porque é assim que os 138 tokens de `index.css`
 * estão escritos — devolver `#1A181E` faria um diff que não é mudança.
 */
export function escreverCor({ h, s, l, a }: Cor): string {
  const cor = Color.hsl(h, s, l);

  if (a >= 1) return cor.hex().toLowerCase();

  const [r = 0, g = 0, b = 0] = cor.rgb().array().map(Math.round);
  return `rgb(${r} ${g} ${b} / ${Number(a.toFixed(3))})`;
}

const paraCss = (cor: Cor, alpha = cor.a) =>
  Color.hsl(cor.h, cor.s, cor.l).alpha(alpha).string();

interface Contexto {
  cor: Cor;
  mudar: (parcial: Partial<Cor>) => void;
}

const ContextoDaCor = React.createContext<Contexto | null>(null);

const usarCor = () => {
  const ctx = React.useContext(ContextoDaCor);
  if (!ctx) throw new Error("Use as peças do seletor dentro de <ColorPicker>.");
  return ctx;
};

export interface ColorPickerProps {
  valor: string;
  onMudar: (valor: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  valor,
  onMudar,
  className,
  children,
}) => {
  const [cor, setCor] = React.useState<Cor>(() => lerCor(valor) ?? PRETO);

  /*
    O eco do que a gente mesmo mandou não pode voltar como cor nova.

    Quem escreve o token é o pai, então todo gesto daqui volta pelo `valor`
    alguns milissegundos depois. Sem esta guarda, esse retorno reescreveria o
    estado com a cor RECONSTRUÍDA a partir do texto — e como `hsl → texto →
    hsl` arredonda, a bolinha andava sozinha um pixel a cada arrasto. Guardar
    o texto emitido e ignorá-lo na volta é o que mantém o gesto contínuo.
  */
  const emitido = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (valor === emitido.current) return;

    const lida = lerCor(valor);
    if (lida) setCor(lida);
  }, [valor]);

  const mudar = React.useCallback(
    (parcial: Partial<Cor>) => {
      setCor((atual) => {
        const proxima = { ...atual, ...parcial };
        const texto = escreverCor(proxima);

        emitido.current = texto;
        onMudar(texto);

        return proxima;
      });
    },
    [onMudar],
  );

  return (
    <ContextoDaCor.Provider value={{ cor, mudar }}>
      <div className={cn("flex w-full flex-col gap-3", className)}>{children}</div>
    </ContextoDaCor.Provider>
  );
};

const PRETO: Cor = { h: 0, s: 0, l: 0, a: 1 };

/**
 * O que a posição no quadrado vale em cor, e o contrário.
 *
 * A conta do eixo Y não é a óbvia, e vem do original de propósito: o topo do
 * quadrado não é sempre 100% de luz — ele fecha em 50% conforme se anda para a
 * direita (`50 + 50 * (1 - x)`). É o que faz o canto superior direito ser a
 * cor pura em vez de branco, como no Figma.
 *
 * As duas moram juntas e são exportadas porque precisam ser uma o INVERSO
 * exato da outra. Enquanto a fórmula estava escrita duas vezes — uma no
 * arrasto, outra na posição da bolinha — nada impedia que só uma mudasse, e o
 * sintoma seria a bolinha parar de cair onde o dedo está. Agora um teste
 * segura as duas pela ida e volta.
 */
const claroNoTopo = (x: number) => (x < 0.01 ? 100 : 50 + 50 * (1 - x));

export function corDaPosicao(x: number, y: number): Pick<Cor, "s" | "l"> {
  return { s: x * 100, l: claroNoTopo(x) * (1 - y) };
}

export function posicaoDaCor({ s, l }: Pick<Cor, "s" | "l">): { x: number; y: number } {
  const x = s / 100;
  const topo = claroNoTopo(x);

  return { x, y: topo ? Math.max(0, Math.min(1, 1 - l / topo)) : 0 };
}

/// O quadrado de saturação e luminosidade. A conta de onde o dedo cai e a de
/// onde a bolinha aparece são as duas funções acima, uma o inverso da outra.
export const ColorPickerSelection: React.FC<{ className?: string }> = ({ className }) => {
  const { cor, mudar } = usarCor();
  const caixa = React.useRef<HTMLDivElement>(null);
  const [arrastando, setArrastando] = React.useState(false);

  const mover = React.useCallback(
    (evento: PointerEvent | React.PointerEvent) => {
      const alvo = caixa.current;
      if (!alvo) return;

      const area = alvo.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (evento.clientX - area.left) / area.width));
      const y = Math.max(0, Math.min(1, (evento.clientY - area.top) / area.height));

      mudar(corDaPosicao(x, y));
    },
    [mudar],
  );

  React.useEffect(() => {
    if (!arrastando) return;

    const soltar = () => setArrastando(false);

    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);

    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
  }, [arrastando, mover]);

  const { x, y } = posicaoDaCor(cor);

  return (
    <div
      ref={caixa}
      onPointerDown={(e) => {
        e.preventDefault();
        setArrastando(true);
        mover(e);
      }}
      className={cn("relative h-32 w-full cursor-crosshair rounded", className)}
      style={{
        background: `linear-gradient(0deg, #000, transparent),
                     linear-gradient(90deg, #fff, transparent),
                     hsl(${cor.h}, 100%, 50%)`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
        style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      />
    </div>
  );
};

/// O trilho das duas réguas é pintado no fundo, e o polegar é um círculo
/// branco. `appearance-none` some com o desenho do sistema, que ignoraria o
/// gradiente por baixo.
const REGUA = cn(
  "h-3.5 w-full cursor-pointer appearance-none rounded-full outline-none",
  "[&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2",
  "[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent",
  "[&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.5)]",
  "[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full",
  "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white",
  "[&::-moz-range-thumb]:bg-transparent",
);

export const ColorPickerHue: React.FC = () => {
  const { cor, mudar } = usarCor();

  return (
    <input
      type="range"
      min={0}
      max={360}
      step={1}
      value={Math.round(cor.h)}
      onChange={(e) => mudar({ h: Number(e.target.value) })}
      aria-label="Matiz"
      className={REGUA}
      style={{
        background:
          "linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
      }}
    />
  );
};

export const ColorPickerAlpha: React.FC = () => {
  const { cor, mudar } = usarCor();

  return (
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={Math.round(cor.a * 100)}
      onChange={(e) => mudar({ a: Number(e.target.value) / 100 })}
      aria-label="Opacidade"
      className={REGUA}
      style={{
        /*
          Duas camadas: o degradê da cor por cima e o xadrez por baixo, que é
          o que deixa a transparência visível. Sem o xadrez, o lado esquerdo da
          régua seria a cor do painel, e "transparente" ficaria indistinguível
          de "cinza escuro" — que é a única coisa que a régua tem pra dizer.
        */
        backgroundImage: `linear-gradient(90deg, ${paraCss(cor, 0)}, ${paraCss(cor, 1)}),
                          repeating-conic-gradient(rgb(255 255 255 / 0.22) 0 25%, transparent 0 50%)`,
        backgroundSize: "auto, 8px 8px",
      }}
    />
  );
};

/**
 * O conta-gotas, que só existe onde o navegador tem `EyeDropper` — hoje os
 * Chromium. O original desenha o botão sempre e escreve no console quando
 * falha; um botão que não faz nada é pior que botão nenhum, então aqui ele
 * some no Firefox e no Safari.
 */
export const ColorPickerEyeDropper: React.FC = () => {
  const { mudar } = usarCor();
  const existe = typeof window !== "undefined" && "EyeDropper" in window;

  if (!existe) return null;

  const pingar = async () => {
    try {
      const conta = new (window as unknown as {
        EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
      }).EyeDropper();

      const { sRGBHex } = await conta.open();
      const lida = lerCor(sRGBHex);

      /// A cor pescada da tela é sempre opaca; a opacidade de agora fica.
      if (lida) mudar({ h: lida.h, s: lida.s, l: lida.l });
    } catch {
      /// Fechar com Esc rejeita a promessa. Desistir não é erro.
    }
  };

  return (
    <button
      type="button"
      onClick={() => void pingar()}
      title="Pescar uma cor da tela"
      aria-label="Pescar uma cor da tela"
      className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line text-ink-muted transition hover:bg-surface-3 hover:text-ink"
    >
      <Pipette size={14} />
    </button>
  );
};

type Formato = "hex" | "rgb" | "hsl" | "css";

const FORMATOS: Formato[] = ["hex", "rgb", "hsl", "css"];

/**
 * O valor escrito, no formato que se escolher.
 *
 * O campo do HEX aceita digitação; os outros são leitura. É a diferença que o
 * uso pede: colar um `#1a181e` que veio de outro lugar é o gesto mais comum
 * de um estúdio de temas, enquanto ninguém digita os três números do HSL um a
 * um — para isso existem o quadrado e as réguas logo acima.
 */
export const ColorPickerFormat: React.FC = () => {
  const { cor, mudar } = usarCor();
  const [formato, setFormato] = React.useState<Formato>("hex");

  /*
    O rascunho existe só enquanto se digita.

    Sem ele, apagar um caractere do hex deixaria um texto que não é cor, o
    `lerCor` devolveria `null` e o campo voltaria sozinho pro valor de antes —
    apagando a letra seguinte que a pessoa ia digitar. Com o rascunho, o campo
    obedece o teclado e só vira cor quando o que está escrito É uma cor.
  */
  const [rascunho, setRascunho] = React.useState<string | null>(null);
  const cheia = Color.hsl(cor.h, cor.s, cor.l).alpha(cor.a);
  const hex = cheia.hex().toLowerCase();

  const campo = "h-8 flex-1 px-2 font-mono text-xs";

  return (
    <div className="flex items-center gap-2">
      <CampoSelect<Formato>
        valor={formato}
        onEscolher={(f) => {
          setFormato(f);
          setRascunho(null);
        }}
        opcoes={FORMATOS.map((f) => ({ valor: f, rotulo: f.toUpperCase() }))}
        className="h-8 w-[4.5rem] shrink-0 text-xs"
      />

      {formato === "hex" && (
        <Input
          value={rascunho ?? hex}
          onChange={(e) => {
            setRascunho(e.target.value);

            const lida = lerCor(e.target.value);
            if (lida) mudar(lida);
          }}
          onBlur={() => setRascunho(null)}
          aria-label="Valor em hexadecimal"
          className={campo}
        />
      )}

      {formato !== "hex" && (
        <Input
          readOnly
          value={
            formato === "rgb"
              ? cheia.rgb().array().map(Math.round).join(", ")
              : formato === "hsl"
                ? cheia.hsl().array().map(Math.round).join(", ")
                : escreverCor(cor)
          }
          aria-label={`Valor em ${formato.toUpperCase()}`}
          className={cn(campo, "text-ink-muted")}
        />
      )}

      {/*
        A opacidade em número, ao lado do valor.

        A régua diz que existe opacidade e mostra mais ou menos quanta; ela não
        diz que são 15%. Num estúdio de temas essa diferença importa, porque o
        que se está construindo é um VALOR que alguém vai comparar com outro —
        e "parecido" não serve para decidir se duas bordas têm a mesma tinta.
        No formato CSS ele sai, porque o texto ali já traz a opacidade escrita.
      */}
      {formato !== "css" && (
        <span className="flex h-8 shrink-0 items-center rounded-md border border-line px-1.5 font-mono text-xs tabular-nums text-ink-muted">
          {Math.round(cor.a * 100)}%
        </span>
      )}
    </div>
  );
};

/// O arranjo de sempre, para quem não quer montar as peças na mão.
export const SeletorDeCor: React.FC<ColorPickerProps> = ({ valor, onMudar, className }) => (
  <ColorPicker valor={valor} onMudar={onMudar} className={className}>
    <ColorPickerSelection />

    <div className="flex items-center gap-2">
      <ColorPickerEyeDropper />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <ColorPickerHue />
        <ColorPickerAlpha />
      </div>
    </div>

    <ColorPickerFormat />
  </ColorPicker>
);
