import React, { useEffect } from "react";
import type { PerfilPublico, Role } from "@gravae/shared";

import { corDoCargoMaisAlto } from "~/features/perfil/lib/cargo";
import { carregarFonte } from "~/features/perfil/lib/fontes";
import { estiloDoNome } from "~/features/perfil/lib/nome";
import { cn } from "~/lib/utils";

interface UserNameProps {
  nome: string;
  perfil?: PerfilPublico | null;
  roleIds?: string[];
  roles?: Role[];
  corDoCargo?: string | null;
  tamanho?: "sm" | "md";
  animar?: boolean;
  fundo?: string;
  className?: string;
  title?: string;
  ehBot?: boolean;
}

export const UserName: React.FC<UserNameProps> = ({
  nome,
  perfil,
  roleIds,
  roles,
  corDoCargo,
  tamanho = "sm",
  animar = false,
  fundo,
  className,
  title,
  ehBot = false,
}) => {
  useEffect(() => carregarFonte(perfil?.nome?.fonte), [perfil?.nome?.fonte]);

  const cor = corDoCargo ?? (roleIds && roles ? corDoCargoMaisAlto(roleIds, roles) : null);
  const enfeite = estiloDoNome({ estilo: perfil?.nome, corDoCargo: cor, tamanho, animar, fundo });

  const escrito = (
    <span className={cn(className, enfeite.className)} style={enfeite.style} title={title}>
      {nome}
    </span>
  );

  if (!ehBot) return escrito;

  return (
    <span className="inline-flex items-center gap-1.5">
      {escrito}
      <SeloDeApp />
    </span>
  );
};

export const SeloDeApp: React.FC = () => (
  <span className="shrink-0 rounded bg-brand px-1 py-px text-10 font-bold uppercase leading-tight text-white">
    app
  </span>
);
