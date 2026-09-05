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

  const patch = useCallback((id: string, dados: Partial<PendingAttachment>) => {
    setItems((atuais) => atuais.map((item) => (item.id === id ? { ...item, ...dados } : item)));
  }, []);

  const patchAttachment = useCallback(
    (id: string, dados: { filename?: string; description?: string | null; spoiler?: boolean }) => {
      setItems((atuais) =>
        atuais.map((item) =>
          item.id === id && item.attachment
            ? {
                ...item,
                filename: dados.filename ?? item.filename,
                attachment: { ...item.attachment, ...dados },
              }
            : item,
        ),
      );
    },
    [],
  );

  const [grandeDemais, setGrandeDemais] = useState<string | null>(null);

  const add = useCallback(
    async (files: File[]) => {
      const espaco = LIMITS.attachmentsPerMessage - items.length;

      if (espaco <= 0) {
        toast.error(`Máximo de ${LIMITS.attachmentsPerMessage} anexos por mensagem.`);
        return;
      }

      const aceitos = files.slice(0, espaco);
      if (files.length > espaco) {
        toast.warn(`Só cabem mais ${espaco} anexo(s) nesta mensagem.`);
      }

      for (const file of aceitos) {
        if (file.size > LIMITS.attachmentBytes) {
          /// Quem recusa aqui não sabe desenhar modal — só avisa quem sabe.
          setGrandeDemais(file.name);
          continue;
        }

        const id = crypto.randomUUID();
        const ehImagem = file.type.startsWith("image/");
        const previewUrl = ehImagem ? URL.createObjectURL(file) : null;
        if (previewUrl) previews.current.add(previewUrl);

        setItems((atuais) => [
          ...atuais,
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
          const enviado = await uploadImage(file, { maxSize: MESSAGE_IMAGE_MAX_PX });
          patch(id, { attachment: enviado.attachment, uploadedSize: enviado.uploadedSize });
        } catch (erro) {
          patch(id, { error: apiErrorMessage(erro, "Falha no envio") });
        }
      }
    },
    [items.length, patch],
  );

  const remove = useCallback((id: string) => {
    setItems((atuais) => {
      const alvo = atuais.find((item) => item.id === id);
      if (alvo?.previewUrl) {
        URL.revokeObjectURL(alvo.previewUrl);
        previews.current.delete(alvo.previewUrl);
      }
      return atuais.filter((item) => item.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setItems((atuais) => {
      atuais.forEach((item) => {
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
    grandeDemais,
    esquecerGrandeDemais: () => setGrandeDemais(null),
    add,
    remove,
    clear,
    patchAttachment,
    prontos: items.map((item) => item.attachment).filter((a): a is Attachment => Boolean(a)),
    subindo: items.some((item) => !item.attachment && !item.error),
  };
}
