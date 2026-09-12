import React from "react";

import { ImageEditor } from "~/components/EditorDeImagem";
import type { ProfileImageFrame } from "~/features/perfil/hooks/use-envio-de-imagem-de-perfil";

/*
  O enquadrador da foto e da faixa. Fica num componente só porque as duas telas
  que trocam imagem de perfil — a barra do editor e o lápis em cima do cartão —
  precisam do mesmo, e quem decide a proporção é o campo, não a tela.

  Sai em WebP para a foto com fundo transparente continuar transparente.
*/
export const ProfileImageFraming: React.FC<{
  framing: ProfileImageFrame | null;
  onCancel: () => void;
  onApply: (file: File) => void;
}> = ({ framing, onCancel, onApply }) => (
  <ImageEditor data-gc="perfil.enquadrar-imagem-de-perfil.image-editor.on-cancel"
    file={framing?.file ?? null}
    aspect={framing?.aspect ?? 1}
    exportWidth={framing?.exportWidth ?? 256}
    mime="image/webp"
    round={framing?.field === "avatarUrl"}
    onCancel={onCancel}
    onApply={onApply}
  />
);
