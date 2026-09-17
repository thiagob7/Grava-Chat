export const MAX_CAMERAS_PER_CALL = 25;

export function cameraLimitReached(tiles: { isLocal: boolean; cameraOn: boolean }[]): boolean {
  const others = tiles.filter((tile) => !tile.isLocal && tile.cameraOn).length;
  return others >= MAX_CAMERAS_PER_CALL;
}
