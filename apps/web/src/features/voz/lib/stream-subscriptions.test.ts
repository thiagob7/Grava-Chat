import { Track } from "livekit-client";
import { describe, expect, it } from "vitest";

import { wantsSubscription } from "./stream-subscriptions";

describe("which tracks a viewer receives", () => {
  it("always receives microphones and cameras", () => {
    expect(wantsSubscription(Track.Source.Microphone, "ana", null)).toBe(true);
    expect(wantsSubscription(Track.Source.Camera, "ana", "bia")).toBe(true);
  });

  it("receives a screen share and its sound only from the person being watched", () => {
    expect(wantsSubscription(Track.Source.ScreenShare, "ana", "ana")).toBe(true);
    expect(wantsSubscription(Track.Source.ScreenShareAudio, "ana", "ana")).toBe(true);
    expect(wantsSubscription(Track.Source.ScreenShare, "ana", "bia")).toBe(false);
    expect(wantsSubscription(Track.Source.ScreenShareAudio, "ana", null)).toBe(false);
  });

  it("keeps unknown sources, like a music bot, audible", () => {
    expect(wantsSubscription(Track.Source.Unknown, "bot", null)).toBe(true);
  });
});
