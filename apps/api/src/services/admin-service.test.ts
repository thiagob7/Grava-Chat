import { beforeEach, describe, expect, it, vi } from "vitest";

const OWNER = "6a8781da7415b08f427be1a4";
const MEMBER = "6a8781f57415b08f427be1ad";
const OTHER = "6a8781db7415b08f427be1aa";

const store = new Map<string, string>();
const users = new Map<string, { id: string; email: string; displayName: string; avatarUrl: null; isBot: boolean; system: boolean }>();
let members: {
  id: string;
  userId: string;
  email: string;
  areas: string[];
  passwordHash: string;
  mustChangePassword: boolean;
  passwordSetAt: Date;
  addedById: string | null;
  createdAt: Date;
  lastUnlockAt: Date | null;
}[] = [];

vi.mock("~/env.js", () => ({ env: { ADMIN_EMAILS: "dono@gravae.io" } }));

vi.mock("~/lib/serialize.js", () => ({
  ADMINS: new Set(["dono@gravae.io"]),
  isAdmin: (email: string) => email.toLowerCase() === "dono@gravae.io",
}));

vi.mock("~/lib/redis.js", () => ({
  keys: {
    adminSession: (h: string) => `sessao:${h}`,
    adminAttempts: (id: string) => `tentativas:${id}`,
  },
  redis: {
    get: async (k: string) => store.get(k) ?? null,
    set: async (k: string, v: string) => void store.set(k, v),
    del: async (k: string) => void store.delete(k),
    incr: async (k: string) => {
      const next = Number(store.get(k) ?? 0) + 1;
      store.set(k, String(next));
      return next;
    },
    expire: async () => 1,
  },
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    findById: async (id: string) => users.get(id) ?? null,
    findByEmail: async (email: string) => [...users.values()].find((u) => u.email === email) ?? null,
    findManyByIds: async (ids: string[]) => ids.map((id) => users.get(id)).filter(Boolean),
  },
}));

vi.mock("~/lib/prisma.js", () => ({
  prisma: {
    adminLog: { create: async () => ({}), findMany: async () => [] },
    adminMember: {
      findFirst: async ({ where }: { where: { userId: string } }) => members.find((m) => m.userId === where.userId) ?? null,
      findUnique: async ({ where }: { where: { id: string } }) => members.find((m) => m.id === where.id) ?? null,
      findMany: async () => members,
      create: async ({ data }: { data: Omit<(typeof members)[number], "id" | "createdAt" | "lastUnlockAt" | "passwordSetAt"> }) => {
        const row = { ...data, id: `m${members.length + 1}`, createdAt: new Date(), lastUnlockAt: null, passwordSetAt: new Date() };
        members.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<(typeof members)[number]> }) => {
        const row = members.find((m) => m.id === where.id)!;
        Object.assign(row, data);
        return row;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        members = members.filter((m) => m.id !== where.id);
      },
    },
  },
}));

const { adminService } = await import("~/services/admin-service.js");
const { generateHash } = await import("~/lib/senha.js");

const person = (id: string, email: string) => ({ id, email, displayName: email, avatarUrl: null, isBot: false, system: false });

beforeEach(async () => {
  store.clear();
  users.clear();
  members = [];
  users.set(OWNER, person(OWNER, "dono@gravae.io"));
  users.set(MEMBER, person(MEMBER, "ana@gmail.com"));
  users.set(OTHER, person(OTHER, "bia@gmail.com"));

  members.push({
    id: "m0",
    userId: MEMBER,
    email: "ana@gmail.com",
    areas: ["servidor", "denuncias", "administradores"],
    passwordHash: await generateHash("provisoria-123"),
    mustChangePassword: true,
    passwordSetAt: new Date(Date.now() - 1000),
    addedById: OWNER,
    createdAt: new Date(),
    lastUnlockAt: null,
  });
});

describe("quem entra no painel", () => {
  it("quem não é administrador nem descobre que o painel existe", async () => {
    await expect(adminService.require(OTHER, undefined, "servidor")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("o dono entra direto, sem senha de painel", async () => {
    await expect(adminService.require(OWNER, undefined, "aprovar")).resolves.toMatchObject({ role: "dono" });
  });

  it("administrador sem senha digitada fica trancado", async () => {
    await expect(adminService.require(MEMBER, undefined, "servidor")).rejects.toMatchObject({ statusCode: 423 });
  });

  it("com a senha provisória ele entra, mas só para trocar", async () => {
    const { token, mustChangePassword } = await adminService.unlock(MEMBER, "provisoria-123");

    expect(mustChangePassword).toBe(true);
    await expect(adminService.require(MEMBER, token, "servidor")).rejects.toMatchObject({ statusCode: 403 });
  });

  it("depois de trocar, usa só as áreas dele", async () => {
    const first = await adminService.unlock(MEMBER, "provisoria-123");
    const { token } = await adminService.changePassword(MEMBER, first.token, "provisoria-123", "nova-e-bem-longa");

    await expect(adminService.require(MEMBER, token, "servidor")).resolves.toMatchObject({ role: "admin" });
    await expect(adminService.require(MEMBER, token, "aprovar")).rejects.toMatchObject({ statusCode: 403 });
  });

  it("trocar a senha derruba o painel aberto com a anterior", async () => {
    const first = await adminService.unlock(MEMBER, "provisoria-123");
    await adminService.changePassword(MEMBER, first.token, "provisoria-123", "nova-e-bem-longa");

    await expect(adminService.require(MEMBER, first.token, "servidor")).rejects.toMatchObject({ statusCode: 423 });
  });

  it("senha errada não abre, e a sexta tentativa é barrada", async () => {
    for (let i = 0; i < 5; i++) {
      await expect(adminService.unlock(MEMBER, "errada")).rejects.toMatchObject({ statusCode: 403 });
    }

    await expect(adminService.unlock(MEMBER, "provisoria-123")).rejects.toMatchObject({ statusCode: 429 });
  });

  it("removido do painel, a sessão aberta para de valer", async () => {
    const first = await adminService.unlock(MEMBER, "provisoria-123");
    members = [];

    await expect(adminService.require(MEMBER, first.token, "servidor")).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("quem pode dar o quê", () => {
  const owner = { role: "dono" as const, userId: OWNER, email: "dono@gravae.io", areas: ["publicacoes", "aprovar", "servidor", "denuncias", "comunicado", "comunidades", "administradores"] as never, memberId: null, mustChangePassword: false, passwordSetAt: 0 };
  const manager = { role: "admin" as const, userId: MEMBER, email: "ana@gmail.com", areas: ["servidor", "denuncias", "administradores"] as never, memberId: "m0", mustChangePassword: false, passwordSetAt: 0 };

  it("o dono adiciona com senha provisória e troca obrigatória", async () => {
    await adminService.add(owner, { email: "BIA@gmail.com", areas: ["aprovar"], password: "provisoria-456" });

    const added = members.find((m) => m.userId === OTHER);
    expect(added).toMatchObject({ email: "bia@gmail.com", areas: ["aprovar"], mustChangePassword: true });
    expect(added?.passwordHash).not.toContain("provisoria-456");
  });

  it("quem gerencia não libera área que não tem", async () => {
    await expect(
      adminService.add(manager, { email: "bia@gmail.com", areas: ["aprovar"], password: "provisoria-456" }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("só o dono libera a gestão de administradores", async () => {
    await expect(
      adminService.add(manager, { email: "bia@gmail.com", areas: ["administradores"], password: "provisoria-456" }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("senha provisória curta é recusada", async () => {
    await expect(
      adminService.add(owner, { email: "bia@gmail.com", areas: ["servidor"], password: "curta" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("e-mail sem conta no Ravox Chat não entra", async () => {
    await expect(
      adminService.add(owner, { email: "ninguem@gmail.com", areas: ["servidor"], password: "provisoria-456" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("ninguém mexe no próprio acesso", async () => {
    await expect(adminService.remove(manager, "m0")).rejects.toMatchObject({ statusCode: 403 });
  });
});
