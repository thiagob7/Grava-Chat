import { describe, expect, it } from "vitest";

import { cameraLimitReached, MAX_CAMERAS_PER_CALL } from "./camera-limit";

const people = (cameras: number, total = cameras) =>
  Array.from({ length: total }, (_, i) => ({ isLocal: false, cameraOn: i < cameras }));

describe("camera limit per call", () => {
  it("lets a camera turn on while fewer than the limit are on", () => {
    expect(cameraLimitReached(people(MAX_CAMERAS_PER_CALL - 1, 40))).toBe(false);
  });

  it("blocks a new camera once the limit is on", () => {
    expect(cameraLimitReached(people(MAX_CAMERAS_PER_CALL, 40))).toBe(true);
  });

  it("does not count the person's own camera", () => {
    const tiles = [...people(MAX_CAMERAS_PER_CALL - 1), { isLocal: true, cameraOn: true }];
    expect(cameraLimitReached(tiles)).toBe(false);
  });
});
