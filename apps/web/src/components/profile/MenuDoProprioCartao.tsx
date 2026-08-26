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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

const ESTADOS: {
  id: DesiredStatus;
  rotulo: string;
  descricao?: string;
  cor: string;
}[] = [
  { id: "ONLINE", rotulo: "Disponível", cor: "bg-online" },
  { id: "IDLE", rotulo: "Ausente", cor: "bg-idle" },
  {
    id: "DND",
    rotulo: "Não perturbar",
    descricao: "Você não recebe aviso de mensagem nova",
    cor: "bg-dnd",
  },
  {
    id: "INVISIBLE",
    rotulo: "Invisível",
    descricao: "Você aparece offline para os outros",
    cor: "bg-ink-faint",
  },
];

export const ROTULO_DO_ESTADO: Record<DesiredStatus, string> = {
  ONLINE: "Disponível",
  IDLE: "Ausente",
  DND: "Não perturbar",
  INVISIBLE: "Invisível",
};

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
  const atual = user.desiredStatus;
  const estadoAtual = ESTADOS.find((e) => e.id === atual) ?? ESTADOS[0]!;

  return (
    <div className="mt-4 space-y-1 rounded bg-surface-1 p-1.5">
      <ItemDoMenu icone={<Pencil size={15} />} onClick={onEditarPerfil}>
        Editar perfil
      </ItemDoMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink">
            <span className={cn("size-3 shrink-0 rounded-full", estadoAtual.cor)} />
            <span className="flex-1">{estadoAtual.rotulo}</span>
            <span className="text-ink-faint">›</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" className="w-64">
          {ESTADOS.map((estado) => (
            <DropdownMenuItem key={estado.id} onSelect={() => void updatePresence(estado.id)}>
              <span className={cn("size-2.5 shrink-0 rounded-full", estado.cor)} />
              <span className="min-w-0 flex-1">
                <span className="block">{estado.rotulo}</span>
                {estado.descricao && (
                  <span className="block text-xs text-ink-faint">{estado.descricao}</span>
                )}
              </span>
              {atual === estado.id && <Check size={14} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenuSeparator />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink">
            <UserCircle size={15} className="shrink-0" />
            <span className="flex-1">Mudar de conta</span>
            <span className="text-ink-faint">›</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" className="w-56">
          <DropdownMenuItem onSelect={() => undefined}>
            <span className="min-w-0 flex-1 truncate">@{user.username}</span>
            <Check size={14} />
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={onGerenciarContas}>
            Gerenciar contas <Settings size={14} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ItemDoMenu
        icone={<IdCard size={15} />}
        onClick={() => {
          void navigator.clipboard.writeText(user.id);
          toast.success("ID copiado.");
        }}
      >
        Copiar ID do usuário
      </ItemDoMenu>
    </div>
  );
};

const ItemDoMenu: React.FC<{
  icone: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ icone, onClick, children }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink"
  >
    <span className="shrink-0">{icone}</span>
    {children}
  </button>
);
