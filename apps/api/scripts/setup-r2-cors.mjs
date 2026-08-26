import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../../../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const s3 = new S3Client({
  region: env.R2_REGION || "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const origens = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://*.ngrok-free.dev",
  "https://*.ngrok-free.app",
  "https://*.ngrok.io",
  ...process.argv.slice(2),
];

try {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: env.R2_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origens,
            AllowedMethods: ["PUT", "GET", "HEAD"],
            AllowedHeaders: ["content-type"],
            ExposeHeaders: ["etag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );

  const atual = await s3.send(new GetBucketCorsCommand({ Bucket: env.R2_BUCKET }));
  console.log("CORS aplicado no bucket", env.R2_BUCKET);
  for (const regra of atual.CORSRules ?? []) {
    console.log("  origens:", regra.AllowedOrigins?.join(", "));
    console.log("  metodos:", regra.AllowedMethods?.join(", "));
  }
} catch (e) {
  console.log("nao consegui aplicar:", e.name, "-", e.message);
  console.log("\nO token do R2 provavelmente nao tem permissao de configuracao de bucket.");
  console.log("Nesse caso, configure no painel: R2 > bucket > Settings > CORS Policy");
  console.log(JSON.stringify([{ AllowedOrigins: origens, AllowedMethods: ["PUT","GET","HEAD"], AllowedHeaders: ["content-type"], ExposeHeaders: ["etag"], MaxAgeSeconds: 3600 }], null, 2));
  process.exit(1);
}
