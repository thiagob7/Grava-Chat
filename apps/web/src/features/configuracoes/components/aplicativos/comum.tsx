import React from "react";
import { toast } from "react-toastify";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

import { copyText } from "~/lib/copiar";
import { cn } from "~/lib/utils";

export const copy = (text: string, notice: string) =>
  void copyText(text).then((gave) =>
    gave ? toast.success(notice) : toast.error("Seu navegador não deixou copiar."),
  );

export const IconButton: React.FC<
  React.ComponentProps<"button"> & { label: string }
> = ({ label, className, ...props }) => (
  <button data-gc="configuracoes.aplicativos.comum.button"
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      "shrink-0 rounded p-1.5 text-ink-faint transition hover:bg-surface-3 hover:text-ink",
      className,
    )}
    {...props}
  />
);

export const SecretField: React.FC<{
  value: string;
  labelCopy: string;
  noticeCopied: string;
  hideable?: boolean;
  mono?: boolean;
}> = ({ value, labelCopy, noticeCopied, hideable = false, mono = true }) => {
  const [isOpen, setIsOpen] = React.useState(!hideable);
  const [copied, setCopied] = React.useState(false);

  const onCopy = () => {
    copy(value, noticeCopied);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div data-gc="configuracoes.aplicativos.comum.div" className="flex items-center gap-1">
      <code data-gc="configuracoes.aplicativos.comum.code"
        className={cn(
          "min-w-0 flex-1 truncate rounded-lg border border-line bg-surface-1 px-2.5 py-2 text-xs text-ink-muted",
          mono && "font-mono",
        )}
      >
        {isOpen ? value : "•".repeat(24)}
      </code>

      {hideable && (
        <IconButton data-gc="configuracoes.aplicativos.comum.icon-button"
          label={isOpen ? "Esconder" : "Mostrar"}
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? <EyeOff data-gc="configuracoes.aplicativos.comum.eye-off" size={14} /> : <Eye data-gc="configuracoes.aplicativos.comum.eye" size={14} />}
        </IconButton>
      )}

      <IconButton data-gc="configuracoes.aplicativos.comum.icon-button.on-copy" label={labelCopy} onClick={onCopy}>
        {copied ? <Check data-gc="configuracoes.aplicativos.comum.check" size={14} className="text-online" /> : <Copy data-gc="configuracoes.aplicativos.comum.copy" size={14} />}
      </IconButton>
    </div>
  );
};
