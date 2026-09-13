import { describe, expect, it } from "vitest";
import { Globe, Monitor, Smartphone } from "lucide-react";

import { deviceIcon } from "./aparelho-do-quadro";

describe("ícone do aparelho na etiqueta", () => {
  it("cada aparelho tem o seu desenho", () => {
    expect(deviceIcon("desktop")).toBe(Monitor);
    expect(deviceIcon("web")).toBe(Globe);
    expect(deviceIcon("mobile")).toBe(Smartphone);
  });

  it("cliente antigo não manda aparelho, e aí não se desenha nada", () => {
    expect(deviceIcon(null)).toBeNull();
  });
});
