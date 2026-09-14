import React, { useRef } from "react";
import { LIMITS } from "@gravae/shared";

import { ImageEditor } from "~/components/EditorDeImagem";
import { ImagePicker } from "~/components/SeletorDeImagem";
import type {
  ProfileImageFrame,
  ProfileImageSending,
} from "~/features/perfil/hooks/use-envio-de-imagem-de-perfil";

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
  onSkip?: () => void;
}> = ({ framing, onCancel, onApply, onSkip }) => {
  const photo = framing?.field === "avatarUrl";

  return (
    <ImageEditor data-gc="perfil.enquadrar-imagem-de-perfil.image-editor.on-cancel"
      file={framing?.file ?? null}
      aspect={framing?.aspect ?? 1}
      exportWidth={framing?.exportWidth ?? 256}
      mime="image/webp"
      round={photo}
      gifWidth={photo ? 256 : 480}
      gifMaxBytes={photo ? LIMITS.avatarBytes : LIMITS.bannerBytes}
      title={photo ? "Cortar foto" : "Cortar faixa"}
      applyLabel={photo ? "Usar foto" : "Usar faixa"}
      onCancel={onCancel}
      onApply={onApply}
      onSkip={onSkip}
    />
  );
};

export const ProfileImageChooser: React.FC<{ image: ProfileImageSending }> = ({ image }) => {
  const input = useRef<HTMLInputElement>(null);
  const photo = image.chooserField === "avatarUrl";
  const limit = Math.round((photo ? LIMITS.avatarBytes : LIMITS.bannerBytes) / 1024 / 1024);

  return (
    <>
      <input data-gc="perfil.enquadrar-imagem-de-perfil.input"
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file && image.chooserField) image.sendFile(file, image.chooserField);
        }}
      />

      <ImagePicker data-gc="perfil.enquadrar-imagem-de-perfil.image-picker.close-chooser"
        open={image.chooserOpen}
        title={photo ? "Trocar foto" : "Trocar faixa"}
        footer={`PNG, JPEG, WebP ou GIF. Até ${limit} MB. O GIF continua animado.`}
        onClose={image.closeChooser}
        onFile={() => {
          image.closeChooser();
          input.current?.click();
        }}
        onGif={(gif) => {
          image.closeChooser();
          if (image.chooserField) void image.sendGif(gif.gif ?? gif.url, image.chooserField);
        }}
      />

      <ProfileImageFraming data-gc="perfil.enquadrar-imagem-de-perfil.profile-image-framing.cancel-frame"
        framing={image.framing}
        onCancel={image.cancelFrame}
        onApply={(cut) => void image.applyFrame(cut)}
        onSkip={() => void image.skipFrame()}
      />
    </>
  );
};
