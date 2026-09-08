import { routes, type VercelConfig } from "@vercel/config/v1";

const API = {
  producao: "https://gravaechat-api.duckdns.org",
  staging: "https://gravaechat-api-staging.duckdns.org",
};

const destino = process.env.VERCEL_ENV === "production" ? API.producao : API.staging;

export const config: VercelConfig = {
  buildCommand: "cd ../.. && yarn build --filter=@gravae/web",
  outputDirectory: "dist",
  installCommand: "cd ../.. && yarn install --frozen-lockfile",

  rewrites: [
    routes.rewrite("/api/:path*", `${destino}/api/:path*`),
    routes.rewrite("/(.*)", "/index.html"),
  ],
};

export default config;
