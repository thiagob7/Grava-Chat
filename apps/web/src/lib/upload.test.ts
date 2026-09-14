import { describe, expect, it, vi } from "vitest";

const uploadFile = vi.fn(async (file: File) => ({ id: "k", url: "u", filename: file.name, contentType: file.type, size: file.size }));

vi.mock("~/@core/application/requests/upload/find-upload-config", () => ({
  findUploadConfig: async () => ({ direct: false }),
}));
vi.mock("~/@core/application/requests/upload/presign-upload", () => ({ presignUpload: vi.fn() }));
vi.mock("~/@core/application/requests/upload/upload-file", () => ({ uploadFile }));
vi.mock("~/lib/image", () => ({ resizeImage: vi.fn() }));

const { sendFile } = await import("~/lib/upload");

describe("enviar arquivo", () => {
  it("sem upload direto, manda pela API em vez de chamar a si mesmo", async () => {
    const file = new File(["oi"], "recado.webm", { type: "audio/webm" });

    await expect(sendFile(file)).resolves.toMatchObject({ filename: "recado.webm" });
    expect(uploadFile).toHaveBeenCalledOnce();
  });
});
