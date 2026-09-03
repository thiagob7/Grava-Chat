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
import { i18next, useTranslation } from "~/traducao";

/*
  A lista guarda a CHAVE, e não o texto.

  Ela vive fora do componente — é uma constante de módulo, avaliada uma vez na
  carga do arquivo. Com o texto escrito aqui, ele seria o texto do idioma que
  estava valendo naquele instante e nunca mais mudaria; trocar de idioma
  redesenharia o menu inteiro com os quatro estados ainda em português.
*/
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

/// Usado pelo `UserPanel`, que mostra o estado embaixo do nome. Função e não
/// mapa, pelo mesmo motivo da lista acima: mapa de módulo congela o idioma.
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
    <div className="mt-4 space-y-1 rounded bg-surface-1 p-1.5">
      <ItemDoMenu icone={<Pencil size={15} />} onClick={onEditarPerfil}>
        {t("perfil.editar")}
      </ItemDoMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink">
            <span className={cn("size-3 shrink-0 rounded-full", estadoAtual.cor)} />
            <span className="flex-1">{t(`perfil.presenca.${estadoAtual.chave}`)}</span>
            <span className="text-ink-faint">›</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" className="w-64">
          {ESTADOS.map((estado) => (
            <DropdownMenuItem key={estado.id} onSelect={() => void updatePresence(estado.id)}>
              <span className={cn("size-2.5 shrink-0 rounded-full", estado.cor)} />
              <span className="min-w-0 flex-1">
                <span className="block">{t(`perfil.presenca.${estado.chave}`)}</span>
                {estado.detalhe && (
                  <span className="block text-xs text-ink-faint">
                    {t(`perfil.presenca.${estado.detalhe}`)}
                  </span>
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
            <span className="flex-1">{t("perfil.menu.mudarDeConta")}</span>
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
            {t("perfil.menu.gerenciarContas")} <Settings size={14} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ItemDoMenu
        icone={<IdCard size={15} />}
        onClick={() => {
          void navigator.clipboard.writeText(user.id);
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
  <button
    onClick={onClick}
    className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink"
  >
    <span className="shrink-0">{icone}</span>
    {children}
  </button>
);
