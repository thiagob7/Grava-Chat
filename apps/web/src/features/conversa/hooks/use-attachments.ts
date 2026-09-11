import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { Attachment } from "@gravae/shared";
import { LIMITS } from "@gravae/shared";

import { apiErrorMessage } from "~/@core/lib/api";
import { uploadImage } from "~/lib/upload";

export interface PendingAttachment {
  id: string;
  filename: string;
  contentType: string;
  previewUrl: string | null;
  originalSize: number;
  uploadedSize: number | null;
  attachment: Attachment | null;
  error: string | null;
}

const MESSAGE_IMAGE_MAX_PX = 1600;

export function useAttachments() {
  const [items, setItems] = useState<PendingAttachment[]>([]);
  const previews = useRef(new Set<string>());

  useEffect(
    () => () => {
      previews.current.forEach((url) => URL.revokeObjectURL(url));
      previews.current.clear();
    },
    [],
  );

  const patch = useCallback((id: string, data: Partial<PendingAttachment>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...data } : item)));
  }, []);

  const patchAttachment = useCallback(
    (id: string, data: { filename?: string; description?: string | null; spoiler?: boolean }) => {
      setItems((current) =>
        current.map((item) =>
          item.id === id && item.attachment
            ? {
                ...item,
                filename: data.filename ?? item.filename,
                attachment: { ...item.attachment, ...data },
              }
            : item,
        ),
      );
    },
    [],
  );

  const [largeToo, setLargeToo] = useState<string | null>(null);

  const add = useCallback(
    async (files: File[]) => {
      const space = LIMITS.attachmentsPerMessage - items.length;

      if (space <= 0) {
        toast.error(`Máximo de ${LIMITS.attachmentsPerMessage} anexos por mensagem.`);
        return;
      }

      const accepted = files.slice(0, space);
      if (files.length > space) {
        toast.warn(`Só cabem mais ${space} anexo(s) nesta mensagem.`);
      }

      for (const file of accepted) {
        if (file.size > LIMITS.attachmentBytes) {
          setLargeToo(file.name);
          continue;
        }

        const id = crypto.randomUUID();
        const isImage = file.type.startsWith("image/");
        const previewUrl = isImage ? URL.createObjectURL(file) : null;
        if (previewUrl) previews.current.add(previewUrl);

        setItems((current) => [
          ...current,
          {
            id,
            filename: file.name,
            contentType: file.type,
            previewUrl,
            originalSize: file.size,
            uploadedSize: null,
            attachment: null,
            error: null,
          },
        ]);

        try {
          const sent = await uploadImage(file, { maxSize: MESSAGE_IMAGE_MAX_PX });
          patch(id, { attachment: sent.attachment, uploadedSize: sent.uploadedSize });
        } catch (error) {
          patch(id, { error: apiErrorMessage(error, "Falha no envio") });
        }
      }
    },
    [items.length, patch],
  );

  const remove = useCallback((id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        previews.current.delete(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setItems((current) => {
      current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
          previews.current.delete(item.previewUrl);
        }
      });
      return [];
    });
  }, []);

  return {
    items,
    largeToo,
    forgetLargeToo: () => setLargeToo(null),
    add,
    remove,
    clear,
    patchAttachment,
    ready: items.map((item) => item.attachment).filter((a): a is Attachment => Boolean(a)),
    uploading: items.some((item) => !item.attachment && !item.error),
  };
}
