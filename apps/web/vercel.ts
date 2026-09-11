import { routes, type VercelConfig } from "@vercel/config/v1";

const API = {
  production: "https://gravaechat-api.duckdns.org",
  staging: "https://gravaechat-api-staging.duckdns.org",
};

const destination = process.env.VERCEL_ENV === "production" ? API.production : API.staging;

export const config: VercelConfig = {
  buildCommand: "cd ../.. && yarn build --filter=@gravae/web",
  outputDirectory: "dist",
  installCommand: "cd ../.. && yarn install --frozen-lockfile",

  rewrites: [
    routes.rewrite("/api/:path*", `${destination}/api/:path*`),
    routes.rewrite("/(.*)", "/index.html"),
  ],
};

export default config;
