import React, { useEffect } from "react";
import { Check } from "@phosphor-icons/react";
import type { PerfilPublico, Role } from "@gravae/shared";

import { corDoCargoMaisAlto } from "~/features/perfil/lib/cargo";
import { carregarFonte } from "~/features/perfil/lib/fontes";
import { estiloDoNome } from "~/features/perfil/lib/nome";
import { cn } from "~/lib/utils";
import { flx } from "~/lib/compat-de-tema";

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
  ehSistema?: boolean;
  selo?: "sm" | "md";
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
  ehSistema = false,
  selo = "md",
}) => {
  useEffect(() => carregarFonte(perfil?.nome?.fonte), [perfil?.nome?.fonte]);

  const cor = corDoCargo ?? (roleIds && roles ? corDoCargoMaisAlto(roleIds, roles) : null);
  const enfeite = estiloDoNome({ estilo: perfil?.nome, corDoCargo: cor, tamanho, animar, fundo });

  const escrito = (
    <span data-gc="perfil.user-name.span" className={cn(className, enfeite.className)} style={enfeite.style} title={title}>
      {nome}
    </span>
  );

  if (!ehBot && !ehSistema) return escrito;

  return (
    <span data-gc="perfil.user-name.span--2" className="inline-flex items-center gap-1.5">
      {escrito}
      <SeloDeApp data-gc="perfil.user-name.selo-de-app" sistema={ehSistema} tamanho={selo} />
    </span>
  );
};

export const SeloDeApp: React.FC<{ sistema?: boolean; tamanho?: "sm" | "md" }> = ({
  sistema = false,
  tamanho = "md",
}) => (
  <span data-gc="perfil.user-name.span--3"
    {...flx(
      tamanho === "sm" ? "seloDeAppMiudo" : "seloDeApp",
      cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-[3px] bg-brand font-bold uppercase text-sobre-marca",
        tamanho === "sm" ? "px-1 py-0 text-[0.5625rem] leading-[1.35]" : "px-1 py-px text-10 leading-tight",
      ),
    )}
  >
    {sistema && <Check data-gc="perfil.user-name.check" size={tamanho === "sm" ? 8 : 10} weight="bold" />}
    {sistema ? "oficial" : "bot"}
  </span>
);
