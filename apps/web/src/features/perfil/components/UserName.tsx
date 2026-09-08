import React, { useEffect } from "react";
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
  /// O selo miúdo é o das listas; o de sempre, o do resto.
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

/*
  Dois selos, e a diferença importa.

  "bot" é o que alguém criou com código: tem token, responde sozinho, e dá
  para conversar com ele. "sistema" é a conta da casa — quem escreve por ela
  é a própria API, e ninguém responde ali.

  O tamanho segue o da referência, que tem três: o miúdo para lista, o de
  sempre para o resto.
*/
export const SeloDeApp: React.FC<{ sistema?: boolean; tamanho?: "sm" | "md" }> = ({
  sistema = false,
  tamanho = "md",
}) => (
  <span data-gc="perfil.user-name.span--3"
    {...flx(
      tamanho === "sm" ? "seloDeAppMiudo" : "seloDeApp",
      cn(
        "shrink-0 rounded-[3px] bg-brand font-bold uppercase text-sobre-marca",
        tamanho === "sm" ? "px-1 py-0 text-[0.5625rem] leading-[1.35]" : "px-1 py-px text-10 leading-tight",
      ),
    )}
  >
    {sistema ? "sistema" : "bot"}
  </span>
);
