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
  minePermissions: Permission[];
  myPosition: number;
  isOwner: boolean;
}

export const RolesSection: React.FC<RolesSectionProps> = ({
  guildId,
  members,
  minePermissions,
  myPosition,
  isOwner,
}) => {
  const { t } = useTranslation();
  const { data: roles = [], isLoading } = useFindRoles(guildId);
  const createRole = useCreateRole(guildId);
  const reorderRoles = useReorderRoles(guildId);

  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [order, setOrder] = useState<RoleModel[] | null>(null);

  const ordered = useMemo(() => {
    const list = [...roles].sort((a, b) => b.position - a.position);
    return list.filter((r) => !r.isEveryone);
  }, [roles]);

  const everyone = roles.find((r) => r.isEveryone);
  const list = order ?? ordered;
  const current = roles.find((r) => r.id === selected) ?? everyone ?? roles[0];

  const canEdit = (role: RoleModel) =>
    isOwner || role.position < myPosition;

  const drop = (targetId: string) => {
    if (!dragging || dragging === targetId) return setDragging(null);

    const base = [...list];
    const de = base.findIndex((r) => r.id === dragging);
    const toward = base.findIndex((r) => r.id === targetId);
    if (de < 0 || toward < 0) return setDragging(null);

    const [moved] = base.splice(de, 1);
    base.splice(toward, 0, moved!);

    setOrder(base);
    setDragging(null);

    const positions = base.map((role, index) => ({
      id: role.id,
      position: base.length - index,
    }));

    reorderRoles.mutate(
      { guildId, roles: positions },
      { onSettled: () => setOrder(null) },
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
              { onSuccess: (role) => setSelected(role.id) },
            )
          }
        >
          <Plus data-gc="servidor.server-settings.roles-section.plus" size={16} /> {t("servidor.cargos.criar")}
        </Button>
      </header>

      <div data-gc="servidor.server-settings.roles-section.div--3" className="mt-6 flex min-h-0 flex-1 gap-8">
        <aside data-gc="servidor.server-settings.roles-section.aside" className="w-56 shrink-0 overflow-y-auto">
          {isLoading && <p data-gc="servidor.server-settings.roles-section.p--2" className="text-sm text-ink-faint">{t("comum.carregando")}</p>}

          {list.map((role) => (
            <button data-gc="servidor.server-settings.roles-section.button--2"
              key={role.id}
              draggable={canEdit(role)}
              onDragStart={() => setDragging(role.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(role.id)}
              onDragEnd={() => setDragging(null)}
              onClick={() => setSelected(role.id)}
              className={cn(
                "group mb-0.5 flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm transition",
                current?.id === role.id
                  ? "bg-surface-4 text-ink"
                  : "text-ink-muted hover:bg-surface-3",
                dragging === role.id && "opacity-40",
              )}
            >
              <GripVertical data-gc="servidor.server-settings.roles-section.grip-vertical"
                size={14}
                className={cn(
                  "shrink-0 text-ink-faint transition",
                  canEdit(role)
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
              onClick={() => setSelected(everyone.id)}
              className={cn(
                "mt-2 flex w-full items-center gap-2 rounded border-t border-line px-2 py-2 pt-3 text-left text-sm transition",
                current?.id === everyone.id
                  ? "bg-surface-4 text-ink"
                  : "text-ink-muted hover:bg-surface-3",
              )}
            >
              <ShieldQuestion data-gc="servidor.server-settings.roles-section.shield-question" size={14} className="shrink-0 text-ink-faint" />
              <span data-gc="servidor.server-settings.roles-section.span--4" className="truncate">@everyone</span>
            </button>
          )}
        </aside>

        {current ? (
          <RoleEditor data-gc="servidor.server-settings.roles-section.role-editor"
            guildId={guildId}
            role={current}
            members={members}
            minePermissions={minePermissions}
            editable={canEdit(current)}
            onDeleted={() => setSelected(null)}
          />
        ) : (
          <p data-gc="servidor.server-settings.roles-section.p--3" className="text-sm text-ink-faint">{t("servidor.cargos.vazio")}</p>
        )}
      </div>
    </div>
  );
};
