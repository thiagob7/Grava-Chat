import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { LIMITS } from "@gravae/shared";

import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { Button } from "~/components/ui/button";
import { Input, Label, Textarea } from "~/components/ui/input";
import { avatarColor, initials } from "~/lib/format";
import { formatBytes } from "~/lib/image";

const ICONE_MAX_PX = 256;

export const ServerProfileSection: React.FC<{ guild: GuildModel }> = ({ guild }) => {
  const updateGuild = useUpdateGuild();
  const uploadImage = useUploadImage();
  const inputArquivo = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(guild.name);
  const [description, setDescription] = useState(guild.description ?? "");
  const [iconUrl, setIconUrl] = useState(guild.iconUrl);
  const [economia, setEconomia] = useState<string | null>(null);

  const escolherIcone = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const enviado = await uploadImage.mutateAsync({ file, maxSize: ICONE_MAX_PX }).catch(() => null);
    if (!enviado) return;

    setIconUrl(enviado.attachment.url);
    setEconomia(
      enviado.uploadedSize < enviado.originalSize
        ? `${formatBytes(enviado.originalSize)} → ${formatBytes(enviado.uploadedSize)}`
        : null,
    );
  };

  const mudou =
    name.trim() !== guild.name ||
    (description.trim() || null) !== (guild.description ?? null) ||
    iconUrl !== guild.iconUrl;

  const salvar = () =>
    updateGuild.mutate({
      guildId: guild.id,
      name: name.trim(),
      description: description.trim() || null,
      iconUrl,
    });

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold">Perfil do servidor</h2>
      <p className="mt-1 text-sm text-ink-muted">
        É assim que seu servidor aparece na lista e nos links de convite.
      </p>

      <div className="my-6 h-px bg-line" />

      <Label>Ícone</Label>
      <div className="flex items-center gap-4">
        {iconUrl ? (
          <img src={iconUrl} alt="" className="size-20 rounded-3xl object-cover" />
        ) : (
          <div
            className="flex size-20 items-center justify-center rounded-3xl text-2xl font-bold text-white"
            style={{ backgroundColor: avatarColor(guild.id) }}
          >
            {initials(name || guild.name)}
          </div>
        )}

        <div>
          <div className="flex gap-2">
            <Button
              variant="surface"
              size="sm"
              onClick={() => inputArquivo.current?.click()}
              disabled={uploadImage.isPending}
            >
              <Upload size={14} />
              {uploadImage.isPending ? "Enviando…" : "Alterar ícone"}
            </Button>

            {iconUrl && (
              <Button variant="ghost" size="sm" onClick={() => setIconUrl(null)} className="text-danger">
                Remover
              </Button>
            )}
          </div>

          <p className="mt-1.5 text-xs text-ink-faint">
            {economia ? `Comprimido antes de subir: ${economia}` : "A imagem é reduzida no navegador."}
          </p>

          <input
            ref={inputArquivo}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => void escolherIcone(e)}
            className="hidden"
          />
        </div>
      </div>

      <div className="my-6 h-px bg-line" />

      <Label htmlFor="guild-name">Nome do servidor</Label>
      <Input
        id="guild-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={LIMITS.guildName}
      />

      <div className="mt-5">
        <Label htmlFor="guild-description">Descrição</Label>
        <Textarea
          id="guild-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={512}
          rows={3}
          placeholder="Do que é esse servidor?"
        />
      </div>

      {mudou && (
        <div className="mt-6 flex items-center justify-between rounded-lg bg-surface-0 px-4 py-3">
          <p className="text-sm text-ink-muted">Você tem alterações não salvas.</p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setName(guild.name);
                setDescription(guild.description ?? "");
                setIconUrl(guild.iconUrl);
              }}
            >
              Descartar
            </Button>
            <Button size="sm" onClick={salvar} disabled={updateGuild.isPending || !name.trim()}>
              {updateGuild.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
