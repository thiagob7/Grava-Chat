import React from "react";

import { Switch } from "~/components/ui/switch";

/*
  As duas formas que uma preferência assume nas configurações.

  Estavam dentro da tela de Aparência, e ficaram presas lá: quando o Bate-papo
  virou tela própria, copiá-las seria garantir que uma das cópias envelhecesse
  sozinha — o dia em que o espaçamento de uma mudasse, as telas ficariam
  desalinhadas sem ninguém notar.
*/

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
