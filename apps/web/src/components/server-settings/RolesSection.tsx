import React, { useMemo, useState } from "react";
import { GripVertical, Plus, ShieldQuestion } from "lucide-react";
import type { GuildMember, Permission } from "@gravae/shared";

import { useFindRoles } from "~/@core/application/queries/role/use-find-roles";
import { useCreateRole, useReorderRoles } from "~/@core/application/queries/role/use-save-role";
import type { RoleModel } from "~/@core/domain/models/guild-model";
import { RoleEditor } from "~/components/server-settings/RoleEditor";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

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

  const podeEditar = (role: RoleModel) => isOwner || role.position < minhaPosicao;

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

    const posicoes = base.map((role, indice) => ({ id: role.id, position: base.length - indice }));

    reorderRoles.mutate(
      { guildId, roles: posicoes },
      { onSettled: () => setOrdem(null) },
    );
  };

  return (
    <div className="flex h-full max-w-5xl flex-col">
      <header className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Cargos</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Cargos dão nome, cor e poderes. Quem está mais alto na lista manda em quem está abaixo —
            e ninguém mexe em cargo igual ou acima do próprio.
          </p>
        </div>

        <Button
          size="sm"
          disabled={createRole.isPending}
          onClick={() =>
            createRole.mutate(
              { guildId, name: "novo cargo" },
              { onSuccess: (role) => setSelecionado(role.id) },
            )
          }
        >
          <Plus size={16} /> Criar cargo
        </Button>
      </header>

      <div className="mt-6 flex min-h-0 flex-1 gap-8">
        <aside className="w-56 shrink-0 overflow-y-auto">
          {isLoading && <p className="text-sm text-ink-faint">Carregando…</p>}

          {lista.map((role) => (
            <button
              key={role.id}
              draggable={podeEditar(role)}
              onDragStart={() => setArrastando(role.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => soltar(role.id)}
              onDragEnd={() => setArrastando(null)}
              onClick={() => setSelecionado(role.id)}
              className={cn(
                "group mb-0.5 flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm transition",
                atual?.id === role.id ? "bg-surface-4 text-ink" : "text-ink-muted hover:bg-surface-3",
                arrastando === role.id && "opacity-40",
              )}
            >
              <GripVertical
                size={14}
                className={cn(
                  "shrink-0 text-ink-faint transition",
                  podeEditar(role) ? "opacity-0 group-hover:opacity-100" : "opacity-0",
                )}
              />
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: role.color ?? "#99aab5" }}
              />
              <span className="truncate">{role.name}</span>
              <span className="ml-auto shrink-0 text-xs text-ink-faint">{role.memberCount ?? 0}</span>
            </button>
          ))}

          {everyone && (
            <button
              onClick={() => setSelecionado(everyone.id)}
              className={cn(
                "mt-2 flex w-full items-center gap-2 rounded border-t border-line px-2 py-2 pt-3 text-left text-sm transition",
                atual?.id === everyone.id
                  ? "bg-surface-4 text-ink"
                  : "text-ink-muted hover:bg-surface-3",
              )}
            >
              <ShieldQuestion size={14} className="shrink-0 text-ink-faint" />
              <span className="truncate">@everyone</span>
            </button>
          )}
        </aside>

        {atual ? (
          <RoleEditor
            guildId={guildId}
            role={atual}
            members={members}
            minhasPermissoes={minhasPermissoes}
            editavel={podeEditar(atual)}
            onDeleted={() => setSelecionado(null)}
          />
        ) : (
          <p className="text-sm text-ink-faint">Nenhum cargo ainda.</p>
        )}
      </div>
    </div>
  );
};
