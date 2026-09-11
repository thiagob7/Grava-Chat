import React, { useState } from "react";
import { Headphones, HeadphoneOff, Mic, MicOff, Phone, Settings, Volume2 } from "lucide-react";

import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import { OwnCardMenu, stateLabel } from "~/features/perfil/components/cartao/MenuDoProprioCartao";
import { ProfileCardVisual } from "~/features/perfil/components/cartao/ProfileCardVisual";
import { ProfileEditorModal } from "~/features/perfil/components/cartao/ProfileEditorModal";
import { StatusModal } from "~/features/perfil/components/cartao/StatusModal";
import { UserSettingsModal } from "~/features/configuracoes/components/UserSettingsModal";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";

interface UserPanelProps {
  user: SelfUserModel;
  guildId?: string;
  onLogout: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ user, guildId, onLogout }) => {
  const sectionRequested = useSettings((s) => s.section);
  const openSettings = useSettings((s) => s.open);
  const closeRequest = useSettings((s) => s.close);
  const [editingProfile, setEditingProfile] = useState(false);
  const [settingStatus, setSettingStatus] = useState(false);

  const { micEnabled, micBlocked, deafened, toggleMic, toggleDeafen } = useVoiceStore();
  const inCall = useVoiceStore((v) => Boolean(v.channelId));
  const privateInCall = useVoiceStore((v) => Boolean(v.channelId) && !v.guildId);
  const updateProfile = useUpdateProfile();

  const { data: detail } = useFindGuild(guildId);
  const mineIds = detail?.members.find((m) => m.user.id === user.id)?.roleIds ?? [];
  const mineRoles = (detail?.roles ?? []).filter(
    (r) => !r.isEveryone && mineIds.includes(r.id),
  );

  return (
    <>
      <div data-gc="perfil.user-panel.div" {...flxAttr("userLine")} className={cn("painel-do-usuario flex cursor-pointer items-center gap-1 px-1", flxCls("userLine"))}>
        <Popover data-gc="perfil.user-panel.popover">
          <PopoverTrigger data-gc="perfil.user-panel.popover-trigger" asChild>
            <button data-gc="perfil.user-panel.button" {...flx("infoUserLine", "flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left transition hover:bg-surface-3")}>
              <Avatar data-gc="perfil.user-panel.avatar"
                id={user.id}
                name={user.displayName}
                url={user.avatarUrl}
                size={32}
                status={user.status}
                charms={user.profile}
              />
              <div data-gc="perfil.user-panel.div--2" {...flx("dataFooter", "group/eu min-w-0 flex-1")}>
                <p data-gc="perfil.user-panel.p" {...flx("nameFooter", "truncate text-sm font-medium leading-tight")}>
                  <UserName data-gc="perfil.user-panel.user-name" name={user.displayName} profile={user.profile} />
                </p>

                <span data-gc="perfil.user-panel.span" {...flx("statusFooter", "grid grid-cols-1 overflow-hidden text-xs text-ink-faint")}>
                  <span data-gc="perfil.user-panel.span--2" {...flx("statusStateDefault", "col-start-1 row-start-1 truncate transition duration-200 ease-out group-hover/eu:-translate-y-full group-hover/eu:opacity-0")}>
                    {inCall ? (
                      <span data-gc="perfil.user-panel.span--3" className="flex items-center gap-1 text-online">
                        {privateInCall ? (
                          <>
                            <Phone data-gc="perfil.user-panel.phone" size={12} className="shrink-0" /> Em uma chamada
                          </>
                        ) : (
                          <>
                            <Volume2 data-gc="perfil.user-panel.volume2" size={12} className="shrink-0" /> Em voz
                          </>
                        )}
                      </span>
                    ) : (
                      (user.customStatus?.text ?? stateLabel(user.desiredStatus))
                    )}
                  </span>

                  <span data-gc="perfil.user-panel.span--4" {...flx("statusStateHover", "col-start-1 row-start-1 translate-y-full truncate opacity-0 transition duration-200 ease-out group-hover/eu:translate-y-0 group-hover/eu:opacity-100")}>
                    {user.username}
                  </span>
                </span>
              </div>
            </button>
          </PopoverTrigger>

          <PopoverContent data-gc="perfil.user-panel.popover-content" side="top" className="max-h-[80vh] w-80 overflow-y-auto p-0">
            <ProfileCardVisual data-gc="perfil.user-panel.profile-card-visual"
              id={user.id}
              displayName={user.displayName}
              username={user.username}
              avatarUrl={user.avatarUrl}
              status={user.status}
              profile={user.profile}
              customStatus={user.customStatus}
              bio={user.bio}
              createdAt={user.createdAt}
              roleList={mineRoles}
              onStatus={() => setSettingStatus(true)}
              className="rounded-none"
            >
              <OwnCardMenu data-gc="perfil.user-panel.own-card-menu"
                user={user}
                onEditProfile={() => setEditingProfile(true)}
                onManageAccounts={() => openSettings("account")}
              />
            </ProfileCardVisual>
          </PopoverContent>
        </Popover>

        <div data-gc="perfil.user-panel.div--3" {...flx("userControls", "flex shrink-0 items-center gap-1")}>
          <PanelButton data-gc="perfil.user-panel.panel-button"
            label={micBlocked ? "Microfone bloqueado" : micEnabled ? "Mutar" : "Desmutar"}
            onClick={() => void toggleMic()}
            cut={!micEnabled || micBlocked}
          >
            {micEnabled && !micBlocked ? <Mic data-gc="perfil.user-panel.mic" size={18} /> : <MicOff data-gc="perfil.user-panel.mic-off" size={18} />}
          </PanelButton>

          <PanelButton data-gc="perfil.user-panel.panel-button--2"
            label={deafened ? "Ouvir" : "Ficar surdo"}
            onClick={() => void toggleDeafen()}
            cut={deafened}
          >
            {deafened ? <HeadphoneOff data-gc="perfil.user-panel.headphone-off" size={18} /> : <Headphones data-gc="perfil.user-panel.headphones" size={18} />}
          </PanelButton>

          <Tooltip data-gc="perfil.user-panel.tooltip" label="Configurações">
            <button data-gc="perfil.user-panel.button--2"
              {...flxAttr("settingsButton")}
              onClick={() => openSettings("account")}
              aria-label="Configurações"
              className={cn(
              flxCls("footerButton"),
              "rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink",
            )}
            >
              <Settings data-gc="perfil.user-panel.settings" size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      {sectionRequested && (
        <UserSettingsModal data-gc="perfil.user-panel.user-settings-modal.close-request"
          open
          key={sectionRequested}
          initialSection={sectionRequested}
          user={user}
          onClose={closeRequest}
          onLogout={onLogout}
          onEditProfile={() => {
            closeRequest();
            setEditingProfile(true);
          }}
        />
      )}

      {editingProfile && (
        <ProfileEditorModal data-gc="perfil.user-panel.profile-editor-modal" open user={user} onClose={() => setEditingProfile(false)} />
      )}

      {settingStatus && (
        <StatusModal data-gc="perfil.user-panel.status-modal"
          open
          user={user}
          profile={user.profile}
          onClose={() => setSettingStatus(false)}
          onSave={(status) =>
            void updateProfile
              .mutateAsync({ customStatus: status })
              .then(() => setSettingStatus(false))
              .catch(() => null)
          }
          saving={updateProfile.isPending}
        />
      )}
    </>
  );
};

interface PanelPropsButton {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  cut?: boolean;
}

const PanelButton: React.FC<PanelPropsButton> = ({ children, label, onClick, cut }) => (
  <Tooltip data-gc="perfil.user-panel.tooltip--2" label={label}>
    <button data-gc="perfil.user-panel.button.on-click"
      onClick={onClick}
      aria-label={label}
      aria-pressed={cut}
      className={cn(
        flxCls("footerButton"),
        "shrink-0 rounded p-1.5 transition hover:bg-surface-3",
        cut ? "text-danger" : "text-ink-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  </Tooltip>
);
