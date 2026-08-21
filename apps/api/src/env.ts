import { z } from "zod";

/**
 * Valida tudo na subida. E melhor o servidor se recusar a iniciar com uma
 * mensagem clara do que descobrir na Fase 3 que LIVEKIT_API_SECRET estava vazio.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  API_PORT: z.coerce.number().int().default(3333),
  API_HOST: z.string().default("0.0.0.0"),
  API_PUBLIC_URL: z.url().default("http://localhost:3333"),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  JWT_SECRET: z.string().min(16),
  COOKIE_SECRET: z.string().min(16),

  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),

  R2_ENDPOINT: z.string().min(1),
  // R2 usa "auto"; S3 de verdade usa a região do bucket
  R2_REGION: z.string().default("auto"),
  R2_BUCKET: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_PUBLIC_URL: z.string().min(1),
  /** Isola os arquivos deste app dentro do bucket (o token do R2 é de um bucket só). */
  R2_PREFIX: z.string().default("gravae-chat"),
  /**
   * Upload direto do navegador pro bucket (mais barato: o binário não passa
   * pela API). Exige política de CORS configurada no painel do R2 — enquanto
   * não houver, o arquivo sobe através da API.
   */
  R2_DIRECT_UPLOAD: z.stringbool().default(false),

  LIVEKIT_URL: z.string().default("ws://localhost:7880"),
  LIVEKIT_API_KEY: z.string().default("devkey"),
  LIVEKIT_API_SECRET: z.string().default(""),

  /** Busca de GIF. Sem chave, a aba de GIF explica o que falta em vez de quebrar. */
  KLIPY_API_KEY: z.string().default(""),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n  Variaveis de ambiente invalidas (confira o .env na raiz):\n");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("");
  process.exit(1);
}

export const env = parsed.data;
export const isDev = env.NODE_ENV === "development";
