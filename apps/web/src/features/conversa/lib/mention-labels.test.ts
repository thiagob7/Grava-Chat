import { describe, expect, it } from "vitest";

import { withMentionTokens } from "./mention-labels";

const leo = { label: "@Leonardo Barbosa", token: "<@6a9042feaaa85765e7f0c15e>" };
const leoCurto = { label: "@Leo", token: "<@6a9042feaaa85765e7f0c15f>" };

describe("menção escrita no campo", () => {
  it("troca o nome pelo código na hora de enviar", () => {
    expect(withMentionTokens("eae @Leonardo Barbosa tudo bem?", [leo])).toBe("eae <@6a9042feaaa85765e7f0c15e> tudo bem?");
  });

  it("nome mais longo ganha de um que começa igual", () => {
    expect(withMentionTokens("@Leonardo Barbosa e @Leo", [leoCurto, leo])).toBe(
      "<@6a9042feaaa85765e7f0c15e> e <@6a9042feaaa85765e7f0c15f>",
    );
  });

  it("não troca quando o nome continua numa palavra maior", () => {
    expect(withMentionTokens("@Leozinho", [leoCurto])).toBe("@Leozinho");
  });

  it("nome apagado do texto não vira menção", () => {
    expect(withMentionTokens("eae", [leo])).toBe("eae");
  });
});
