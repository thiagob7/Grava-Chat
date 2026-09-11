import React, { useRef, useState } from "react";
import { ImageUp, Upload, X } from "lucide-react";
import { LIMITS } from "@gravae/shared";

import { importImage } from "~/@core/application/requests/upload/importar-imagem";
import { useImageProfileSending } from "~/features/perfil/hooks/use-envio-de-imagem-de-perfil";
import { ImagePicker } from "~/components/SeletorDeImagem";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { Input, Label, Textarea } from "~/components/ui/input";
import { ColorField } from "~/features/configuracoes/components/perfil/campos";
import type { ProfileDraft } from "~/features/configuracoes/components/perfil/rascunho";
import { toast } from "react-toastify";

interface IdentityTabProps {
  id: string;
  username: string;
  draft: ProfileDraft;
  set: <K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) => void;
}

export const IdentityTab: React.FC<IdentityTabProps> = ({ id, username, draft, set }) => {
  const { send, saving, sending } = useImageProfileSending((field, url) =>
    set(field, url),
  );
  const pickPhoto = useRef<HTMLInputElement>(null);
  const pickBanner = useRef<HTMLInputElement>(null);
  const [pickingTrack, setPickingTrack] = useState(false);
  const [importing, setImporting] = useState(false);

  const useGif = async (url: string) => {
    setImporting(true);
    const attachment = await importImage(url, "banner")
      .catch(() => {
        toast.error("Não consegui trazer esse GIF.");
        return null;
      })
      .finally(() => setImporting(false));

    if (attachment) set("bannerUrl", attachment.url);
  };

  return (
    <div data-gc="configuracoes.perfil.identidade-aba.div" className="space-y-6">
      <div data-gc="configuracoes.perfil.identidade-aba.div--2" className="flex items-center gap-4">
        <Avatar data-gc="configuracoes.perfil.identidade-aba.avatar"
          id={id}
          name={draft.displayName}
          url={draft.avatarUrl}
          size={72}
          charms={{ decoration: draft.decoration, frame: draft.frame }}
          animate
        />

        <div data-gc="configuracoes.perfil.identidade-aba.div--3">
          <Button data-gc="configuracoes.perfil.identidade-aba.button"
            variant="surface"
            size="sm"
            onClick={() => pickPhoto.current?.click()}
            disabled={sending}
          >
            <Upload data-gc="configuracoes.perfil.identidade-aba.upload" size={14} />
            {sending ? "Enviando…" : "Trocar foto"}
          </Button>

          <p data-gc="configuracoes.perfil.identidade-aba.p" className="mt-1.5 text-xs text-ink-faint">
            {saving
              ? `Comprimida antes de subir: ${saving}`
              : "A imagem é reduzida no navegador antes de subir."}
          </p>

          <input data-gc="configuracoes.perfil.identidade-aba.input"
            ref={pickPhoto}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => void send(e, "avatarUrl")}
            className="hidden"
          />
        </div>
      </div>

      <div data-gc="configuracoes.perfil.identidade-aba.div--4">
        <Label data-gc="configuracoes.perfil.identidade-aba.label" htmlFor="display-name">Nome de exibição</Label>
        <Input data-gc="configuracoes.perfil.identidade-aba.input--2"
          id="display-name"
          value={draft.displayName}
          onChange={(e) => set("displayName", e.target.value)}
          maxLength={LIMITS.displayName}
        />
      </div>

      <div data-gc="configuracoes.perfil.identidade-aba.div--5">
        <Label data-gc="configuracoes.perfil.identidade-aba.label--2" htmlFor="username">Nome de usuário</Label>
        <Input data-gc="configuracoes.perfil.identidade-aba.input--3" id="username" value={`@${username}`} readOnly className="text-ink-faint" />
        <p data-gc="configuracoes.perfil.identidade-aba.p--2" className="mt-1 text-xs text-ink-faint">
          É por aqui que seus amigos te encontram. Ainda não dá pra trocar.
        </p>
      </div>

      <div data-gc="configuracoes.perfil.identidade-aba.div--6">
        <Label data-gc="configuracoes.perfil.identidade-aba.label--3" htmlFor="bio">Sobre mim</Label>
        <Textarea data-gc="configuracoes.perfil.identidade-aba.textarea"
          id="bio"
          value={draft.bio}
          onChange={(e) => set("bio", e.target.value)}
          maxLength={512}
          rows={3}
          placeholder="Conte algo sobre você"
        />
      </div>

      <div data-gc="configuracoes.perfil.identidade-aba.div--7" className="h-px bg-line" />

      <div data-gc="configuracoes.perfil.identidade-aba.div--8">
        <Label data-gc="configuracoes.perfil.identidade-aba.label--4">Faixa do cartão</Label>
        <div data-gc="configuracoes.perfil.identidade-aba.div--9" className="flex items-center gap-2">
          <Button data-gc="configuracoes.perfil.identidade-aba.button--2"
            variant="surface"
            size="sm"
            onClick={() => setPickingTrack(true)}
            disabled={sending || importing}
          >
            <ImageUp data-gc="configuracoes.perfil.identidade-aba.image-up" size={14} />
            {importing ? "Trazendo o GIF…" : "Escolher imagem ou GIF"}
          </Button>

          {draft.bannerUrl && (
            <Button data-gc="configuracoes.perfil.identidade-aba.button--3" variant="ghost" size="sm" onClick={() => set("bannerUrl", null)}>
              <X data-gc="configuracoes.perfil.identidade-aba.x" size={14} /> Tirar
            </Button>
          )}
        </div>

        <input data-gc="configuracoes.perfil.identidade-aba.input--4"
          ref={pickBanner}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => void send(e, "bannerUrl")}
          className="hidden"
        />

        <p data-gc="configuracoes.perfil.identidade-aba.p--3" className="mt-1.5 text-xs text-ink-faint">
          PNG, JPG ou GIF até {Math.round(LIMITS.bannerBytes / 1024 / 1024)} MB. Sem imagem, vale a
          cor abaixo.
        </p>
      </div>

      <ImagePicker data-gc="configuracoes.perfil.identidade-aba.image-picker"
        open={pickingTrack}
        onClose={() => setPickingTrack(false)}
        onFile={() => {
          setPickingTrack(false);
          pickBanner.current?.click();
        }}
        onGif={(gif) => void useGif(gif.url)}
        title="Faixa do perfil"
        footer={`PNG, JPG ou GIF até ${Math.round(LIMITS.bannerBytes / 1024 / 1024)} MB. O GIF continua animado — ele não passa pelo redimensionador.`}
      />

      <ColorField data-gc="configuracoes.perfil.identidade-aba.color-field"
        label="Cor da faixa"
        value={draft.bannerColor}
        onChange={(color) => set("bannerColor", color)}
        hint="Usada quando não há imagem. Sem escolha, fica a cor gerada do seu id."
      />

      <div data-gc="configuracoes.perfil.identidade-aba.div--10" className="grid grid-cols-2 gap-4">
        <ColorField data-gc="configuracoes.perfil.identidade-aba.color-field--2"
          label="Tema — cor 1"
          value={draft.themePrimary}
          onChange={(color) => set("themePrimary", color)}
        />
        <ColorField data-gc="configuracoes.perfil.identidade-aba.color-field--3"
          label="Tema — cor 2"
          value={draft.secondaryTheme}
          onChange={(color) => set("secondaryTheme", color)}
          hint="Com as duas, o corpo do cartão vira um degradê."
        />
      </div>
    </div>
  );
};
