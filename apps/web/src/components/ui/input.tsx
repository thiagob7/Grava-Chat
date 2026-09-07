import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";

export const campoBase =
  `${flxCls("molduraDoCampo")} ${flxCls("superficieDeCampo")} ` +
  "w-full min-w-0 rounded-lg border border-line bg-campo px-3 py-2 text-sm text-ink shadow-xs outline-none transition placeholder:text-ink-faint focus-visible:border-ink-faint/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger";

/*
  O campo, a linha de erro e o olho da senha.

  Sem `erro` e sem `type="password"` ele é o `<input>` de sempre — quem já usa
  não muda de nada. Com um dos dois, vira uma pilha: o campo, o botão por cima
  quando é senha, e a mensagem embaixo.

  `aria-invalid` e `aria-describedby` entram junto: erro que só existe em cor
  não chega a quem usa leitor de tela.
*/
interface InputProps extends React.ComponentProps<"input"> {
  erro?: string;
}

export const Input = ({ className, erro, type, id, ...props }: InputProps) => {
  const [mostrando, setMostrando] = React.useState(false);
  const gerado = React.useId();
  const idDoErro = `${id ?? gerado}-erro`;
  const ehSenha = type === "password";

  const campo = (
    <input data-gc="ui.input.input"
      id={id}
      type={ehSenha && mostrando ? "text" : type}
      aria-invalid={erro ? true : props["aria-invalid"]}
      aria-describedby={erro ? idDoErro : props["aria-describedby"]}
      className={cn(campoBase, "h-10 py-1", ehSenha && "pr-10", flxCls("campo"), className)}
      {...props}
    />
  );

  if (!erro && !ehSenha) return campo;

  return (
    <div data-gc="ui.input.div" className="w-full">
      <div data-gc="ui.input.div--2" className="relative">
        {campo}

        {ehSenha && (
          <button data-gc="ui.input.button"
            type="button"
            onClick={() => setMostrando((v) => !v)}
            aria-label={mostrando ? "Esconder a senha" : "Mostrar a senha"}
            aria-pressed={mostrando}
            className={cn(
              flxCls("olhoDaSenha"),
              "absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-ink-faint transition hover:text-ink",
            )}
          >
            {mostrando ? <EyeOff data-gc="ui.input.eye-off" size={16} /> : <Eye data-gc="ui.input.eye" size={16} />}
          </button>
        )}
      </div>

      {erro && (
        <p data-gc="ui.input.p" id={idDoErro} className={cn(flxCls("erroDoCampo"), "mt-1 text-xs text-danger")}>
          {erro}
        </p>
      )}
    </div>
  );
};

export const Textarea = ({ className, ...props }: React.ComponentProps<"textarea">) => (
  <textarea data-gc="ui.input.textarea"
    className={cn(campoBase, "resize-none", flxCls("campo"), className)}
    {...props}
  />
);

export const campoDeCor =
  "shrink-0 cursor-pointer rounded-lg border border-line-sutil bg-campo p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const grupoDeCampo =
  `${flxCls("grupoDeCampo")} ` +
  "flex h-10 items-center gap-2 rounded-lg border border-line-sutil bg-campo px-3 transition focus-within:border-ink-faint/40";

export const campoNu =
  "h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink shadow-none outline-none placeholder:text-ink-faint focus-visible:border-0";

export const CampoComAcao: React.FC<
  React.ComponentProps<"input"> & { acao: React.ReactNode }
> = ({ acao, className, ...props }) => (
  <div data-gc="ui.input.div--3"
    className={cn(
      "flex items-center gap-2 rounded-lg border border-line bg-campo p-1.5 pl-3 transition",
      "focus-within:border-ink-faint/40",
    )}
  >
    <input data-gc="ui.input.input--2" className={cn(campoNu, "h-8", className)} {...props} />
    {acao}
  </div>
);

export const cartaoDeEscolha = (escolhido: boolean) =>
  cn(
    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
    escolhido
      ? "border-brand bg-brand/10 text-ink"
      : "border-line-sutil bg-campo hover:border-line-sutil hover:bg-surface-3/60",
  );

export const Label = ({ className, ...props }: React.ComponentProps<"label">) => (
  <label data-gc="ui.input.label"
    className={cn("mb-1.5 block text-xs font-semibold uppercase text-ink-muted", className)}
    {...props}
  />
);

interface OpcaoEmCartaoProps {
  escolhido: boolean;
  onEscolher: () => void;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  icone?: React.ReactNode;
}

export const OpcaoEmCartao: React.FC<OpcaoEmCartaoProps> = ({
  escolhido,
  onEscolher,
  titulo,
  descricao,
  icone,
}) => (
  <button data-gc="ui.input.button.on-escolher" type="button" onClick={onEscolher} className={cartaoDeEscolha(escolhido)}>
    {icone}
    <span data-gc="ui.input.span" className="min-w-0 flex-1">
      <span data-gc="ui.input.span--2" className="block text-sm font-medium">{titulo}</span>
      {descricao && <span data-gc="ui.input.span--3" className="mt-0.5 block text-xs text-ink-faint">{descricao}</span>}
    </span>
    <span data-gc="ui.input.span--4"
      aria-hidden
      className={cn(
        "mt-0.5 size-4 shrink-0 rounded-full border-2 transition-colors",
        escolhido ? "border-brand bg-brand" : "border-ink-faint",
      )}
    />
  </button>
);

interface GrupoSegmentadoProps<T extends string> {
  valor: T;
  onEscolher: (valor: T) => void;
  opcoes: { valor: T; rotulo: string }[];
}

export function GrupoSegmentado<T extends string>({
  valor,
  onEscolher,
  opcoes,
}: GrupoSegmentadoProps<T>) {
  return (
    <div data-gc="ui.input.div--4" className="flex gap-2">
      {opcoes.map((o) => (
        <button data-gc="ui.input.button--2"
          key={o.valor}
          type="button"
          onClick={() => onEscolher(o.valor)}
          className={cn(
            "h-10 flex-1 rounded-lg border text-sm transition-colors",
            valor === o.valor
              ? "border-brand bg-brand/10 text-ink"
              : "border-line-sutil bg-campo text-ink-muted hover:border-line-sutil hover:text-ink",
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
