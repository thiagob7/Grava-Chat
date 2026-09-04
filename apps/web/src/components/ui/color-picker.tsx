import * as React from "react";
import Color from "color";
import { Pipette } from "lucide-react";

import { Input } from "~/components/ui/input";
import { CampoSelect } from "~/components/ui/select";
import { cn } from "~/lib/utils";

export interface Cor {
  h: number;
  s: number;
  l: number;
  a: number;
}

export function lerCor(texto: string): Cor | null {
  try {
    const cor = Color(texto.trim());
    const [h = 0, s = 0, l = 0] = cor.hsl().array();

    return { h: Number.isFinite(h) ? h : 0, s, l, a: cor.alpha() };
  } catch {
    return null;
  }
}

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

const claroNoTopo = (x: number) => (x < 0.01 ? 100 : 50 + 50 * (1 - x));

export function corDaPosicao(x: number, y: number): Pick<Cor, "s" | "l"> {
  return { s: x * 100, l: claroNoTopo(x) * (1 - y) };
}

export function posicaoDaCor({ s, l }: Pick<Cor, "s" | "l">): { x: number; y: number } {
  const x = s / 100;
  const topo = claroNoTopo(x);

  return { x, y: topo ? Math.max(0, Math.min(1, 1 - l / topo)) : 0 };
}

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
        backgroundImage: `linear-gradient(90deg, ${paraCss(cor, 0)}, ${paraCss(cor, 1)}),
                          repeating-conic-gradient(rgb(255 255 255 / 0.22) 0 25%, transparent 0 50%)`,
        backgroundSize: "auto, 8px 8px",
      }}
    />
  );
};

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

export const ColorPickerFormat: React.FC = () => {
  const { cor, mudar } = usarCor();
  const [formato, setFormato] = React.useState<Formato>("hex");

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

      {formato !== "css" && (
        <span className="flex h-8 shrink-0 items-center rounded-md border border-line px-1.5 font-mono text-xs tabular-nums text-ink-muted">
          {Math.round(cor.a * 100)}%
        </span>
      )}
    </div>
  );
};

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
