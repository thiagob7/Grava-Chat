import React from "react";
import { toast } from "react-toastify";
import { Check, IdCard, Pencil, Settings, UserCircle } from "lucide-react";
import type { DesiredStatus } from "@gravae/shared";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { updatePresence } from "~/@core/lib/websocket/emit-message-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { StatusIcon, type StatusKind } from "~/features/perfil/components/IconeDeStatus";
import { copyText } from "~/lib/copiar";
import { cn } from "~/lib/utils";
import { i18next, useTranslation } from "~/traducao";

const STATES: {
  id: DesiredStatus;
  key: string;
  detail?: string;
  icon: StatusKind;
}[] = [
  { id: "ONLINE", key: "disponivel", icon: "ONLINE" },
  { id: "IDLE", key: "ausente", icon: "IDLE" },
  {
    id: "DND",
    key: "naoPerturbar",
    detail: "naoPerturbarDetalhe",
    icon: "DND",
  },
  {
    id: "INVISIBLE",
    key: "invisivel",
    detail: "invisivelDetalhe",
    icon: "OFFLINE",
  },
];

export function stateLabel(id: DesiredStatus): string {
  const state = STATES.find((e) => e.id === id) ?? STATES[0]!;
  return i18next.t(`perfil.presenca.${state.key}`);
}

interface OwnCardPropsMenu {
  user: SelfUserModel;
  onEditProfile: () => void;
  onManageAccounts: () => void;
}

export const OwnCardMenu: React.FC<OwnCardPropsMenu> = ({
  user,
  onEditProfile,
  onManageAccounts,
}) => {
  const { t } = useTranslation();
  const current = user.desiredStatus;
  const currentState = STATES.find((e) => e.id === current) ?? STATES[0]!;

  return (
    <div data-gc="perfil.cartao.menu-do-proprio-cartao.div" className="mt-3 space-y-0.5 border-t border-line pt-3">
      <ItemDoMenu data-gc="perfil.cartao.menu-do-proprio-cartao.item-do-menu.on-edit-profile" icon={<Pencil data-gc="perfil.cartao.menu-do-proprio-cartao.pencil" size={15} />} onClick={onEditProfile}>
        {t("perfil.editar")}
      </ItemDoMenu>

      <DropdownMenu data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu">
        <DropdownMenuTrigger data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-trigger" asChild>
          <button data-gc="perfil.cartao.menu-do-proprio-cartao.button" className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink">
            <StatusIcon data-gc="perfil.cartao.menu-do-proprio-cartao.status-icon" kind={currentState.icon} size={12} className="shrink-0" />
            <span data-gc="perfil.cartao.menu-do-proprio-cartao.span" className="flex-1">{t(`perfil.presenca.${currentState.key}`)}</span>
            <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--2" className="text-ink-faint">›</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-content" side="right" align="start" className="w-64">
          {STATES.map((state) => (
            <DropdownMenuItem data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-item" key={state.id} onSelect={() => void updatePresence(state.id)}>
              <StatusIcon data-gc="perfil.cartao.menu-do-proprio-cartao.status-icon--2" kind={state.icon} size={11} className="shrink-0" />
              <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--3" className="min-w-0 flex-1">
                <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--4" className="block">{t(`perfil.presenca.${state.key}`)}</span>
                {state.detail && (
                  <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--5" className="block text-xs text-ink-faint">
                    {t(`perfil.presenca.${state.detail}`)}
                  </span>
                )}
              </span>
              {current === state.id && <Check data-gc="perfil.cartao.menu-do-proprio-cartao.check" size={14} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div data-gc="perfil.cartao.menu-do-proprio-cartao.div--2" className="my-1 h-px bg-line" />

      <DropdownMenu data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu--2">
        <DropdownMenuTrigger data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-trigger--2" asChild>
          <button data-gc="perfil.cartao.menu-do-proprio-cartao.button--2" className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink">
            <UserCircle data-gc="perfil.cartao.menu-do-proprio-cartao.user-circle" size={15} className="shrink-0" />
            <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--6" className="flex-1">{t("perfil.menu.mudarDeConta")}</span>
            <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--7" className="text-ink-faint">›</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-content--2" side="right" align="start" className="w-56">
          <DropdownMenuItem data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-item--2" onSelect={() => undefined}>
            <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--8" className="min-w-0 flex-1 truncate">@{user.username}</span>
            <Check data-gc="perfil.cartao.menu-do-proprio-cartao.check--2" size={14} />
          </DropdownMenuItem>

          <DropdownMenuSeparator data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-separator" />

          <DropdownMenuItem data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-item.on-manage-accounts" onSelect={onManageAccounts}>
            {t("perfil.menu.gerenciarContas")} <Settings data-gc="perfil.cartao.menu-do-proprio-cartao.settings" size={14} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ItemDoMenu data-gc="perfil.cartao.menu-do-proprio-cartao.item-do-menu"
        icon={<IdCard data-gc="perfil.cartao.menu-do-proprio-cartao.id-card" size={15} />}
        onClick={() => {
          void copyText(user.id);
          toast.success(t("perfil.idCopiado"));
        }}
      >
        {t("perfil.copiarId")}
      </ItemDoMenu>
    </div>
  );
};

const ItemDoMenu: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ icon, onClick, children }) => (
  <button data-gc="perfil.cartao.menu-do-proprio-cartao.button.on-click"
    onClick={onClick}
    className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink"
  >
    <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--9" className="shrink-0">{icon}</span>
    {children}
  </button>
);
