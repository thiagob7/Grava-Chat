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
import { copiarTexto } from "~/lib/copiar";
import { cn } from "~/lib/utils";
import { i18next, useTranslation } from "~/traducao";

const ESTADOS: {
  id: DesiredStatus;
  chave: string;
  detalhe?: string;
  cor: string;
}[] = [
  { id: "ONLINE", chave: "disponivel", cor: "bg-online" },
  { id: "IDLE", chave: "ausente", cor: "bg-idle" },
  {
    id: "DND",
    chave: "naoPerturbar",
    detalhe: "naoPerturbarDetalhe",
    cor: "bg-dnd",
  },
  {
    id: "INVISIBLE",
    chave: "invisivel",
    detalhe: "invisivelDetalhe",
    cor: "bg-ink-faint",
  },
];

export function rotuloDoEstado(id: DesiredStatus): string {
  const estado = ESTADOS.find((e) => e.id === id) ?? ESTADOS[0]!;
  return i18next.t(`perfil.presenca.${estado.chave}`);
}

interface MenuDoProprioCartaoProps {
  user: SelfUserModel;
  onEditarPerfil: () => void;
  onGerenciarContas: () => void;
}

export const MenuDoProprioCartao: React.FC<MenuDoProprioCartaoProps> = ({
  user,
  onEditarPerfil,
  onGerenciarContas,
}) => {
  const { t } = useTranslation();
  const atual = user.desiredStatus;
  const estadoAtual = ESTADOS.find((e) => e.id === atual) ?? ESTADOS[0]!;

  return (
    <div data-gc="perfil.cartao.menu-do-proprio-cartao.div" className="mt-3 space-y-0.5 border-t border-line pt-3">
      <ItemDoMenu data-gc="perfil.cartao.menu-do-proprio-cartao.item-do-menu.on-editar-perfil" icone={<Pencil data-gc="perfil.cartao.menu-do-proprio-cartao.pencil" size={15} />} onClick={onEditarPerfil}>
        {t("perfil.editar")}
      </ItemDoMenu>

      <DropdownMenu data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu">
        <DropdownMenuTrigger data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-trigger" asChild>
          <button data-gc="perfil.cartao.menu-do-proprio-cartao.button" className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink">
            <span data-gc="perfil.cartao.menu-do-proprio-cartao.span" className={cn("size-3 shrink-0 rounded-full", estadoAtual.cor)} />
            <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--2" className="flex-1">{t(`perfil.presenca.${estadoAtual.chave}`)}</span>
            <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--3" className="text-ink-faint">›</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-content" side="right" align="start" className="w-64">
          {ESTADOS.map((estado) => (
            <DropdownMenuItem data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-item" key={estado.id} onSelect={() => void updatePresence(estado.id)}>
              <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--4" className={cn("size-2.5 shrink-0 rounded-full", estado.cor)} />
              <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--5" className="min-w-0 flex-1">
                <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--6" className="block">{t(`perfil.presenca.${estado.chave}`)}</span>
                {estado.detalhe && (
                  <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--7" className="block text-xs text-ink-faint">
                    {t(`perfil.presenca.${estado.detalhe}`)}
                  </span>
                )}
              </span>
              {atual === estado.id && <Check data-gc="perfil.cartao.menu-do-proprio-cartao.check" size={14} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div data-gc="perfil.cartao.menu-do-proprio-cartao.div--2" className="my-1 h-px bg-line" />

      <DropdownMenu data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu--2">
        <DropdownMenuTrigger data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-trigger--2" asChild>
          <button data-gc="perfil.cartao.menu-do-proprio-cartao.button--2" className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink">
            <UserCircle data-gc="perfil.cartao.menu-do-proprio-cartao.user-circle" size={15} className="shrink-0" />
            <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--8" className="flex-1">{t("perfil.menu.mudarDeConta")}</span>
            <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--9" className="text-ink-faint">›</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-content--2" side="right" align="start" className="w-56">
          <DropdownMenuItem data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-item--2" onSelect={() => undefined}>
            <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--10" className="min-w-0 flex-1 truncate">@{user.username}</span>
            <Check data-gc="perfil.cartao.menu-do-proprio-cartao.check--2" size={14} />
          </DropdownMenuItem>

          <DropdownMenuSeparator data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-separator" />

          <DropdownMenuItem data-gc="perfil.cartao.menu-do-proprio-cartao.dropdown-menu-item.on-gerenciar-contas" onSelect={onGerenciarContas}>
            {t("perfil.menu.gerenciarContas")} <Settings data-gc="perfil.cartao.menu-do-proprio-cartao.settings" size={14} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ItemDoMenu data-gc="perfil.cartao.menu-do-proprio-cartao.item-do-menu"
        icone={<IdCard data-gc="perfil.cartao.menu-do-proprio-cartao.id-card" size={15} />}
        onClick={() => {
          void copiarTexto(user.id);
          toast.success(t("perfil.idCopiado"));
        }}
      >
        {t("perfil.copiarId")}
      </ItemDoMenu>
    </div>
  );
};

const ItemDoMenu: React.FC<{
  icone: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ icone, onClick, children }) => (
  <button data-gc="perfil.cartao.menu-do-proprio-cartao.button.on-click"
    onClick={onClick}
    className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink"
  >
    <span data-gc="perfil.cartao.menu-do-proprio-cartao.span--11" className="shrink-0">{icone}</span>
    {children}
  </button>
);
