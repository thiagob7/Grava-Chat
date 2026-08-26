import { AppError } from "~/lib/http.js";

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  picture?: string;
}

export const googleService = {
  async fetchProfile(accessToken: string) {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new AppError("Não consegui ler seu perfil no Google", 502);

    const profile = (await response.json()) as GoogleUserInfo;

    if (!profile.email || !profile.email_verified) {
      throw new AppError("Sua conta Google precisa ter o email verificado");
    }

    return {
      providerAccountId: profile.sub,
      email: profile.email,
      displayName: profile.name ?? profile.given_name ?? profile.email.split("@")[0]!,
      avatarUrl: profile.picture ?? null,
    };
  },
};
