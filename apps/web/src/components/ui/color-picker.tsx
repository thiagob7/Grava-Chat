import * as React from "react";
import Color from "color";
import { Pipette } from "lucide-react";

import { Input } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";

export interface Color {
  h: number;
  s: number;
  l: number;
  a: number;
}

export function parseColor(text: string): Color | null {
  try {
    const color = Color(text.trim());
    const [h = 0, s = 0, l = 0] = color.hsl().array();

    return { h: Number.isFinite(h) ? h : 0, s, l, a: color.alpha() };
  } catch {
    return null;
  }
}

export function formatColor({ h, s, l, a }: Color): string {
  const color = Color.hsl(h, s, l);

  if (a >= 1) return color.hex().toLowerCase();

  const [r = 0, g = 0, b = 0] = color.rgb().array().map(Math.round);
  return `rgb(${r} ${g} ${b} / ${Number(a.toFixed(3))})`;
}

const paraCss = (color: Color, alpha = color.a) =>
  Color.hsl(color.h, color.s, color.l).alpha(alpha).string();

interface ColorContextValue {
  color: Color;
  change: (partial: Partial<Color>) => void;
}

const ColorContext = React.createContext<ColorContextValue | null>(null);

const useColor = () => {
  const ctx = React.useContext(ColorContext);
  if (!ctx) throw new Error("Use as peças do seletor dentro de <ColorPicker>.");
  return ctx;
};

export interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  className,
  children,
}) => {
  const [color, setColor] = React.useState<Color>(() => parseColor(value) ?? PRETO);

  const emitted = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (value === emitted.current) return;

    const parsed = parseColor(value);
    if (parsed) setColor(parsed);
  }, [value]);

  const change = React.useCallback(
    (partial: Partial<Color>) => {
      setColor((current) => {
        const proxima = { ...current, ...partial };
        const text = formatColor(proxima);

        emitted.current = text;
        onChange(text);

        return proxima;
      });
    },
    [onChange],
  );

  return (
    <ColorContext.Provider value={{ color, change }}>
      <div data-gc="ui.color-picker.div" className={cn("flex w-full flex-col gap-3", flxCls("molduraDoSeletorDeCor"), className)}>{children}</div>
    </ColorContext.Provider>
  );
};

const PRETO: Color = { h: 0, s: 0, l: 0, a: 1 };

const claroNoTopo = (x: number) => (x < 0.01 ? 100 : 50 + 50 * (1 - x));

export function colorAtPosition(x: number, y: number): Pick<Color, "s" | "l"> {
  return { s: x * 100, l: claroNoTopo(x) * (1 - y) };
}

export function colorPosition({ s, l }: Pick<Color, "s" | "l">): { x: number; y: number } {
  const x = s / 100;
  const topo = claroNoTopo(x);

  return { x, y: topo ? Math.max(0, Math.min(1, 1 - l / topo)) : 0 };
}

export const ColorPickerSelection: React.FC<{ className?: string }> = ({ className }) => {
  const { color, change } = useColor();
  const box = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const move = React.useCallback(
    (event: PointerEvent | React.PointerEvent) => {
      const target = box.current;
      if (!target) return;

      const area = target.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - area.left) / area.width));
      const y = Math.max(0, Math.min(1, (event.clientY - area.top) / area.height));

      change(colorAtPosition(x, y));
    },
    [change],
  );

  React.useEffect(() => {
    if (!dragging) return;

    const release = () => setDragging(false);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
    };
  }, [dragging, move]);

  const { x, y } = colorPosition(color);

  return (
    <div data-gc="ui.color-picker.div--2"
      ref={box}
      onPointerDown={(e) => {
        e.preventDefault();
        setDragging(true);
        move(e);
      }}
      className={cn("relative h-32 w-full cursor-crosshair rounded", className)}
      style={{
        background: `linear-gradient(0deg, #000, transparent),
                     linear-gradient(90deg, #fff, transparent),
                     hsl(${color.h}, 100%, 50%)`,
      }}
    >
      <span data-gc="ui.color-picker.span"
        aria-hidden
        className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-line-sutil shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
        style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      />
    </div>
  );
};

const REGUA = cn(
  "h-3.5 w-full cursor-pointer appearance-none rounded-full outline-none",
  "[&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2",
  "[&::-webkit-slider-thumb]:border-line-sutil [&::-webkit-slider-thumb]:bg-transparent",
  "[&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.5)]",
  "[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full",
  "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-line-sutil",
  "[&::-moz-range-thumb]:bg-transparent",
);

export const ColorPickerHue: React.FC = () => {
  const { color, change } = useColor();

  return (
    <input data-gc="ui.color-picker.input"
      type="range"
      min={0}
      max={360}
      step={1}
      value={Math.round(color.h)}
      onChange={(e) => change({ h: Number(e.target.value) })}
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
  const { color, change } = useColor();

  return (
    <input data-gc="ui.color-picker.input--2"
      type="range"
      min={0}
      max={100}
      step={1}
      value={Math.round(color.a * 100)}
      onChange={(e) => change({ a: Number(e.target.value) / 100 })}
      aria-label="Opacidade"
      className={REGUA}
      style={{
        backgroundImage: `linear-gradient(90deg, ${paraCss(color, 0)}, ${paraCss(color, 1)}),
                          repeating-conic-gradient(rgb(255 255 255 / 0.22) 0 25%, transparent 0 50%)`,
        backgroundSize: "auto, 8px 8px",
      }}
    />
  );
};

export const ColorPickerEyeDropper: React.FC = () => {
  const { change } = useColor();
  const existe = typeof window !== "undefined" && "EyeDropper" in window;

  if (!existe) return null;

  const pickFromScreen = async () => {
    try {
      const conta = new (window as unknown as {
        EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
      }).EyeDropper();

      const { sRGBHex } = await conta.open();
      const parsed = parseColor(sRGBHex);

      if (parsed) change({ h: parsed.h, s: parsed.s, l: parsed.l });
    } catch {
    }
  };

  return (
    <button data-gc="ui.color-picker.button"
      type="button"
      onClick={() => void pickFromScreen()}
      title="Pescar uma cor da tela"
      aria-label="Pescar uma cor da tela"
      className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line text-ink-muted transition hover:bg-surface-3 hover:text-ink"
    >
      <Pipette data-gc="ui.color-picker.pipette" size={14} />
    </button>
  );
};

type Format = "hex" | "rgb" | "hsl" | "css";

const FORMATS: Format[] = ["hex", "rgb", "hsl", "css"];

export const ColorPickerFormat: React.FC = () => {
  const { color, change } = useColor();
  const [format, setFormat] = React.useState<Format>("hex");

  const [draft, setDraft] = React.useState<string | null>(null);
  const full = Color.hsl(color.h, color.s, color.l).alpha(color.a);
  const hex = full.hex().toLowerCase();

  const fieldClass = "h-8 flex-1 px-2 font-mono text-xs";

  return (
    <div data-gc="ui.color-picker.div--3" className="flex items-center gap-2">
      <SelectField<Format> data-gc="ui.color-picker.select-field"
        value={format}
        onSelect={(f) => {
          setFormat(f);
          setDraft(null);
        }}
        options={FORMATS.map((f) => ({ value: f, label: f.toUpperCase() }))}
        className="h-8 w-[4.5rem] shrink-0 text-xs"
      />

      {format === "hex" && (
        <Input data-gc="ui.color-picker.input--3"
          value={draft ?? hex}
          onChange={(e) => {
            setDraft(e.target.value);

            const parsed = parseColor(e.target.value);
            if (parsed) change(parsed);
          }}
          onBlur={() => setDraft(null)}
          aria-label="Valor em hexadecimal"
          className={fieldClass}
        />
      )}

      {format !== "hex" && (
        <Input data-gc="ui.color-picker.input--4"
          readOnly
          value={
            format === "rgb"
              ? full.rgb().array().map(Math.round).join(", ")
              : format === "hsl"
                ? full.hsl().array().map(Math.round).join(", ")
                : formatColor(color)
          }
          aria-label={`Valor em ${format.toUpperCase()}`}
          className={cn(fieldClass, "text-ink-muted")}
        />
      )}

      {format !== "css" && (
        <span data-gc="ui.color-picker.span--2" className="flex h-8 shrink-0 items-center rounded-md border border-line px-1.5 font-mono text-xs tabular-nums text-ink-muted">
          {Math.round(color.a * 100)}%
        </span>
      )}
    </div>
  );
};

export const ColorField: React.FC<ColorPickerProps> = ({ value, onChange, className }) => (
  <ColorPicker data-gc="ui.color-picker.color-picker.on-change" value={value} onChange={onChange} className={className}>
    <ColorPickerSelection data-gc="ui.color-picker.color-picker-selection" />

    <div data-gc="ui.color-picker.div--4" className="flex items-center gap-2">
      <ColorPickerEyeDropper data-gc="ui.color-picker.color-picker-eye-dropper" />

      <div data-gc="ui.color-picker.div--5" className="flex min-w-0 flex-1 flex-col gap-2">
        <ColorPickerHue data-gc="ui.color-picker.color-picker-hue" />
        <ColorPickerAlpha data-gc="ui.color-picker.color-picker-alpha" />
      </div>
    </div>

    <ColorPickerFormat data-gc="ui.color-picker.color-picker-format" />
  </ColorPicker>
);
