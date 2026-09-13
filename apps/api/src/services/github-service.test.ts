import { describe, expect, it, vi } from "vitest";

vi.mock("~/env.js", () => ({ env: { GITHUB_TOKEN: "", GITHUB_REPOSITORY: "dono/repo" } }));

const { deployStateOf, githubService, stateOf } = await import("~/services/github-service.js");

describe("estado de uma execução do GitHub", () => {
  it("esperando aprovação é o estado que o painel destaca", () => {
    expect(stateOf("waiting", null)).toBe("esperando");
  });

  it("na fila e rodando são a mesma coisa para quem olha", () => {
    expect(stateOf("queued", null)).toBe("rodando");
    expect(stateOf("in_progress", null)).toBe("rodando");
  });

  it("passo pulado não é falha", () => {
    expect(stateOf("completed", "skipped")).toBe("boa");
  });

  it("cancelada não se confunde com falhou", () => {
    expect(stateOf("completed", "cancelled")).toBe("cancelada");
    expect(stateOf("completed", "failure")).toBe("falhou");
  });

  it("deploy da Vercel sem status final ainda está rodando", () => {
    expect(deployStateOf(undefined)).toBe("rodando");
    expect(deployStateOf("success")).toBe("boa");
    expect(deployStateOf("error")).toBe("falhou");
  });
});

describe("aprovar sem token", () => {
  it("recusa em vez de fingir que aprovou", async () => {
    await expect(githubService.review(1, true, "Ana")).rejects.toMatchObject({ statusCode: 400 });
  });
});
