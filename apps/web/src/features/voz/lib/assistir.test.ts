import { describe, expect, it } from "vitest";

import { nextTarget, type TargetChoice } from "./assistir";

const base: TargetChoice = { current: null, targetStillBroadcasts: false };

describe("proximoAlvo", () => {
  it("a escolha de assistir a alguém sobrevive a vários eventos seguidos", () => {
    const watchingFriend = { current: "amigo", targetStillBroadcasts: true };

    let target = nextTarget(watchingFriend);
    for (let i = 0; i < 5; i++) target = nextTarget({ ...watchingFriend, current: target });

    expect(target).toBe("amigo");
  });

  it("começar a transmitir não sequestra a tela", () => {
    expect(nextTarget(base)).toBeNull();
  });

  it("quando a transmissão que eu assistia acaba, volta pra grade", () => {
    expect(nextTarget({ current: "amigo", targetStillBroadcasts: false })).toBeNull();
  });

  it("sem nada escolhido, fica na grade", () => {
    expect(nextTarget(base)).toBeNull();
  });

  it("alvo escolhido e no ar continua no ar", () => {
    expect(nextTarget({ current: "amigo", targetStillBroadcasts: true })).toBe("amigo");
  });
});
