import { describe, expect, it } from "vitest";

import { formatEventDate, isEventLive, timeUntilEvent } from "./event-timing";

const NOW = new Date("2026-09-09T15:00:00").getTime();

describe("event date", () => {
  it("names today and tomorrow instead of showing a date", () => {
    expect(formatEventDate(new Date("2026-09-09T20:00:00").toISOString(), NOW)).toMatch(/^Hoje às /);
    expect(formatEventDate(new Date("2026-09-10T01:00:00").toISOString(), NOW)).toMatch(/^Amanhã às /);
  });

  it("names yesterday too, for what has just passed", () => {
    expect(formatEventDate(new Date("2026-09-08T22:00:00").toISOString(), NOW)).toMatch(/^Ontem às /);
  });

  it("counts calendar days, not twenty-four hour blocks", () => {
    expect(formatEventDate(new Date("2026-09-10T02:00:00").toISOString(), NOW)).toMatch(/^Amanhã às /);
  });

  it("falls back to a date when it is far away", () => {
    expect(formatEventDate(new Date("2026-09-20T10:00:00").toISOString(), NOW)).toMatch(/^20 de set/);
  });

  it("shows the year when it is another one", () => {
    expect(formatEventDate(new Date("2027-01-05T10:00:00").toISOString(), NOW)).toContain("2027");
  });
});

describe("time until it starts", () => {
  it("is positive ahead and negative behind", () => {
    expect(timeUntilEvent(new Date("2026-09-09T16:00:00").toISOString(), NOW)).toBe(3_600_000);
    expect(timeUntilEvent(new Date("2026-09-09T14:00:00").toISOString(), NOW)).toBe(-3_600_000);
  });
});

describe("event running now", () => {
  it("is live inside the window", () => {
    expect(isEventLive(new Date("2026-09-09T14:30:00").toISOString(), 2 * 3_600_000, NOW)).toBe(true);
  });

  it("is not live before it starts", () => {
    expect(isEventLive(new Date("2026-09-09T16:00:00").toISOString(), 2 * 3_600_000, NOW)).toBe(false);
  });

  it("is not live after the window", () => {
    expect(isEventLive(new Date("2026-09-09T12:00:00").toISOString(), 2 * 3_600_000, NOW)).toBe(false);
  });
});
