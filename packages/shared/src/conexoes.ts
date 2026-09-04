import { z } from "zod";

export const SERVICOS = [
  "github",
  "gitlab",
  "x",
  "instagram",
  "youtube",
  "twitch",
  "tiktok",
  "steam",
  "spotify",
  "reddit",
  "linkedin",
  "site",
] as const;

export type Servico = (typeof SERVICOS)[number];

export const NOMES_DOS_SERVICOS: Record<Servico, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  twitch: "Twitch",
  tiktok: "TikTok",
  steam: "Steam",
  spotify: "Spotify",
  reddit: "Reddit",
  linkedin: "LinkedIn",
  site: "Site",
};

const MOLDES: Record<Exclude<Servico, "site">, string> = {
  github: "https://github.com/",
  gitlab: "https://gitlab.com/",
  x: "https://x.com/",
  instagram: "https://instagram.com/",
  youtube: "https://youtube.com/@",
  twitch: "https://twitch.tv/",
  tiktok: "https://tiktok.com/@",
  steam: "https://steamcommunity.com/id/",
  spotify: "https://open.spotify.com/user/",
  reddit: "https://reddit.com/user/",
  linkedin: "https://linkedin.com/in/",
};

const HANDLE = /^[A-Za-z0-9._-]{1,40}$/;

export const conexaoSchema = z.object({
  servico: z.enum(SERVICOS),
  valor: z.string().min(1).max(200),
});

export type Conexao = z.infer<typeof conexaoSchema>;

export function enderecoDaConexao({ servico, valor }: Conexao): string | null {
  const limpo = valor.trim().replace(/^@/, "");
  if (!limpo) return null;

  if (servico === "site") {
    const comEsquema = /^https?:\/\//i.test(limpo) ? limpo : `https://${limpo}`;

    try {
      const url = new URL(comEsquema);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      if (!url.hostname.includes(".")) return null;

      return url.toString();
    } catch {
      return null;
    }
  }

  if (!HANDLE.test(limpo)) return null;

  return `${MOLDES[servico]}${limpo}`;
}

export function comoSeLe({ servico, valor }: Conexao): string {
  const limpo = valor.trim().replace(/^@/, "");
  if (servico !== "site") return limpo;

  try {
    return new URL(/^https?:\/\//i.test(limpo) ? limpo : `https://${limpo}`)
      .hostname;
  } catch {
    return limpo;
  }
}
