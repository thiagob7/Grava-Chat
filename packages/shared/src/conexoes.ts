import { z } from "zod";

/**
 * Conexões: as contas de fora que a pessoa declara no próprio perfil.
 *
 * **Elas são DECLARADAS, não verificadas.** No Discord a conexão passa por
 * OAuth com o serviço e por isso vale como prova; aqui não passa por nada, e
 * fingir o contrário seria pior que não ter — alguém confiaria num "@" que
 * não é de quem diz ser. A tela diz isso com todas as letras, e o dia em que
 * houver OAuth de verdade, quem foi verificado ganha um selo que estes não
 * têm.
 *
 * O que a pessoa guarda é o NOME DE USUÁRIO, não a URL. Guardar URL deixaria
 * entrar `javascript:` e endereços de phishing com cara de perfil; guardando o
 * handle, o endereço é montado aqui e só pode apontar para o serviço certo.
 */
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

/// Onde o handle é colado para virar endereço. `site` não tem molde: ele já é
/// um endereço, e é o único que precisa de uma regra própria.
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

/*
  O que um nome de usuário pode ter.

  Cada serviço tem a sua regra e nenhuma delas aceita barra, espaço ou dois
  pontos — que são exatamente os caracteres com que se escapa de um molde. Uma
  regra só, restritiva o bastante para todos, vale mais que doze regras quase
  iguais: a diferença entre elas nunca protegeu ninguém, e a semelhança sim.
*/
const HANDLE = /^[A-Za-z0-9._-]{1,40}$/;

export const conexaoSchema = z.object({
  servico: z.enum(SERVICOS),
  /// O `@` da frente é conforto de quem digita, e some antes de guardar.
  valor: z.string().min(1).max(200),
});

export type Conexao = z.infer<typeof conexaoSchema>;

/**
 * O endereço para onde a conexão leva — ou `null`, quando não dá para montar
 * um que seja seguro.
 *
 * `null` não é erro de digitação: é a garantia de que nada que não seja
 * `https://` de um domínio conhecido vira link clicável no perfil de alguém.
 */
export function enderecoDaConexao({ servico, valor }: Conexao): string | null {
  const limpo = valor.trim().replace(/^@/, "");
  if (!limpo) return null;

  if (servico === "site") {
    /*
      Só `http` e `https`.

      `javascript:` num link do perfil é execução de código na máquina de quem
      clica, e `data:` é a mesma coisa por outro caminho. O `URL` resolve isso
      lendo o protocolo de verdade em vez de confiar no começo do texto —
      `JaVaScRiPt:` e `\njavascript:` passariam por qualquer comparação ingênua.
    */
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

/// Como a conexão aparece escrita: o handle sem o `@`, ou o domínio no caso
/// do site — ninguém quer ler `https://` numa lista de cinco linhas.
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
