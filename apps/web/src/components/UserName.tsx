import React, { useEffect } from "react";
import type { PerfilPublico, Role } from "@gravae/shared";

import { corDoCargoMaisAlto } from "~/lib/cosmeticos/cargo";
import { carregarFonte } from "~/lib/cosmeticos/fontes";
import { estiloDoNome } from "~/lib/cosmeticos/nome";
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
  /// conta de bot: ganha o selo "APP" ao lado do nome, como no Discord
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

  /*
    O selo fica FORA do span do nome porque o nome pode ter enfeite —
    gradiente, neon, fonte própria. Herdar isso deixaria o "APP" ilegível, e
    ele existe justamente para ser lido de relance.
  */
  return (
    <span className="inline-flex items-center gap-1.5">
      {escrito}
      <SeloDeApp />
    </span>
  );
};

export const SeloDeApp: React.FC = () => (
  <span className="shrink-0 rounded bg-brand px-1 py-px text-[9px] font-bold uppercase leading-tight text-white">
    app
  </span>
);
