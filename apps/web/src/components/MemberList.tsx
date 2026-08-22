import React, { useMemo } from "react";
import type { GuildMember, Role } from "@gravae/shared";

import { Avatar } from "~/components/Avatar";
import { ServerTag } from "~/components/ServerTag";
import { UserName } from "~/components/UserName";
import { UserProfilePopover } from "~/components/UserProfilePopover";
import { useEnfeites, type ResolverEnfeites } from "~/hooks/use-enfeites";
import { cn } from "~/lib/utils";
import { AlcaDeLargura, useLarguraAjustavel } from "~/components/ui/resizable";

interface MemberListProps {
  members: GuildMember[];
  roles?: Role[];
  ownerId: string | undefined;
  /** contexto que a visualização de moderador precisa */
  guildId?: string;
  podeModerar?: boolean;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  roles = [],
  ownerId,
  guildId,
  podeModerar = false,
}) => {
  const enfeitesDe = useEnfeites(guildId);

  /**
   * Cargos com "exibir separado" ganham a própria seção, do mais alto para o
   * mais baixo, e cada pessoa aparece uma vez só — no cargo mais alto dela.
   * Quem sobra cai em Online, e quem está fora fica sempre por último.
   */
  const grupos = useMemo(() => {
    const hoisted = roles
      .filter((r) => r.hoist && !r.isEveryone)
      .sort((a, b) => b.position - a.position);

    const online = members.filter((m) => m.user.status !== "OFFLINE");
    const offline = members.filter((m) => m.user.status === "OFFLINE");
    const jaListados = new Set<string>();

    const seccoes = hoisted.map((role) => {
      const doCargo = online.filter((m) => !jaListados.has(m.id) && m.roleIds.includes(role.id));
      doCargo.forEach((m) => jaListados.add(m.id));

      return { titulo: `${role.name} — ${doCargo.length}`, membros: doCargo, dim: false };
    });

    const restante = online.filter((m) => !jaListados.has(m.id));

    return [
      ...seccoes.filter((s) => s.membros.length),
      { titulo: `Online — ${restante.length}`, membros: restante, dim: false },
      { titulo: `Offline — ${offline.length}`, membros: offline, dim: true },
    ];
  }, [members, roles]);

  const { largura, arrastando, alca, limites } = useLarguraAjustavel("membros", {
    padrao: 240,
    min: 170,
    max: 400,
    borda: "esquerda",
  });

  return (
    /*
      A rolagem fica no filho, e não no <aside>: a alça é posicionada em
      relação ao painel, e num container que rola ela subiria junto com a
      lista até sumir da tela.
    */
    <aside
      className="relative hidden shrink-0 bg-surface-1 lg:block"
      style={{ width: largura }}
    >
      <AlcaDeLargura borda="esquerda" arrastando={arrastando} largura={largura} limites={limites} {...alca} />

      <div className="h-full overflow-y-auto px-2 py-4">
        {grupos.map((grupo) => (
          <MemberGroup
            key={grupo.titulo}
            title={grupo.titulo}
            members={grupo.membros}
            roles={roles}
            ownerId={ownerId}
            dim={grupo.dim}
            guildId={guildId}
            podeModerar={podeModerar}
            enfeitesDe={enfeitesDe}
          />
        ))}
      </div>
    </aside>
  );
};

interface MemberGroupProps extends MemberListProps {
  title: string;
  dim?: boolean;
  /**
   * Resolvido uma vez lá em cima e passado adiante: cada seção montar o próprio
   * cruzamento de cargos daria o mesmo trabalho quatro ou cinco vezes.
   */
  enfeitesDe: ResolverEnfeites;
}

const MemberGroup: React.FC<MemberGroupProps> = ({
  title,
  members,
  roles = [],
  ownerId,
  dim,
  guildId,
  podeModerar = false,
  enfeitesDe,
}) => {
  if (!members.length) return null;

  return (
    <section className="mb-5">
      <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{title}</h3>
      {members.map((member) => {
        const { perfil, corDoCargo } = enfeitesDe(member.user.id);

        return (
          <UserProfilePopover
            key={member.id}
            userId={member.user.id}
            side="left"
            guildId={guildId}
            roles={roles}
            roleIds={member.roleIds}
            podeModerar={podeModerar}
          >
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition hover:bg-surface-3",
                dim && "opacity-40",
              )}
            >
              <Avatar
                id={member.user.id}
                name={member.nickname ?? member.user.displayName}
                url={member.user.avatarUrl}
                size={32}
                status={member.user.status}
                enfeites={perfil}
              />
              {/*
                `tamanho` fica em `sm` — o padrão — porque aqui são cem nomes a
                14px: gradiente e brilho recortam o texto e emagrecem a linha
                inteira. Neon e cor sólida continuam valendo.
              */}
              <UserName
                nome={member.nickname ?? member.user.displayName}
                perfil={perfil}
                corDoCargo={corDoCargo}
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-medium",
                  corDoCargo || perfil?.nome ? "" : "text-ink-muted",
                )}
              />
              {/*
                A etiqueta é de quem a VESTE, não do servidor onde a linha está
                sendo desenhada. Antes vinha de `guild.tag` e grudava em todo
                mundo que estivesse aqui — o que fazia dela enfeite do cenário,
                e não de quem está nele.
              */}
              <ServerTag etiqueta={perfil?.etiquetaDoServidor} interativo={false} />
              {member.user.id === ownerId && <span title="Dono do servidor">👑</span>}
            </button>
          </UserProfilePopover>
        );
      })}
    </section>
  );
};
