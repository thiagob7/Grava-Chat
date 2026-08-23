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
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { useConfirmar } from "~/components/ui/confirm";
import { ESTILOS_DO_CARGO } from "~/lib/cosmeticos/catalogo";
import { estiloDoCargo } from "~/lib/cosmeticos/cargo";
import { cn } from "~/lib/utils";

/** Paleta do Discord, que é escolhida pra ler bem em fundo escuro. */
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

  // trocar de cargo na lista tem que jogar fora o rascunho do anterior
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
      // o @everyone só aceita permissões: nome e cor dele não existem
      /*
        O @everyone só aceita permissões: nome, cor e enfeite dele não existem.
        E é mais do que "não faz sentido" — um @everyone holográfico repinta o
        nome de TODO MUNDO e mata a hierarquia visual do servidor.
      */
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
      : [{ id: "exibicao" as const, label: "Exibição" }]),
    { id: "permissoes", label: "Permissões" },
    ...(role.isEveryone
      ? []
      : [{ id: "membros" as const, label: `Membros — ${comOCargo.length}` }]),
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
          {role.isEveryone ? "@everyone" : nome || "Cargo sem nome"}
        </h3>

        {!role.isEveryone && editavel && (
          <button
            onClick={() =>
              void confirmar({
                titulo: `Excluir cargo "${role.name}"?`,
                descricao:
                  "Quem tem esse cargo perde tudo o que ele dava. Não dá pra desfazer.",
                acao: "Excluir cargo",
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
            title="Apagar cargo"
          >
            <Trash2 size={18} />
          </button>
        )}
      </header>

      {role.isEveryone && (
        <p className="mt-1 text-xs text-ink-faint">
          Vale para todo mundo no servidor. É a base sobre a qual os outros
          cargos somam.
        </p>
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

            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Estilo do nome
              </span>

              <div className="mb-3 grid grid-cols-3 gap-2">
                {ESTILOS_DO_CARGO.map((opcao) => (
                  <button
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted">Segunda cor</span>
                  <input
                    type="color"
                    value={cor2 ?? "#a855f7"}
                    disabled={!editavel}
                    onChange={(e) => setCor2(e.target.value)}
                    className="size-8 cursor-pointer rounded border border-line bg-transparent"
                  />
                  {cor2 && (
                    <button
                      onClick={() => setCor2(null)}
                      className="rounded p-1 text-ink-faint transition hover:text-ink"
                      aria-label="Limpar segunda cor"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <span className="text-xs text-ink-faint">
                    Sem ela, o gradiente cai para cor sólida — não some.
                  </span>
                </div>
              )}
            </div>

            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Ícone
              </span>
              <Input
                value={emoji}
                disabled={!editavel}
                maxLength={8}
                placeholder="⚡"
                onChange={(e) => setEmoji(e.target.value)}
                className="w-24"
              />
              <p className="mt-1 text-xs text-ink-faint">
                Aparece ao lado do cargo no cartão de perfil de quem o tem.
              </p>
            </div>

            {/*
              A prévia mostra as DUAS formas em que o cargo aparece: a linha da
              lista de membros e a linha do chat. Elas não são iguais — na lista
              o nome é menor, e gradiente em texto pequeno cai para cor sólida.
              Sem ver as duas, dá pra escolher um gradiente que não existe onde a
              pessoa mais aparece.
            */}
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Prévia
              </span>

              <div className="space-y-2 rounded bg-surface-0 p-3">
                <PreviaDoCargo
                  cargo={{ color: cor, colorSecondary: cor2, estilo }}
                  emoji={emoji}
                  nome={nome}
                  legenda="na lista de membros"
                />
                <PreviaDoCargo
                  cargo={{ color: cor, colorSecondary: cor2, estilo }}
                  emoji={emoji}
                  nome={nome}
                  legenda="no chat"
                  tamanho="md"
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
                    <Avatar
                      id={m.user.id}
                      name={m.user.displayName}
                      url={m.user.avatarUrl}
                      size={24}
                    />
                    <span className="truncate text-sm">
                      {m.user.displayName}
                    </span>
                    <span className="truncate text-xs text-ink-faint">
                      @{m.user.username}
                    </span>
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
                  <Avatar
                    id={m.user.id}
                    name={m.user.displayName}
                    url={m.user.avatarUrl}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {m.nickname ?? m.user.displayName}
                    </p>
                    <p className="truncate text-xs text-ink-faint">
                      @{m.user.username}
                    </p>
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

      <UnsavedBar
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
  <div className={cn("flex items-start gap-4", disabled && "opacity-60")}>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{titulo}</p>
      <p className="mt-0.5 text-xs text-ink-faint">{descricao}</p>
    </div>
    <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
  </div>
);

/**
 * Uma linha de prévia do cargo, no tamanho em que ela aparece de verdade.
 *
 * Chama `estiloDoCargo`, a MESMA função que o chat e a lista chamam — se fosse
 * uma cópia do visual, mentiria na primeira vez que a regra mudasse, e mentiria
 * justo pra quem está decidindo a cor.
 */
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
    <p className="flex items-baseline gap-2">
      <span
        className={cn(
          tamanho === "md" ? "text-base font-semibold" : "text-sm font-medium",
          enfeite.className,
        )}
        style={enfeite.style}
      >
        {emoji.trim() && <span className="mr-1">{emoji.trim()}</span>}
        {nome || "Cargo"}
      </span>
      <span className="text-xs text-ink-faint">{legenda}</span>
    </p>
  );
};
