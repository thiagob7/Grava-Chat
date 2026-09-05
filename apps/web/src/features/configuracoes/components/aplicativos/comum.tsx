import React from "react";
import { toast } from "react-toastify";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

import { copiarTexto } from "~/lib/copiar";
import { cn } from "~/lib/utils";

export const copiar = (texto: string, aviso: string) =>
  void copiarTexto(texto).then((deu) =>
    deu ? toast.success(aviso) : toast.error("Seu navegador não deixou copiar."),
  );

export const BotaoDeIcone: React.FC<
  React.ComponentProps<"button"> & { rotulo: string }
> = ({ rotulo, className, ...props }) => (
  <button data-gc="configuracoes.aplicativos.comum.button"
    type="button"
    aria-label={rotulo}
    title={rotulo}
    className={cn(
      "shrink-0 rounded p-1.5 text-ink-faint transition hover:bg-surface-3 hover:text-ink",
      className,
    )}
    {...props}
  />
);

export const CampoDeSegredo: React.FC<{
  valor: string;
  rotuloCopiar: string;
  avisoCopiado: string;
  escondivel?: boolean;
  mono?: boolean;
}> = ({ valor, rotuloCopiar, avisoCopiado, escondivel = false, mono = true }) => {
  const [aberto, setAberto] = React.useState(!escondivel);
  const [copiado, setCopiado] = React.useState(false);

  const aoCopiar = () => {
    copiar(valor, avisoCopiado);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1600);
  };

  return (
    <div data-gc="configuracoes.aplicativos.comum.div" className="flex items-center gap-1">
      <code data-gc="configuracoes.aplicativos.comum.code"
        className={cn(
          "min-w-0 flex-1 truncate rounded bg-surface-0 px-2 py-1.5 text-xs",
          mono && "font-mono",
        )}
      >
        {aberto ? valor : "•".repeat(24)}
      </code>

      {escondivel && (
        <BotaoDeIcone data-gc="configuracoes.aplicativos.comum.botao-de-icone"
          rotulo={aberto ? "Esconder" : "Mostrar"}
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? <EyeOff data-gc="configuracoes.aplicativos.comum.eye-off" size={14} /> : <Eye data-gc="configuracoes.aplicativos.comum.eye" size={14} />}
        </BotaoDeIcone>
      )}

      <BotaoDeIcone data-gc="configuracoes.aplicativos.comum.botao-de-icone.ao-copiar" rotulo={rotuloCopiar} onClick={aoCopiar}>
        {copiado ? <Check data-gc="configuracoes.aplicativos.comum.check" size={14} className="text-online" /> : <Copy data-gc="configuracoes.aplicativos.comum.copy" size={14} />}
      </BotaoDeIcone>
    </div>
  );
};
