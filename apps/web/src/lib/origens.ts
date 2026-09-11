import { APP_ORIGINS } from "@gravae/shared";

export function houseOrigins(): string[] {
  return [...new Set([window.location.origin, ...APP_ORIGINS])];
}
