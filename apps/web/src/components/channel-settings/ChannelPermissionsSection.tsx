import React from "react";
import type { Channel, GuildMember, Permission, Role } from "@gravae/shared";

import { ChannelPermissionsBoard } from "~/components/ChannelPermissionsModal";
import { useTranslation } from "~/traducao";

interface ChannelPermissionsSectionProps {
  guildId: string;
  channel: Channel;
  roles: Role[];
  members: GuildMember[];
  minhasPermissoes: string[];
}

export const ChannelPermissionsSection: React.FC<ChannelPermissionsSectionProps> = ({
  guildId,
  channel,
  roles,
  members,
  minhasPermissoes,
}) => {
  const { t } = useTranslation();

  return (
  <div className="max-w-3xl pb-10">
    <h2 className="text-xl font-semibold">{t("servidor.cargos.abaPermissoes")}</h2>
    <p className="mt-1 text-sm text-ink-muted">{t("servidor.canal.permissoesDescricao")}</p>

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
};
