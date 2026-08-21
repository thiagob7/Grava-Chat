import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { LIMITS } from "@gravae/shared";

import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { formatBytes } from "~/lib/image";

/** O avatar aparece no máximo a 72px; 256 cobre tela retina com folga. */
const AVATAR_MAX_PX = 256;

export const ProfileSection: React.FC<{ user: SelfUserModel }> = ({ user }) => {
  const updateProfile = useUpdateProfile();
  const uploadImage = useUploadImage();
  const inputArquivo = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [economia, setEconomia] = useState<string | null>(null);

  const escolherArquivo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!file) return;

    const resultado = await uploadImage.mutateAsync({ file, maxSize: AVATAR_MAX_PX }).catch(() => null);
    if (!resultado) return;

    setAvatarUrl(resultado.attachment.url);
    setEconomia(
      resultado.uploadedSize < resultado.originalSize
        ? `${formatBytes(resultado.originalSize)} → ${formatBytes(resultado.uploadedSize)}`
        : null,
    );
  };

  const mudou =
    displayName.trim() !== user.displayName ||
    (bio.trim() || null) !== (user.bio ?? null) ||
    avatarUrl !== user.avatarUrl;

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold">Perfil</h2>
      <p className="mt-1 text-sm text-ink-muted">É assim que você aparece para os outros.</p>

      <div className="mt-6 flex items-center gap-4">
        <Avatar id={user.id} name={displayName || user.displayName} url={avatarUrl} size={72} />

        <div>
          <Button
            variant="surface"
            size="sm"
            onClick={() => inputArquivo.current?.click()}
            disabled={uploadImage.isPending}
          >
            <Upload size={14} />
            {uploadImage.isPending ? "Enviando…" : "Trocar foto"}
          </Button>

          <p className="mt-1.5 text-xs text-ink-faint">
            {economia
              ? `Comprimida antes de subir: ${economia}`
              : "A imagem é reduzida no navegador antes de subir."}
          </p>

          <input
            ref={inputArquivo}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => void escolherArquivo(e)}
            className="hidden"
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="display-name">Nome de exibição</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={LIMITS.displayName}
          />
        </div>

        <div>
          <Label htmlFor="username">Nome de usuário</Label>
          <Input id="username" value={`@${user.username}`} readOnly className="text-ink-faint" />
          <p className="mt-1 text-xs text-ink-faint">
            É por aqui que seus amigos te encontram. Ainda não dá pra trocar.
          </p>
        </div>

        <div>
          <Label htmlFor="bio">Sobre mim</Label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={512}
            rows={3}
            placeholder="Conte algo sobre você"
            className="w-full resize-none rounded bg-surface-0 px-3 py-2.5 text-sm outline-none ring-brand/60 transition placeholder:text-ink-faint focus:ring-2"
          />
        </div>
      </div>

      {mudou && (
        <footer className="sticky bottom-0 mt-6 flex items-center gap-3 rounded bg-surface-0 px-4 py-3">
          <p className="flex-1 text-sm">Você tem alterações não salvas.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDisplayName(user.displayName);
              setBio(user.bio ?? "");
              setAvatarUrl(user.avatarUrl);
            }}
          >
            Descartar
          </Button>
          <Button
            variant="success"
            size="sm"
            disabled={updateProfile.isPending}
            onClick={() =>
              void updateProfile
                .mutateAsync({ displayName: displayName.trim(), bio: bio.trim() || null, avatarUrl })
                .catch(() => null)
            }
          >
            {updateProfile.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </footer>
      )}
    </div>
  );
};
