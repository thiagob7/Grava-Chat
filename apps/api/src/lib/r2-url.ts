import { env } from "~/env.js";

export function isR2Url(value: string): boolean {
  try {
    const url = new URL(value);
    const base = new URL(env.R2_PUBLIC_URL.endsWith("/") ? env.R2_PUBLIC_URL : `${env.R2_PUBLIC_URL}/`);

    return url.origin === base.origin && url.pathname.startsWith(base.pathname) && !url.username && !url.password;
  } catch {
    return false;
  }
}
