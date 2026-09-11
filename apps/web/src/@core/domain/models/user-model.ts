import type { DesiredStatus, ProfileStyle, SpamFilter, PresenceStatus, CustomStatus } from "@gravae/shared";

export interface PublicUserModel {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: PresenceStatus;
  isBot: boolean;
  system?: boolean;
}

export interface SelfUserModel extends PublicUserModel {
  email: string;
  bio: string | null;
  pronouns: string | null;
  providers: string[];
  createdAt: string;
  profile: ProfileStyle | null;
  customStatus: CustomStatus | null;
  desiredStatus: DesiredStatus;
  admin: boolean;

  acceptedRequests: boolean;
  showsActivity: boolean;
  showsServersCommon: boolean;
  showsFriendsCommon: boolean;
  membersAllowDm: boolean;
  spamFilter: SpamFilter;

  deleteAt: string | null;
  verifiedEmail: boolean;
}

export interface SessionModel {
  accessToken: string;
  user: SelfUserModel;
}

export interface AuthConfigModel {
  devLogin: boolean;
  google: boolean;
  password?: boolean;
  forgotPassword?: boolean;
  voiceUrl: string;
}
