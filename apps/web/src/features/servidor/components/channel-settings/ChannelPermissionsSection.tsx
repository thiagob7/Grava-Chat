import React from "react";
import type { Channel, GuildMember, Permission, Role } from "@gravae/shared";

import { ChannelPermissionsBoard } from "~/features/servidor/components/ChannelPermissionsModal";
import { useTranslation } from "~/traducao";

interface ChannelPermissionsSectionProps {
  guildId: string;
  channel: Channel;
  roles: Role[];
  members: GuildMember[];
  minePermissions: string[];
}

export const ChannelPermissionsSection: React.FC<ChannelPermissionsSectionProps> = ({
  guildId,
  channel,
  roles,
  members,
  minePermissions,
}) => {
  const { t } = useTranslation();

  return (
  <div data-gc="servidor.channel-settings.channel-permissions-section.div" className="max-w-3xl pb-10">
    <h2 data-gc="servidor.channel-settings.channel-permissions-section.h2" className="text-xl font-semibold">{t("servidor.cargos.abaPermissoes")}</h2>
    <p data-gc="servidor.channel-settings.channel-permissions-section.p" className="mt-1 text-sm text-ink-muted">{t("servidor.canal.permissoesDescricao")}</p>

    <div data-gc="servidor.channel-settings.channel-permissions-section.div--2" className="mt-6">
      <ChannelPermissionsBoard data-gc="servidor.channel-settings.channel-permissions-section.channel-permissions-board"
        guildId={guildId}
        channelId={channel.id}
        channelType={channel.type}
        roles={roles}
        members={members}
        minePermissions={minePermissions as Permission[]}
      />
    </div>
  </div>
  );
};
