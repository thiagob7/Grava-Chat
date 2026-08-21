import { AppError } from "~/lib/http.js";

/** O que o Google devolve em /userinfo — só o que a gente usa. */
interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  picture?: string;
}

export const googleService = {
  /**
   * Busca o perfil com o access token do Google.
   *
   * Usa o endpoint de userinfo em vez de decodificar o id_token por conta
   * própria: validar assinatura JWT do Google exige buscar e cachear as chaves
   * públicas dele, e errar isso silenciosamente é como se aceita um token forjado.
   */
  async fetchProfile(accessToken: string) {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new AppError("Não consegui ler seu perfil no Google", 502);

    const profile = (await response.json()) as GoogleUserInfo;

    /**
     * Email não verificado é recusado: sem isso, alguém cria uma conta Google
     * com o email de outra pessoa e entra como ela aqui.
     */
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
