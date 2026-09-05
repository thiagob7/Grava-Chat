import React, { useMemo, useState } from "react";
import { GripVertical, Plus, ShieldQuestion } from "lucide-react";
import type { GuildMember, Permission } from "@gravae/shared";

import { useFindRoles } from "~/@core/application/queries/role/use-find-roles";
import {
  useCreateRole,
  useReorderRoles,
} from "~/@core/application/queries/role/use-save-role";
import type { RoleModel } from "~/@core/domain/models/guild-model";
import { RoleEditor } from "~/features/servidor/components/server-settings/RoleEditor";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface RolesSectionProps {
  guildId: string;
  members: GuildMember[];
  minhasPermissoes: Permission[];
  minhaPosicao: number;
  isOwner: boolean;
}

export const RolesSection: React.FC<RolesSectionProps> = ({
  guildId,
  members,
  minhasPermissoes,
  minhaPosicao,
  isOwner,
}) => {
  const { t } = useTranslation();
  const { data: roles = [], isLoading } = useFindRoles(guildId);
  const createRole = useCreateRole(guildId);
  const reorderRoles = useReorderRoles(guildId);

  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [ordem, setOrdem] = useState<RoleModel[] | null>(null);

  const ordenados = useMemo(() => {
    const lista = [...roles].sort((a, b) => b.position - a.position);
    return lista.filter((r) => !r.isEveryone);
  }, [roles]);

  const everyone = roles.find((r) => r.isEveryone);
  const lista = ordem ?? ordenados;
  const atual = roles.find((r) => r.id === selecionado) ?? everyone ?? roles[0];

  const podeEditar = (role: RoleModel) =>
    isOwner || role.position < minhaPosicao;

  const soltar = (alvoId: string) => {
    if (!arrastando || arrastando === alvoId) return setArrastando(null);

    const base = [...lista];
    const de = base.findIndex((r) => r.id === arrastando);
    const para = base.findIndex((r) => r.id === alvoId);
    if (de < 0 || para < 0) return setArrastando(null);

    const [movido] = base.splice(de, 1);
    base.splice(para, 0, movido!);

    setOrdem(base);
    setArrastando(null);

    const posicoes = base.map((role, indice) => ({
      id: role.id,
      position: base.length - indice,
    }));

    reorderRoles.mutate(
      { guildId, roles: posicoes },
      { onSettled: () => setOrdem(null) },
    );
  };

  return (
    <div data-gc="servidor.server-settings.roles-section.div" className="flex h-full max-w-5xl flex-col">
      <header data-gc="servidor.server-settings.roles-section.header" className="flex items-start gap-4">
        <div data-gc="servidor.server-settings.roles-section.div--2" className="flex-1">
          <h2 data-gc="servidor.server-settings.roles-section.h2" className="text-xl font-semibold">{t("servidor.cargos.titulo")}</h2>
          <p data-gc="servidor.server-settings.roles-section.p" className="mt-1 text-sm text-ink-muted">
            {t("servidor.cargos.descricao")}
          </p>
        </div>

        <Button data-gc="servidor.server-settings.roles-section.button"
          size="sm"
          disabled={createRole.isPending}
          onClick={() =>
            createRole.mutate(
              { guildId, name: "novo cargo" },
              { onSuccess: (role) => setSelecionado(role.id) },
            )
          }
        >
          <Plus data-gc="servidor.server-settings.roles-section.plus" size={16} /> {t("servidor.cargos.criar")}
        </Button>
      </header>

      <div data-gc="servidor.server-settings.roles-section.div--3" className="mt-6 flex min-h-0 flex-1 gap-8">
        <aside data-gc="servidor.server-settings.roles-section.aside" className="w-56 shrink-0 overflow-y-auto">
          {isLoading && <p data-gc="servidor.server-settings.roles-section.p--2" className="text-sm text-ink-faint">{t("comum.carregando")}</p>}

          {lista.map((role) => (
            <button data-gc="servidor.server-settings.roles-section.button--2"
              key={role.id}
              draggable={podeEditar(role)}
              onDragStart={() => setArrastando(role.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => soltar(role.id)}
              onDragEnd={() => setArrastando(null)}
              onClick={() => setSelecionado(role.id)}
              className={cn(
                "group mb-0.5 flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm transition",
                atual?.id === role.id
                  ? "bg-surface-4 text-ink"
                  : "text-ink-muted hover:bg-surface-3",
                arrastando === role.id && "opacity-40",
              )}
            >
              <GripVertical data-gc="servidor.server-settings.roles-section.grip-vertical"
                size={14}
                className={cn(
                  "shrink-0 text-ink-faint transition",
                  podeEditar(role)
                    ? "opacity-0 group-hover:opacity-100"
                    : "opacity-0",
                )}
              />
              <span data-gc="servidor.server-settings.roles-section.span"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: role.color ?? "#99aab5" }}
              />
              <span data-gc="servidor.server-settings.roles-section.span--2" className="truncate">{role.name}</span>
              <span data-gc="servidor.server-settings.roles-section.span--3" className="ml-auto shrink-0 text-xs text-ink-faint">
                {role.memberCount ?? 0}
              </span>
            </button>
          ))}

          {everyone && (
            <button data-gc="servidor.server-settings.roles-section.button--3"
              onClick={() => setSelecionado(everyone.id)}
              className={cn(
                "mt-2 flex w-full items-center gap-2 rounded border-t border-line px-2 py-2 pt-3 text-left text-sm transition",
                atual?.id === everyone.id
                  ? "bg-surface-4 text-ink"
                  : "text-ink-muted hover:bg-surface-3",
              )}
            >
              <ShieldQuestion data-gc="servidor.server-settings.roles-section.shield-question" size={14} className="shrink-0 text-ink-faint" />
              <span data-gc="servidor.server-settings.roles-section.span--4" className="truncate">@everyone</span>
            </button>
          )}
        </aside>

        {atual ? (
          <RoleEditor data-gc="servidor.server-settings.roles-section.role-editor"
            guildId={guildId}
            role={atual}
            members={members}
            minhasPermissoes={minhasPermissoes}
            editavel={podeEditar(atual)}
            onDeleted={() => setSelecionado(null)}
          />
        ) : (
          <p data-gc="servidor.server-settings.roles-section.p--3" className="text-sm text-ink-faint">{t("servidor.cargos.vazio")}</p>
        )}
      </div>
    </div>
  );
};
