import { describe, expect, it } from "vitest";

import { eventHasPassed, nextOccurrence } from "./guild-events";

const at = (iso: string) => new Date(iso).getTime();

describe("event that already happened", () => {
  it("compares against the given now", () => {
    expect(eventHasPassed({ startsAt: "2026-09-01T10:00:00Z" }, at("2026-09-02T00:00:00Z"))).toBe(true);
    expect(eventHasPassed({ startsAt: "2026-09-10T10:00:00Z" }, at("2026-09-02T00:00:00Z"))).toBe(false);
  });
});

describe("next occurrence", () => {
  const startsAt = "2026-09-01T10:00:00.000Z";

  it("never moves an event that does not repeat", () => {
    expect(nextOccurrence(startsAt, "once", at("2026-12-01T00:00:00Z"))).toBe(startsAt);
  });

  it("leaves a future date alone", () => {
    expect(nextOccurrence(startsAt, "weekly", at("2026-08-01T00:00:00Z"))).toBe(startsAt);
  });

  it("skips whole weeks until it lands ahead of now", () => {
    expect(nextOccurrence(startsAt, "weekly", at("2026-09-16T00:00:00Z"))).toBe(
      "2026-09-22T10:00:00.000Z",
    );
  });

  it("moves a daily event to the next day", () => {
    expect(nextOccurrence(startsAt, "daily", at("2026-09-03T00:00:00Z"))).toBe(
      "2026-09-03T10:00:00.000Z",
    );
  });

  it("walks months, not thirty-day blocks", () => {
    const next = nextOccurrence("2026-01-31T10:00:00.000Z", "monthly", at("2026-04-01T00:00:00Z"));

    expect(new Date(next).getTime()).toBeGreaterThan(at("2026-04-01T00:00:00Z"));
  });

  it("keeps the time of day", () => {
    expect(new Date(nextOccurrence(startsAt, "weekly", at("2026-10-01T00:00:00Z"))).getUTCHours()).toBe(10);
  });
});
