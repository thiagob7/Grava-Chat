import { describe, expect, it } from "vitest";

import { LIMITS } from "./constants.js";
import { botEditMessageInput, botSendMessageInput, componentsInput, embedsInput, interactionCallbackInput } from "./models.js";

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

describe("componentsInput", () => {
  const button = (extra: object) => ({ type: "button", style: "primary", label: "Go", customId: "go", ...extra });

  it("accepts buttons and a select in separate rows", () => {
    const result = componentsInput.safeParse([
      { components: [button({}), button({ customId: "stop", style: "danger", label: "Stop" })] },
      { components: [{ type: "select", customId: "pick", options: [{ label: "A", value: "a" }] }] },
      { components: [{ type: "button", style: "link", label: "Site", url: "https://example.com" }] },
    ]);

    expect(result.success).toBe(true);
  });

  it("refuses a select sharing a row", () => {
    const result = componentsInput.safeParse([
      { components: [button({}), { type: "select", customId: "pick", options: [{ label: "A", value: "a" }] }] },
    ]);
    expect(result.success).toBe(false);
  });

  it("refuses repeated customIds", () => {
    expect(componentsInput.safeParse([{ components: [button({}), button({})] }]).success).toBe(false);
  });

  it("a link button needs url and no customId, the others the opposite", () => {
    expect(componentsInput.safeParse([{ components: [button({ style: "link", url: "https://x.com" })] }]).success).toBe(false);
    expect(componentsInput.safeParse([{ components: [button({ url: "https://x.com" })] }]).success).toBe(false);
    expect(componentsInput.safeParse([{ components: [{ type: "button", style: "link", label: "x" }] }]).success).toBe(false);
  });

  it("a button needs a label or an emoji", () => {
    expect(componentsInput.safeParse([{ components: [{ type: "button", style: "primary", customId: "x" }] }]).success).toBe(false);
    expect(componentsInput.safeParse([{ components: [{ type: "button", style: "primary", customId: "x", emoji: "✅" }] }]).success).toBe(true);
  });

  it("refuses too many rows or too many buttons in a row", () => {
    const row = (n: number, prefix: string) => ({
      components: Array.from({ length: n }, (_, i) => button({ customId: `${prefix}${i}` })),
    });
    expect(componentsInput.safeParse([row(LIMITS.componentsPerRow + 1, "a")]).success).toBe(false);
    expect(
      componentsInput.safeParse(Array.from({ length: LIMITS.componentRows + 1 }, (_, i) => row(1, `r${i}`))).success,
    ).toBe(false);
  });

  it("refuses a select with repeated values or impossible min and max", () => {
    const select = (extra: object) => ({
      components: [{ type: "select", customId: "s", options: [{ label: "A", value: "a" }, { label: "B", value: "b" }], ...extra }],
    });
    expect(componentsInput.safeParse([select({ options: [{ label: "A", value: "a" }, { label: "B", value: "a" }] })]).success).toBe(false);
    expect(componentsInput.safeParse([select({ minValues: 2, maxValues: 1 })]).success).toBe(false);
    expect(componentsInput.safeParse([select({ minValues: 3, maxValues: 3 })]).success).toBe(false);
    expect(componentsInput.safeParse([select({ minValues: 0, maxValues: 2 })]).success).toBe(true);
  });
});

describe("interactionCallbackInput", () => {
  it("accepts reply, update and defer", () => {
    expect(interactionCallbackInput.safeParse({ type: "reply", data: { content: "Hi" } }).success).toBe(true);
    expect(interactionCallbackInput.safeParse({ type: "update", data: { components: [] } }).success).toBe(true);
    expect(interactionCallbackInput.safeParse({ type: "defer" }).success).toBe(true);
    expect(interactionCallbackInput.safeParse({ type: "update", data: {} }).success).toBe(false);
  });
});
