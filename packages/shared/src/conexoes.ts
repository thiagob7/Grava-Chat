import { z } from "zod";

export const SERVICES = [
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

export type Service = (typeof SERVICES)[number];

export const SERVICES_NAMES: Record<Service, string> = {
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

const MOLDS: Record<Exclude<Service, "site">, string> = {
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

export const connectionSchema = z.object({
  service: z.enum(SERVICES),
  value: z.string().min(1).max(200),
});

export type Connection = z.infer<typeof connectionSchema>;

export function connectionAddress({ service, value }: Connection): string | null {
  const clean = value.trim().replace(/^@/, "");
  if (!clean) return null;

  if (service === "site") {
    const withSchema = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;

    try {
      const url = new URL(withSchema);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      if (!url.hostname.includes(".")) return null;

      return url.toString();
    } catch {
      return null;
    }
  }

  if (!HANDLE.test(clean)) return null;

  return `${MOLDS[service]}${clean}`;
}

export function asLe({ service, value }: Connection): string {
  const clean = value.trim().replace(/^@/, "");
  if (service !== "site") return clean;

  try {
    return new URL(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`)
      .hostname;
  } catch {
    return clean;
  }
}
