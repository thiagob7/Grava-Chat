import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("class merging", () => {
  it("keeps a house font size that is followed by a text colour", () => {
    expect(cn("text-10", "text-ink-muted")).toBe("text-10 text-ink-muted");
    expect(cn("text-11", "text-danger")).toBe("text-11 text-danger");
    expect(cn("text-13", "text-ink")).toBe("text-13 text-ink");
  });

  it("still lets one size win over another", () => {
    expect(cn("text-10", "text-11")).toBe("text-11");
    expect(cn("text-sm", "text-13")).toBe("text-13");
  });

  it("still lets one colour win over another", () => {
    expect(cn("text-ink", "text-brand")).toBe("text-brand");
  });

  it("keeps the tailwind sizes working", () => {
    expect(cn("text-xs", "text-ink-muted")).toBe("text-xs text-ink-muted");
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
