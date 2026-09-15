import { describe, expect, it } from "vitest";

import { LIMITS } from "./constants.js";
import { botEditMessageInput, botSendMessageInput, embedsInput } from "./models.js";

describe("embedsInput", () => {
  it("accepts a card with fields, color, footer and timestamp", () => {
    const result = embedsInput.safeParse([
      {
        title: "New project request",
        color: 0xed4245,
        fields: [
          { name: "Client", value: "Davi", inline: true },
          { name: "Type", value: "build", inline: true },
          { name: "Details", value: "A village with spruce houses" },
        ],
        footer: { text: "Click to open a private channel" },
        timestamp: "2026-09-15T15:58:00.000Z",
      },
    ]);

    expect(result.success).toBe(true);
  });

  it("refuses an embed with nothing to show", () => {
    expect(embedsInput.safeParse([{ color: 0xffffff }]).success).toBe(false);
  });

  it("refuses more embeds than the limit", () => {
    const many = Array.from({ length: LIMITS.embedsPerMessage + 1 }, () => ({ title: "x" }));
    expect(embedsInput.safeParse(many).success).toBe(false);
  });

  it("refuses when the text of all embeds adds up past the total limit", () => {
    const long = "a".repeat(4096);
    expect(embedsInput.safeParse([{ description: long }, { description: long }]).success).toBe(false);
  });

  it("refuses links that are not http or https", () => {
    expect(embedsInput.safeParse([{ title: "x", url: "javascript:alert(1)" }]).success).toBe(false);
    expect(embedsInput.safeParse([{ title: "x", imageUrl: "data:image/png;base64,AAAA" }]).success).toBe(false);
  });

  it("refuses a color outside 24 bits", () => {
    expect(embedsInput.safeParse([{ title: "x", color: 0x1000000 }]).success).toBe(false);
  });

  it("refuses more fields than the limit", () => {
    const fields = Array.from({ length: LIMITS.embedFields + 1 }, (_, i) => ({ name: `f${i}`, value: "v" }));
    expect(embedsInput.safeParse([{ title: "x", fields }]).success).toBe(false);
  });
});

describe("bot message bodies", () => {
  it("a bot can send only embeds, with empty content", () => {
    expect(botSendMessageInput.safeParse({ content: "", embeds: [{ title: "Hi" }] }).success).toBe(true);
  });

  it("a bot edit needs content or embeds", () => {
    expect(botEditMessageInput.safeParse({}).success).toBe(false);
    expect(botEditMessageInput.safeParse({ embeds: [] }).success).toBe(true);
    expect(botEditMessageInput.safeParse({ content: "done" }).success).toBe(true);
  });
});
