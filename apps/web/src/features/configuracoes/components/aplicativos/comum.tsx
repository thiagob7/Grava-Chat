import React from "react";
import { toast } from "react-toastify";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

import { IconButton } from "~/components/ui/button";
import { copyText } from "~/lib/copiar";
import { cn } from "~/lib/utils";

export const copy = (text: string, notice: string) =>
  void copyText(text).then((gave) =>
    gave ? toast.success(notice) : toast.error("Seu navegador não deixou copiar."),
  );

const secretButton = "size-[26px] rounded text-ink-faint hover:bg-surface-3";

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
          size="xs"
          label={isOpen ? "Esconder" : "Mostrar"}
          title={isOpen ? "Esconder" : "Mostrar"}
          className={secretButton}
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? <EyeOff data-gc="configuracoes.aplicativos.comum.eye-off" /> : <Eye data-gc="configuracoes.aplicativos.comum.eye" />}
        </IconButton>
      )}

      <IconButton data-gc="configuracoes.aplicativos.comum.icon-button.on-copy" size="xs" label={labelCopy} title={labelCopy} className={secretButton} onClick={onCopy}>
        {copied ? <Check data-gc="configuracoes.aplicativos.comum.check" className="text-online" /> : <Copy data-gc="configuracoes.aplicativos.comum.copy" />}
      </IconButton>
    </div>
  );
};
