import React from "react";

import { Switch } from "~/components/ui/switch";

export const Opcao: React.FC<{
  titulo: string;
  detalhe: string;
  ligado: boolean;
  onMudar: (valor: boolean) => void;
}> = ({ titulo, detalhe, ligado, onMudar }) => (
  <div data-gc="configuracoes.campos-de-config.div" className="mt-4 flex items-start gap-4 first:mt-0">
    <div data-gc="configuracoes.campos-de-config.div--2" className="min-w-0 flex-1">
      <p data-gc="configuracoes.campos-de-config.p" className="text-sm font-medium">{titulo}</p>
      <p data-gc="configuracoes.campos-de-config.p--2" className="mt-0.5 text-xs text-ink-faint">{detalhe}</p>
    </div>
    <Switch data-gc="configuracoes.campos-de-config.switch.on-mudar" checked={ligado} onCheckedChange={onMudar} />
  </div>
);

export const Linha: React.FC<{ titulo: string; children: React.ReactNode }> = ({
  titulo,
  children,
}) => (
  <div data-gc="configuracoes.campos-de-config.div--3" className="mt-4 flex items-center justify-between gap-4">
    <p data-gc="configuracoes.campos-de-config.p--3" className="text-sm font-medium">{titulo}</p>
    <div data-gc="configuracoes.campos-de-config.div--4" className="w-52">{children}</div>
  </div>
);
