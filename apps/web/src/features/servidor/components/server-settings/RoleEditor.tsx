import React, { useEffect, useMemo, useState } from "react";
import { Check, Search, Trash2, UserMinus, X } from "lucide-react";
import type { EstiloDeCargo, GuildMember, Permission } from "@gravae/shared";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@gravae/shared";

import {
  useUpdateRole,
  useDeleteRole,
} from "~/@core/application/queries/role/use-save-role";
import { useSetMemberRoles } from "~/@core/application/queries/role/use-set-member-roles";
import type { RoleModel } from "~/@core/domain/models/guild-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Input, campoDeCor } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { useConfirmar } from "~/components/ui/confirm";
import { ESTILOS_DO_CARGO } from "~/features/perfil/lib/catalogo";
import { estiloDoCargo } from "~/features/perfil/lib/cargo";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const CORES = [
  "#1abc9c",
  "#2ecc71",
  "#3498db",
  "#9b59b6",
  "#e91e63",
  "#f1c40f",
  "#e67e22",
  "#e74c3c",
  "#95a5a6",
  "#607d8b",
];

type Aba = "exibicao" | "permissoes" | "membros";

interface RoleEditorProps {
  guildId: string;
  role: RoleModel;
  members: GuildMember[];
  minhasPermissoes: Permission[];
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
  const { t } = useTranslation();
  const updateRole = useUpdateRole(guildId);
  const deleteRole = useDeleteRole(guildId);
  const setMemberRoles = useSetMemberRoles(guildId);

  const [aba, setAba] = useState<Aba>("exibicao");
  const [nome, setNome] = useState(role.name);
  const [cor, setCor] = useState<string | null>(role.color);
  const [cor2, setCor2] = useState<string | null>(role.colorSecondary);
  const [estilo, setEstilo] = useState<EstiloDeCargo>(role.estilo);
  const [emoji, setEmoji] = useState(role.iconEmoji ?? "");
  const [hoist, setHoist] = useState(role.hoist);
  const [mentionable, setMentionable] = useState(role.mentionable);
  const [permissoes, setPermissoes] = useState<Permission[]>(
    role.permissions as Permission[],
  );
  const [busca, setBusca] = useState("");
  const confirmar = useConfirmar();

  useEffect(() => {
    setNome(role.name);
    setCor(role.color);
    setHoist(role.hoist);
    setMentionable(role.mentionable);
    setPermissoes(role.permissions as Permission[]);
  }, [role]);

  const souAdmin = minhasPermissoes.includes("ADMINISTRATOR");
  const posso = (permissao: Permission) =>
    souAdmin || minhasPermissoes.includes(permissao);

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
      ...(role.isEveryone
        ? {}
        : {
            name: nome,
            color: cor,
            colorSecondary: cor2,
            estilo,
            iconEmoji: emoji.trim() || null,
            hoist,
            mentionable,
          }),
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
    ...(role.isEveryone
      ? []
      : [{ id: "exibicao" as const, label: t("servidor.cargos.abaExibicao") }]),
    { id: "permissoes", label: t("servidor.cargos.abaPermissoes") },
    ...(role.isEveryone
      ? []
      : [{ id: "membros" as const, label: t("servidor.cargos.abaMembros", { quantos: comOCargo.length }) }]),
  ];

  const abaAtiva = abas.some((a) => a.id === aba) ? aba : "permissoes";

  return (
    <div data-gc="servidor.server-settings.role-editor.div" className="flex min-w-0 flex-1 flex-col">
      <header data-gc="servidor.server-settings.role-editor.header" className="flex items-center gap-3">
        <span data-gc="servidor.server-settings.role-editor.span"
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: cor ?? "#99aab5" }}
        />
        <h3 data-gc="servidor.server-settings.role-editor.h3" className="truncate text-lg font-semibold">
          {role.isEveryone ? "@everyone" : nome || "Cargo sem nome"}
        </h3>

        {!role.isEveryone && editavel && (
          <button data-gc="servidor.server-settings.role-editor.button"
            onClick={() =>
              void confirmar({
                titulo: t("servidor.cargos.excluirTitulo", { nome: role.name }),
                descricao:
                  t("servidor.cargos.excluirDescricao"),
                acao: t("servidor.cargos.excluirAcao"),
              }).then(
                ({ confirmado }) =>
                  confirmado &&
                  deleteRole.mutate(
                    { guildId, roleId: role.id },
                    { onSuccess: onDeleted },
                  ),
              )
            }
            className="ml-auto rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-danger"
            title={t("servidor.cargos.apagar")}
          >
            <Trash2 data-gc="servidor.server-settings.role-editor.trash2" size={18} />
          </button>
        )}
      </header>

      {role.isEveryone && (
        <p data-gc="servidor.server-settings.role-editor.p" className="mt-1 text-xs text-ink-faint">
          {t("servidor.cargos.everyone")}
        </p>
      )}

      <nav data-gc="servidor.server-settings.role-editor.nav" className="mt-5 flex gap-4 border-b border-line">
        {abas.map((a) => (
          <button data-gc="servidor.server-settings.role-editor.button--2"
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

      <div data-gc="servidor.server-settings.role-editor.div--2" className="mt-5 flex-1">
        {abaAtiva === "exibicao" && (
          <div data-gc="servidor.server-settings.role-editor.div--3" className="max-w-md space-y-6">
            <label data-gc="servidor.server-settings.role-editor.label" className="block">
              <span data-gc="servidor.server-settings.role-editor.span--2" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t("servidor.cargos.nomeDoCargo")}
              </span>
              <Input data-gc="servidor.server-settings.role-editor.input"
                value={nome}
                disabled={!editavel}
                maxLength={48}
                onChange={(e) => setNome(e.target.value)}
              />
            </label>

            <div data-gc="servidor.server-settings.role-editor.div--4">
              <span data-gc="servidor.server-settings.role-editor.span--3" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t("servidor.cargos.cor")}
              </span>
              <p data-gc="servidor.server-settings.role-editor.p--2" className="mb-3 text-xs text-ink-faint">
                {t("servidor.cargos.corDica")}
              </p>

              <div data-gc="servidor.server-settings.role-editor.div--5" className="flex flex-wrap items-center gap-2">
                <button data-gc="servidor.server-settings.role-editor.button--3"
                  onClick={() => editavel && setCor(null)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded border border-line bg-surface-0 text-ink-faint transition",
                    cor === null && "ring-2 ring-brand",
                  )}
                  title={t("servidor.cargos.semCor")}
                >
                  <X data-gc="servidor.server-settings.role-editor.x" size={14} />
                </button>

                {CORES.map((c) => (
                  <button data-gc="servidor.server-settings.role-editor.button--4"
                    key={c}
                    onClick={() => editavel && setCor(c)}
                    style={{ backgroundColor: c }}
                    className={cn(
                      "flex size-8 items-center justify-center rounded transition",
                      cor === c && "ring-2 ring-ink",
                    )}
                  >
                    {cor === c && <Check data-gc="servidor.server-settings.role-editor.check" size={14} className="text-white" />}
                  </button>
                ))}

                <input data-gc="servidor.server-settings.role-editor.input--2"
                  type="color"
                  value={cor ?? "#99aab5"}
                  disabled={!editavel}
                  onChange={(e) => setCor(e.target.value)}
                  className={cn(campoDeCor, "size-8 rounded")}
                  title={t("servidor.cargos.corPersonalizada")}
                />
              </div>
            </div>

            <div data-gc="servidor.server-settings.role-editor.div--6">
              <span data-gc="servidor.server-settings.role-editor.span--4" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t("servidor.cargos.estilo")}
              </span>

              <div data-gc="servidor.server-settings.role-editor.div--7" className="mb-3 grid grid-cols-3 gap-2">
                {ESTILOS_DO_CARGO.map((opcao) => (
                  <button data-gc="servidor.server-settings.role-editor.button--5"
                    key={opcao.id}
                    onClick={() => editavel && setEstilo(opcao.id)}
                    title={opcao.descricao}
                    className={cn(
                      "rounded border px-2 py-2 text-xs transition",
                      estilo === opcao.id
                        ? "border-brand bg-surface-3 text-ink"
                        : "border-line bg-surface-0 text-ink-muted hover:bg-surface-3",
                    )}
                  >
                    {opcao.rotulo}
                  </button>
                ))}
              </div>

              {estilo !== "solido" && (
                <div data-gc="servidor.server-settings.role-editor.div--8" className="flex items-center gap-2">
                  <span data-gc="servidor.server-settings.role-editor.span--5" className="text-xs text-ink-muted">{t("servidor.cargos.segundaCor")}</span>
                  <input data-gc="servidor.server-settings.role-editor.input--3"
                    type="color"
                    value={cor2 ?? "#a855f7"}
                    disabled={!editavel}
                    onChange={(e) => setCor2(e.target.value)}
                    className={cn(campoDeCor, "size-8 rounded")}
                  />
                  {cor2 && (
                    <button data-gc="servidor.server-settings.role-editor.button--6"
                      onClick={() => setCor2(null)}
                      className="rounded p-1 text-ink-faint transition hover:text-ink"
                      aria-label={t("servidor.cargos.limparSegundaCor")}
                    >
                      <X data-gc="servidor.server-settings.role-editor.x--2" size={14} />
                    </button>
                  )}
                  <span data-gc="servidor.server-settings.role-editor.span--6" className="text-xs text-ink-faint">
                    {t("servidor.cargos.segundaCorDica")}
                  </span>
                </div>
              )}
            </div>

            <div data-gc="servidor.server-settings.role-editor.div--9">
              <span data-gc="servidor.server-settings.role-editor.span--7" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t("servidor.cargos.icone")}
              </span>
              <Input data-gc="servidor.server-settings.role-editor.input--4"
                value={emoji}
                disabled={!editavel}
                maxLength={8}
                placeholder="⚡"
                onChange={(e) => setEmoji(e.target.value)}
                className="w-24"
              />
              <p data-gc="servidor.server-settings.role-editor.p--3" className="mt-1 text-xs text-ink-faint">
                {t("servidor.cargos.iconeDica")}
              </p>
            </div>

            <div data-gc="servidor.server-settings.role-editor.div--10">
              <span data-gc="servidor.server-settings.role-editor.span--8" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t("comum.previa")}
              </span>

              <div data-gc="servidor.server-settings.role-editor.div--11" className="space-y-2 rounded bg-surface-0 p-3">
                <PreviaDoCargo data-gc="servidor.server-settings.role-editor.previa-do-cargo"
                  cargo={{ color: cor, colorSecondary: cor2, estilo }}
                  emoji={emoji}
                  nome={nome}
                  legenda="na lista de membros"
                />
                <PreviaDoCargo data-gc="servidor.server-settings.role-editor.previa-do-cargo--2"
                  cargo={{ color: cor, colorSecondary: cor2, estilo }}
                  emoji={emoji}
                  nome={nome}
                  legenda="no chat"
                  tamanho="md"
                />
              </div>
            </div>

            <Linha data-gc="servidor.server-settings.role-editor.linha.set-hoist"
              titulo={t("servidor.cargos.exibirSeparado")}
              descricao={t("servidor.cargos.exibirSeparadoDica")}
              checked={hoist}
              disabled={!editavel}
              onChange={setHoist}
            />

            <Linha data-gc="servidor.server-settings.role-editor.linha.set-mentionable"
              titulo={t("servidor.cargos.permitirMencionar")}
              descricao={t("servidor.cargos.permitirMencionarDica")}
              checked={mentionable}
              disabled={!editavel}
              onChange={setMentionable}
            />
          </div>
        )}

        {abaAtiva === "permissoes" && (
          <div data-gc="servidor.server-settings.role-editor.div--12" className="max-w-2xl space-y-7">
            {PERMISSION_GROUPS.map((grupo) => (
              <section data-gc="servidor.server-settings.role-editor.section" key={grupo.label}>
                <h4 data-gc="servidor.server-settings.role-editor.h4" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {grupo.label}
                </h4>

                <div data-gc="servidor.server-settings.role-editor.div--13" className="space-y-4">
                  {grupo.permissions.map((permissao) => {
                    const rotulo = PERMISSION_LABELS[permissao];
                    const bloqueado = !editavel || !posso(permissao);

                    return (
                      <Linha data-gc="servidor.server-settings.role-editor.linha"
                        key={permissao}
                        titulo={rotulo.nome}
                        descricao={
                          bloqueado && editavel
                            ? t("servidor.cargos.semPoderDeConceder", { descricao: rotulo.descricao })
                            : rotulo.descricao
                        }
                        checked={permissoes.includes(permissao)}
                        disabled={bloqueado}
                        onChange={(valor) =>
                          setPermissoes((atual) =>
                            valor
                              ? [...atual, permissao]
                              : atual.filter((p) => p !== permissao),
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
          <div data-gc="servidor.server-settings.role-editor.div--14" className="max-w-2xl">
            <div data-gc="servidor.server-settings.role-editor.div--15" className="flex items-center gap-2 rounded bg-surface-0 px-3">
              <Search data-gc="servidor.server-settings.role-editor.search" size={16} className="text-ink-faint" />
              <Input data-gc="servidor.server-settings.role-editor.input--5"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={t("servidor.cargos.adicionar")}
                className="bg-transparent px-0"
                disabled={!editavel}
              />
            </div>

            {candidatos.length > 0 && (
              <div data-gc="servidor.server-settings.role-editor.div--16" className="mt-2 overflow-hidden rounded border border-line bg-surface-1">
                {candidatos.map((m) => (
                  <button data-gc="servidor.server-settings.role-editor.button--7"
                    key={m.id}
                    onClick={() => mudarCargoDe(m, true)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-surface-3"
                  >
                    <Avatar data-gc="servidor.server-settings.role-editor.avatar"
                      id={m.user.id}
                      name={m.user.displayName}
                      url={m.user.avatarUrl}
                      size={24}
                    />
                    <span data-gc="servidor.server-settings.role-editor.span--9" className="truncate text-sm">
                      {m.user.displayName}
                    </span>
                    <span data-gc="servidor.server-settings.role-editor.span--10" className="truncate text-xs text-ink-faint">
                      @{m.user.username}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div data-gc="servidor.server-settings.role-editor.div--17" className="mt-4 space-y-px">
              {comOCargo.map((m) => (
                <div data-gc="servidor.server-settings.role-editor.div--18"
                  key={m.id}
                  className="flex items-center gap-3 border-t border-line px-2 py-2.5 transition hover:bg-surface-3"
                >
                  <Avatar data-gc="servidor.server-settings.role-editor.avatar--2"
                    id={m.user.id}
                    name={m.user.displayName}
                    url={m.user.avatarUrl}
                    size={32}
                  />
                  <div data-gc="servidor.server-settings.role-editor.div--19" className="min-w-0 flex-1">
                    <p data-gc="servidor.server-settings.role-editor.p--4" className="truncate text-sm">
                      {m.nickname ?? m.user.displayName}
                    </p>
                    <p data-gc="servidor.server-settings.role-editor.p--5" className="truncate text-xs text-ink-faint">
                      @{m.user.username}
                    </p>
                  </div>

                  {editavel && (
                    <button data-gc="servidor.server-settings.role-editor.button--8"
                      onClick={() => mudarCargoDe(m, false)}
                      title={t("servidor.cargos.tirar")}
                      className="rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-danger"
                    >
                      <UserMinus data-gc="servidor.server-settings.role-editor.user-minus" size={16} />
                    </button>
                  )}
                </div>
              ))}

              {!comOCargo.length && (
                <p data-gc="servidor.server-settings.role-editor.p--6" className="py-8 text-center text-sm text-ink-faint">
                  {t("servidor.cargos.semNinguem")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <UnsavedBar data-gc="servidor.server-settings.role-editor.unsaved-bar.salvar"
        visivel={sujo && editavel}
        salvando={updateRole.isPending}
        onDescartar={() => {
          setNome(role.name);
          setCor(role.color);
          setCor2(role.colorSecondary);
          setEstilo(role.estilo);
          setEmoji(role.iconEmoji ?? "");
          setHoist(role.hoist);
          setMentionable(role.mentionable);
          setPermissoes(role.permissions as Permission[]);
        }}
        onSalvar={salvar}
      />
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

const Linha: React.FC<LinhaProps> = ({
  titulo,
  descricao,
  checked,
  disabled,
  onChange,
}) => (
  <div data-gc="servidor.server-settings.role-editor.div--20" className={cn("flex items-start gap-4", disabled && "opacity-60")}>
    <div data-gc="servidor.server-settings.role-editor.div--21" className="min-w-0 flex-1">
      <p data-gc="servidor.server-settings.role-editor.p--7" className="text-sm font-medium">{titulo}</p>
      <p data-gc="servidor.server-settings.role-editor.p--8" className="mt-0.5 text-xs text-ink-faint">{descricao}</p>
    </div>
    <Switch data-gc="servidor.server-settings.role-editor.switch.on-change" checked={checked} disabled={disabled} onCheckedChange={onChange} />
  </div>
);

const PreviaDoCargo: React.FC<{
  cargo: {
    color: string | null;
    colorSecondary: string | null;
    estilo: EstiloDeCargo;
  };
  emoji: string;
  nome: string;
  legenda: string;
  tamanho?: "sm" | "md";
}> = ({ cargo, emoji, nome, legenda, tamanho = "sm" }) => {
  const enfeite = estiloDoCargo(cargo, { tamanho, animar: true });

  return (
    <p data-gc="servidor.server-settings.role-editor.p--9" className="flex items-baseline gap-2">
      <span data-gc="servidor.server-settings.role-editor.span--11"
        className={cn(
          tamanho === "md" ? "text-base font-semibold" : "text-sm font-medium",
          enfeite.className,
        )}
        style={enfeite.style}
      >
        {emoji.trim() && <span data-gc="servidor.server-settings.role-editor.span--12" className="mr-1">{emoji.trim()}</span>}
        {nome || "Cargo"}
      </span>
      <span data-gc="servidor.server-settings.role-editor.span--13" className="text-xs text-ink-faint">{legenda}</span>
    </p>
  );
};
