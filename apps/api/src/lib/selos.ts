import { isDiscoverable } from "@gravae/shared";

export function serverSeals(
  guild: { discoverable: boolean | null; verified: boolean | null },
  members: number,
) {
  return {
    verified: Boolean(guild.verified),
    detectable: isDiscoverable(guild.discoverable, members),
  };
}
