import type { ProfileStyle, SpamFilter, CustomStatus } from "@gravae/shared";

export interface DevLoginDTO {
  email: string;
  displayName?: string;
}

export interface UpdateProfileDTO {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  pronouns?: string | null;
  profile?: ProfileStyle | null;
  customStatus?: CustomStatus | null;

  acceptedRequests?: boolean;
  showsActivity?: boolean;
  showsServersCommon?: boolean;
  showsFriendsCommon?: boolean;
  membersAllowDm?: boolean;
  spamFilter?: SpamFilter;
}

export interface DesktopLoginDTO {
  code: string;
  verifier: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
}

export interface JoinDto {
  email: string;
  password: string;
}

export interface SwapPasswordDto {
  current?: string;
  fresh: string;
}
