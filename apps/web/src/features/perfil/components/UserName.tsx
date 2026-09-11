import React, { useEffect } from "react";
import { Check } from "@phosphor-icons/react";
import type { ProfilePublic, Role } from "@gravae/shared";

import { roleMoreHighColor } from "~/features/perfil/lib/cargo";
import { loadFont } from "~/features/perfil/lib/fontes";
import { nameStyle } from "~/features/perfil/lib/nome";
import { cn } from "~/lib/utils";
import { flx } from "~/lib/compat-de-tema";

interface UserNameProps {
  name: string;
  profile?: ProfilePublic | null;
  roleIds?: string[];
  roles?: Role[];
  roleColor?: string | null;
  size?: "sm" | "md";
  animate?: boolean;
  background?: string;
  className?: string;
  title?: string;
  isBot?: boolean;
  isSystem?: boolean;
  seal?: "sm" | "md";
}

export const UserName: React.FC<UserNameProps> = ({
  name,
  profile,
  roleIds,
  roles,
  roleColor,
  size = "sm",
  animate = false,
  background,
  className,
  title,
  isBot = false,
  isSystem = false,
  seal = "md",
}) => {
  useEffect(() => loadFont(profile?.name?.font), [profile?.name?.font]);

  const color = roleColor ?? (roleIds && roles ? roleMoreHighColor(roleIds, roles) : null);
  const charm = nameStyle({ style: profile?.name, roleColor: color, size, animate, background });

  const written = (
    <span data-gc="perfil.user-name.span" className={cn(className, charm.className)} style={charm.style} title={title}>
      {name}
    </span>
  );

  if (!isBot && !isSystem) return written;

  return (
    <span data-gc="perfil.user-name.span--2" className="inline-flex items-center gap-1.5">
      {written}
      <AppSeal data-gc="perfil.user-name.app-seal" system={isSystem} size={seal} />
    </span>
  );
};

export const AppSeal: React.FC<{ system?: boolean; size?: "sm" | "md" }> = ({
  system = false,
  size = "md",
}) => (
  <span data-gc="perfil.user-name.span--3"
    {...flx(
      size === "sm" ? "appTinySeal" : "appSeal",
      cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-[3px] bg-brand font-bold uppercase text-sobre-marca",
        size === "sm" ? "px-1 py-0 text-[0.5625rem] leading-[1.35]" : "px-1 py-px text-10 leading-tight",
      ),
    )}
  >
    {system && <Check data-gc="perfil.user-name.check" size={size === "sm" ? 8 : 10} weight="bold" />}
    {system ? "oficial" : "bot"}
  </span>
);
