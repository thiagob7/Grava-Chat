import { deploymentEnv, routes, type VercelConfig } from "@vercel/config/v1";

const API = {
  production: "https://gravaechat-api.duckdns.org",
  staging: "https://gravaechat-api-staging.duckdns.org",
};

const destination = process.env.VERCEL_ENV === "production" ? API.production : API.staging;

export const config: VercelConfig = {
  buildCommand: "cd ../.. && yarn build --filter=@gravae/web",
  outputDirectory: "dist",
  installCommand: "cd ../.. && yarn install --frozen-lockfile",

  headers: [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
      ],
    },
  ],

  rewrites: [
    routes.rewrite("/api/:path*", `${destination}/api/:path*`, () => ({
      requestHeaders: { "x-gravae-borda": deploymentEnv("EDGE_SECRET") },
    })),
    routes.rewrite("/(.*)", "/index.html"),
  ],
};

export default config;
