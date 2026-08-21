import React, { useEffect, useMemo, useState } from "react";
import { Check, Search, Trash2, UserMinus, X } from "lucide-react";
import type { GuildMember, Permission } from "@gravae/shared";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@gravae/shared";

import { useUpdateRole, useDeleteRole } from "~/@core/application/queries/role/use-save-role";
import { useSetMemberRoles } from "~/@core/application/queries/role/use-set-member-roles";
import type { RoleModel } from "~/@core/domain/models/guild-model";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";

/** Paleta do Discord, que é escolhida pra ler bem em fundo escuro. */
export const CORES = [
  "#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#e91e63",
  "#f1c40f", "#e67e22", "#e74c3c", "#95a5a6", "#607d8b",
];

type Aba = "exibicao" | "permissoes" | "membros";

interface RoleEditorProps {
  guildId: string;
  role: RoleModel;
  members: GuildMember[];
  /** o que EU tenho — não dá pra conceder o que não se tem */
  minhasPermissoes: Permission[];
  /** posso mexer neste cargo? (hierarquia decidida no servidor, refletida aqui) */
  editavel: boolean;
  onDeleted: () => void;
}

export const RoleEditor: React.FC<RoleEditorProps> = ({
  guildId,
  role,
  members,
  minhasPermissoes,
  editavel,
  onDeleted,
}) => {
  const updateRole = useUpdateRole(guildId);
  const deleteRole = useDeleteRole(guildId);
  const setMemberRoles = useSetMemberRoles(guildId);

  const [aba, setAba] = useState<Aba>("exibicao");
  const [nome, setNome] = useState(role.name);
  const [cor, setCor] = useState<string | null>(role.color);
  const [hoist, setHoist] = useState(role.hoist);
  const [mentionable, setMentionable] = useState(role.mentionable);
  const [permissoes, setPermissoes] = useState<Permission[]>(role.permissions as Permission[]);
  const [busca, setBusca] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  // trocar de cargo na lista tem que jogar fora o rascunho do anterior
  useEffect(() => {
    setNome(role.name);
    setCor(role.color);
    setHoist(role.hoist);
    setMentionable(role.mentionable);
    setPermissoes(role.permissions as Permission[]);
    setConfirmando(false);
  }, [role]);

  const souAdmin = minhasPermissoes.includes("ADMINISTRATOR");
  const posso = (permissao: Permission) => souAdmin || minhasPermissoes.includes(permissao);

  const sujo = useMemo(() => {
    const mesmasPermissoes =
      permissoes.length === role.permissions.length &&
      permissoes.every((p) => role.permissions.includes(p));

    return (
      nome !== role.name ||
      cor !== role.color ||
      hoist !== role.hoist ||
      mentionable !== role.mentionable ||
      !mesmasPermissoes
    );
  }, [nome, cor, hoist, mentionable, permissoes, role]);

  const salvar = () => {
    updateRole.mutate({
      guildId,
      roleId: role.id,
      permissions: permissoes,
      // o @everyone só aceita permissões: nome e cor dele não existem
      ...(role.isEveryone ? {} : { name: nome, color: cor, hoist, mentionable }),
    });
  };

  const comOCargo = members.filter((m) => m.roleIds.includes(role.id));
  const termo = busca.trim().toLowerCase();
  const candidatos = termo
    ? members
        .filter((m) => !m.roleIds.includes(role.id))
        .filter(
          (m) =>
            m.user.displayName.toLowerCase().includes(termo) ||
            m.user.username.toLowerCase().includes(termo),
        )
        .slice(0, 8)
    : [];

  const mudarCargoDe = (member: GuildMember, incluir: boolean) => {
    const roleIds = incluir
      ? [...member.roleIds, role.id]
      : member.roleIds.filter((id) => id !== role.id);

    setMemberRoles.mutate({ guildId, userId: member.user.id, roleIds });
    setBusca("");
  };

  const abas: { id: Aba; label: string }[] = [
    ...(role.isEveryone ? [] : [{ id: "exibicao" as const, label: "Exibição" }]),
    { id: "permissoes", label: "Permissões" },
    ...(role.isEveryone ? [] : [{ id: "membros" as const, label: `Membros — ${comOCargo.length}` }]),
  ];

  const abaAtiva = abas.some((a) => a.id === aba) ? aba : "permissoes";

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: cor ?? "#99aab5" }}
        />
        <h3 className="truncate text-lg font-semibold">
          {role.isEveryone ? "@everyone" : (nome || "Cargo sem nome")}
        </h3>

        {!role.isEveryone && editavel && (
          <button
            onClick={() => setConfirmando(true)}
            className="ml-auto rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-danger"
            title="Apagar cargo"
          >
            <Trash2 size={18} />
          </button>
        )}
      </header>

      {role.isEveryone && (
        <p className="mt-1 text-xs text-ink-faint">
          Vale para todo mundo no servidor. É a base sobre a qual os outros cargos somam.
        </p>
      )}

      {confirmando && (
        <div className="mt-4 rounded border border-danger/40 bg-danger/10 p-4">
          <p className="text-sm">
            Apagar <strong>{role.name}</strong>? Quem tem esse cargo perde o que ele dava.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="danger"
              size="sm"
              disabled={deleteRole.isPending}
              onClick={() =>
                deleteRole.mutate({ guildId, roleId: role.id }, { onSuccess: onDeleted })
              }
            >
              Apagar cargo
            </Button>
            <Button variant="surface" size="sm" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <nav className="mt-5 flex gap-4 border-b border-line">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={cn(
              "-mb-px border-b-2 pb-2 text-sm transition",
              abaAtiva === a.id
                ? "border-brand text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {a.label}
          </button>
        ))}
      </nav>

      <div className="mt-5 flex-1">
        {abaAtiva === "exibicao" && (
          <div className="max-w-md space-y-6">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Nome do cargo
              </span>
              <Input
                value={nome}
                disabled={!editavel}
                maxLength={48}
                onChange={(e) => setNome(e.target.value)}
              />
            </label>

            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Cor do cargo
              </span>
              <p className="mb-3 text-xs text-ink-faint">
                Pinta o nome de quem tem o cargo na lista de membros e no chat.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => editavel && setCor(null)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded border border-line bg-surface-0 text-ink-faint transition",
                    cor === null && "ring-2 ring-brand",
                  )}
                  title="Sem cor"
                >
                  <X size={14} />
                </button>

                {CORES.map((c) => (
                  <button
                    key={c}
                    onClick={() => editavel && setCor(c)}
                    style={{ backgroundColor: c }}
                    className={cn(
                      "flex size-8 items-center justify-center rounded transition",
                      cor === c && "ring-2 ring-ink",
                    )}
                  >
                    {cor === c && <Check size={14} className="text-white" />}
                  </button>
                ))}

                <input
                  type="color"
                  value={cor ?? "#99aab5"}
                  disabled={!editavel}
                  onChange={(e) => setCor(e.target.value)}
                  className="size-8 cursor-pointer rounded border border-line bg-transparent"
                  title="Cor personalizada"
                />
              </div>
            </div>

            <Linha
              titulo="Exibir separado dos outros membros"
              descricao="O cargo ganha uma seção própria na lista de membros."
              checked={hoist}
              disabled={!editavel}
              onChange={setHoist}
            />

            <Linha
              titulo="Permitir mencionar este cargo"
              descricao="Qualquer um poderá notificar todo mundo que tem o cargo."
              checked={mentionable}
              disabled={!editavel}
              onChange={setMentionable}
            />
          </div>
        )}

        {abaAtiva === "permissoes" && (
          <div className="max-w-2xl space-y-7">
            {PERMISSION_GROUPS.map((grupo) => (
              <section key={grupo.label}>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {grupo.label}
                </h4>

                <div className="space-y-4">
                  {grupo.permissions.map((permissao) => {
                    const rotulo = PERMISSION_LABELS[permissao];
                    const bloqueado = !editavel || !posso(permissao);

                    return (
                      <Linha
                        key={permissao}
                        titulo={rotulo.nome}
                        descricao={
                          bloqueado && editavel
                            ? `${rotulo.descricao} (você não tem esta permissão para conceder)`
                            : rotulo.descricao
                        }
                        checked={permissoes.includes(permissao)}
                        disabled={bloqueado}
                        onChange={(valor) =>
                          setPermissoes((atual) =>
                            valor ? [...atual, permissao] : atual.filter((p) => p !== permissao),
                          )
                        }
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {abaAtiva === "membros" && (
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 rounded bg-surface-0 px-3">
              <Search size={16} className="text-ink-faint" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Adicionar alguém a este cargo"
                className="bg-transparent px-0"
                disabled={!editavel}
              />
            </div>

            {candidatos.length > 0 && (
              <div className="mt-2 overflow-hidden rounded border border-line bg-surface-1">
                {candidatos.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => mudarCargoDe(m, true)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-surface-3"
                  >
                    <Avatar id={m.user.id} name={m.user.displayName} url={m.user.avatarUrl} size={24} />
                    <span className="truncate text-sm">{m.user.displayName}</span>
                    <span className="truncate text-xs text-ink-faint">@{m.user.username}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-px">
              {comOCargo.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 border-t border-line px-2 py-2.5 transition hover:bg-surface-3"
                >
                  <Avatar id={m.user.id} name={m.user.displayName} url={m.user.avatarUrl} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{m.nickname ?? m.user.displayName}</p>
                    <p className="truncate text-xs text-ink-faint">@{m.user.username}</p>
                  </div>

                  {editavel && (
                    <button
                      onClick={() => mudarCargoDe(m, false)}
                      title="Tirar o cargo"
                      className="rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-danger"
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              ))}

              {!comOCargo.length && (
                <p className="py-8 text-center text-sm text-ink-faint">
                  Ninguém tem este cargo ainda.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {sujo && editavel && (
        <footer className="sticky bottom-0 mt-6 flex items-center gap-3 rounded bg-surface-0 px-4 py-3">
          <p className="flex-1 text-sm">Você tem alterações não salvas.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNome(role.name);
              setCor(role.color);
              setHoist(role.hoist);
              setMentionable(role.mentionable);
              setPermissoes(role.permissions as Permission[]);
            }}
          >
            Descartar
          </Button>
          <Button variant="success" size="sm" disabled={updateRole.isPending} onClick={salvar}>
            Salvar
          </Button>
        </footer>
      )}
    </div>
  );
};

interface LinhaProps {
  titulo: string;
  descricao: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (valor: boolean) => void;
}

const Linha: React.FC<LinhaProps> = ({ titulo, descricao, checked, disabled, onChange }) => (
  <div className={cn("flex items-start gap-4", disabled && "opacity-60")}>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{titulo}</p>
      <p className="mt-0.5 text-xs text-ink-faint">{descricao}</p>
    </div>
    <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
  </div>
);
