import React from "react";
import type { Channel, GuildMember, Permission, Role } from "@gravae/shared";

import { ChannelPermissionsBoard } from "~/components/ChannelPermissionsModal";

interface ChannelPermissionsSectionProps {
  guildId: string;
  channel: Channel;
  roles: Role[];
  members: GuildMember[];
  minhasPermissoes: string[];
}

/**
 * As permissões do canal dentro da tela de configurações. O miolo é o mesmo do
 * modal que abre pela barra lateral — um lugar só decide como isso funciona.
 */
export const ChannelPermissionsSection: React.FC<ChannelPermissionsSectionProps> = ({
  guildId,
  channel,
  roles,
  members,
  minhasPermissoes,
}) => (
  <div className="max-w-3xl pb-10">
    <h2 className="text-xl font-semibold">Permissões</h2>
    <p className="mt-1 text-sm text-ink-muted">
      Aqui você muda o que vale <strong>neste canal</strong>. O que ficar em “herdar” continua
      seguindo o cargo.
    </p>

    <div className="mt-6">
      <ChannelPermissionsBoard
        guildId={guildId}
        channelId={channel.id}
        channelType={channel.type}
        roles={roles}
        members={members}
        minhasPermissoes={minhasPermissoes as Permission[]}
      />
    </div>
  </div>
);
