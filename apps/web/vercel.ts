import type { VercelConfig } from "@vercel/config/v1";

const API = {
  production: "https://ravoxchat-api.duckdns.org",
  staging: "https://ravoxchat-api-staging.duckdns.org",
};

const destination = process.env.VERCEL_ENV === "production" ? API.production : API.staging;

export const config: VercelConfig = {
  buildCommand: "cd ../.. && yarn build --filter=@gravae/web",
  outputDirectory: "dist",
  installCommand: "cd ../.. && yarn install --frozen-lockfile",

  routes: [
    {
      src: "/(.*)",
      headers: {
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
      },
      continue: true,
    },
    {
      src: "^/api/(.*)$",
      dest: `${destination}/api/$1`,
      transforms: [
        {
          type: "request.headers",
          op: "set",
          target: { key: "x-gravae-borda" },
          args: "$EDGE_SECRET",
          env: ["EDGE_SECRET"],
        },
      ],
    },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/index.html" },
  ],
};

export default config;
