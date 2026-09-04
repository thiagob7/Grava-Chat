import React from "react";

import { Switch } from "~/components/ui/switch";

export const Opcao: React.FC<{
  titulo: string;
  detalhe: string;
  ligado: boolean;
  onMudar: (valor: boolean) => void;
}> = ({ titulo, detalhe, ligado, onMudar }) => (
  <div className="mt-4 flex items-start gap-4 first:mt-0">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{titulo}</p>
      <p className="mt-0.5 text-xs text-ink-faint">{detalhe}</p>
    </div>
    <Switch checked={ligado} onCheckedChange={onMudar} />
  </div>
);

export const Linha: React.FC<{ titulo: string; children: React.ReactNode }> = ({
  titulo,
  children,
}) => (
  <div className="mt-4 flex items-center justify-between gap-4">
    <p className="text-sm font-medium">{titulo}</p>
    <div className="w-52">{children}</div>
  </div>
);
