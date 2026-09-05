import { z } from "zod";

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
  R2_REGION: z.string().default("auto"),
  R2_BUCKET: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_PUBLIC_URL: z.string().min(1),
  R2_PREFIX: z.string().default("gravae-chat"),
  R2_DIRECT_UPLOAD: z.stringbool().default(false),

  LIVEKIT_URL: z.string().default("ws://localhost:7880"),
  LIVEKIT_API_KEY: z.string().default("devkey"),
  LIVEKIT_API_SECRET: z.string().default(""),

  SFU_STATUS_URL: z.string().default(""),
  SFU_STATUS_TOKEN: z.string().default(""),

  KLIPY_API_KEY: z.string().default(""),

  ADMIN_EMAILS: z.string().default(""),

  /// A tela do Swagger em /api/docs. Em desenvolvimento ela abre sempre; em
  /// producao so com isto ligado, para nao publicar o mapa da API sem querer.
  DOCS_ABERTAS: z.stringbool().default(false),
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
