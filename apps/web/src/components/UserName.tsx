import React from "react";
import type { PerfilPublico, Role } from "@gravae/shared";

import { corDoCargoMaisAlto } from "~/lib/cosmeticos/cargo";
import { estiloDoNome } from "~/lib/cosmeticos/nome";
import { cn } from "~/lib/utils";

interface UserNameProps {
  /** o que aparece: apelido do servidor quando existe, senão o nome de exibição */
  nome: string;
  /** enfeites de quem é dono do nome; `null` para quem nunca mexeu */
  perfil?: PerfilPublico | null;
  /**
   * De onde tirar a cor do cargo. Passar `roleIds` + `roles` deixa a busca do
   * cargo mais alto aqui dentro; quem já a fez passa `corDoCargo` direto.
   */
  roleIds?: string[];
  roles?: Role[];
  corDoCargo?: string | null;
  /** `md` libera os efeitos que recortam o texto; ver `lib/cosmeticos/nome.ts` */
  tamanho?: "sm" | "md";
  animar?: boolean;
  /** o fundo contra o qual medir o contraste, quando não for o padrão do tema */
  fundo?: string;
  className?: string;
  title?: string;
}

/**
 * O nome de uma pessoa, em um lugar só.
 *
 * Hoje `{displayName}` está solto em ~35 pontos do app, o que é a razão de a
 * cor do cargo nunca ter chegado ao chat: não havia onde aplicá-la. Este
 * componente é o lugar.
 *
 * **É sempre um `<span>`, nunca um `<button>`.** Quase todo call site já
 * embrulha o nome num botão — o gatilho do `UserProfilePopover`, o item da
 * lista de membros — e botão dentro de botão é HTML inválido: o React não
 * reclama, o navegador reaninha a árvore e o clique de dentro para de existir.
 */
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
}) => {
  const cor = corDoCargo ?? (roleIds && roles ? corDoCargoMaisAlto(roleIds, roles) : null);
  const enfeite = estiloDoNome({ estilo: perfil?.nome, corDoCargo: cor, tamanho, animar, fundo });

  return (
    <span className={cn(className, enfeite.className)} style={enfeite.style} title={title}>
      {nome}
    </span>
  );
};
