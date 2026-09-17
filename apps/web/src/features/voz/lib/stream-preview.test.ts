import { describe, expect, it } from "vitest";

import { createThrottle } from "./stream-preview";

describe("preview throttle", () => {
  it("serves each viewer at most once per interval", () => {
    let now = 0;
    const allowed = createThrottle(3000, () => now);

    expect(allowed("ana")).toBe(true);
    now = 1000;
    expect(allowed("ana")).toBe(false);
    expect(allowed("bia")).toBe(true);
    now = 3000;
    expect(allowed("ana")).toBe(true);
  });
});
