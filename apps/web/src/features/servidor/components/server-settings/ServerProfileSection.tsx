import React, { useRef, useState } from "react";
import { ImageUp, Upload, X } from "lucide-react";
import { LIMITS } from "@gravae/shared";

import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { Button } from "~/components/ui/button";
import { Input, Label, Textarea } from "~/components/ui/input";
import { avatarColor, initials } from "~/lib/format";
import { formatBytes } from "~/lib/image";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

const ICONE_MAX_PX = 256;

export const ServerProfileSection: React.FC<{ guild: GuildModel }> = ({
  guild,
}) => {
  const { t } = useTranslation();
  const updateGuild = useUpdateGuild();
  const uploadImage = useUploadImage();
  const inputArquivo = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(guild.name);
  const [description, setDescription] = useState(guild.description ?? "");
  const [iconUrl, setIconUrl] = useState(guild.iconUrl);
  const [bannerUrl, setBannerUrl] = useState(guild.bannerUrl ?? null);
  const [economia, setEconomia] = useState<string | null>(null);
  const inputDaFaixa = useRef<HTMLInputElement>(null);

  const escolherIcone = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const enviado = await uploadImage
      .mutateAsync({ file, maxSize: ICONE_MAX_PX })
      .catch(() => null);
    if (!enviado) return;

    setIconUrl(enviado.attachment.url);
    setEconomia(
      enviado.uploadedSize < enviado.originalSize
        ? `${formatBytes(enviado.originalSize)} → ${formatBytes(enviado.uploadedSize)}`
        : null,
    );
  };

  const enviarFaixa = async (file: File) => {
    const enviado = await uploadImage
      .mutateAsync({ file, maxSize: 960 })
      .catch(() => null);
    if (enviado) setBannerUrl(enviado.attachment.url);
  };

  const escolherFaixa = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await enviarFaixa(file);
  };

  const [arrastando, setArrastando] = useState(false);

  const mudou =
    name.trim() !== guild.name ||
    (description.trim() || null) !== (guild.description ?? null) ||
    iconUrl !== guild.iconUrl ||
    bannerUrl !== (guild.bannerUrl ?? null);

  const salvar = () =>
    updateGuild.mutate({
      guildId: guild.id,
      name: name.trim(),
      description: description.trim() || null,
      iconUrl,
      bannerUrl,
    });

  return (
    <div data-gc="servidor.server-settings.server-profile-section.div" className="max-w-2xl">
      <h2 data-gc="servidor.server-settings.server-profile-section.h2" className="text-xl font-semibold">{t("servidor.perfil.titulo")}</h2>
      <p data-gc="servidor.server-settings.server-profile-section.p" className="mt-1 text-sm text-ink-muted">
        {t("servidor.perfil.descricao")}
      </p>

      <div data-gc="servidor.server-settings.server-profile-section.div--2" className="my-6 h-px bg-line" />

      <Label data-gc="servidor.server-settings.server-profile-section.label">{t("servidor.perfil.icone")}</Label>
      <div data-gc="servidor.server-settings.server-profile-section.div--3" className="flex items-center gap-4">
        {iconUrl ? (
          <img data-gc="servidor.server-settings.server-profile-section.img"
            src={iconUrl}
            alt=""
            className="size-20 rounded-3xl object-cover"
          />
        ) : (
          <div data-gc="servidor.server-settings.server-profile-section.div--4"
            className="flex size-20 items-center justify-center rounded-3xl text-2xl font-bold text-white"
            style={{ backgroundColor: avatarColor(guild.id) }}
          >
            {initials(name || guild.name)}
          </div>
        )}

        <div data-gc="servidor.server-settings.server-profile-section.div--5">
          <div data-gc="servidor.server-settings.server-profile-section.div--6" className="flex gap-2">
            <Button data-gc="servidor.server-settings.server-profile-section.button"
              variant="surface"
              size="sm"
              onClick={() => inputArquivo.current?.click()}
              disabled={uploadImage.isPending}
            >
              <Upload data-gc="servidor.server-settings.server-profile-section.upload" size={14} />
              {uploadImage.isPending ? "Enviando…" : "Alterar ícone"}
            </Button>

            {iconUrl && (
              <Button data-gc="servidor.server-settings.server-profile-section.button--2"
                variant="ghost"
                size="sm"
                onClick={() => setIconUrl(null)}
                className="text-danger"
              >
                {t("comum.remover")}
              </Button>
            )}
          </div>

          <p data-gc="servidor.server-settings.server-profile-section.p--2" className="mt-1.5 text-xs text-ink-faint">
            {economia
              ? t("servidor.perfil.comprimido", { economia })
              : "A imagem é reduzida no navegador."}
          </p>

          <input data-gc="servidor.server-settings.server-profile-section.input"
            ref={inputArquivo}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => void escolherIcone(e)}
            className="hidden"
          />
        </div>
      </div>

      <div data-gc="servidor.server-settings.server-profile-section.div--7" className="my-6 h-px bg-line" />

      <Label data-gc="servidor.server-settings.server-profile-section.label--2">{t("servidor.perfil.faixa")}</Label>

      <div data-gc="servidor.server-settings.server-profile-section.div--8" className="space-y-2">
        <div data-gc="servidor.server-settings.server-profile-section.div--9" className="relative">
          <button data-gc="servidor.server-settings.server-profile-section.button--3"
            type="button"
            onClick={() => inputDaFaixa.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastando(false);
              const arquivo = e.dataTransfer.files?.[0];
              if (arquivo?.type.startsWith("image/")) void enviarFaixa(arquivo);
            }}
            disabled={uploadImage.isPending}
            aria-label={
              bannerUrl ? "Alterar a faixa do servidor" : "Enviar a faixa do servidor"
            }
            className={cn(
              "group/faixa relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border-2 bg-cover bg-center outline-none transition",
              "focus-visible:border-brand",
              arrastando
                ? "border-solid border-brand"
                : bannerUrl
                  ? "border-solid border-transparent hover:border-line"
                  : "border-dashed border-line hover:border-ink-faint",
              uploadImage.isPending && "cursor-wait opacity-70",
            )}
            style={{
              backgroundColor: avatarColor(guild.id),
              ...(bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : null),
            }}
          >
            <span data-gc="servidor.server-settings.server-profile-section.span"
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg px-4 py-3 text-xs transition",
                bannerUrl
                  ? "bg-black/60 text-white opacity-0 group-hover/faixa:opacity-100"
                  : "text-white/80",
              )}
            >
              <ImageUp data-gc="servidor.server-settings.server-profile-section.image-up" size={20} />
              {uploadImage.isPending
                ? "Enviando…"
                : arrastando
                  ? "Solte a imagem aqui"
                  : bannerUrl
                    ? "Alterar faixa"
                    : "Clique ou arraste uma imagem"}
            </span>
          </button>

          {bannerUrl && !uploadImage.isPending && (
            <button data-gc="servidor.server-settings.server-profile-section.button--4"
              type="button"
              onClick={() => setBannerUrl(null)}
              aria-label={t("comum.remover")}
              title={t("comum.remover")}
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur transition hover:bg-danger hover:text-white"
            >
              <X data-gc="servidor.server-settings.server-profile-section.x" size={14} />
            </button>
          )}
        </div>

        <p data-gc="servidor.server-settings.server-profile-section.p--3" className="text-xs text-ink-faint">
          Aparece no alto da lista de canais. PNG, JPG, WEBP ou GIF — a imagem é
          reduzida no navegador.
        </p>

        <input data-gc="servidor.server-settings.server-profile-section.input--2"
          ref={inputDaFaixa}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => void escolherFaixa(e)}
          className="hidden"
        />
      </div>

      <div data-gc="servidor.server-settings.server-profile-section.div--10" className="my-6 h-px bg-line" />

      <Label data-gc="servidor.server-settings.server-profile-section.label--3" htmlFor="guild-name">{t("servidor.perfil.nomeDoServidor")}</Label>
      <Input data-gc="servidor.server-settings.server-profile-section.input--3"
        id="guild-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={LIMITS.guildName}
      />

      <div data-gc="servidor.server-settings.server-profile-section.div--11" className="mt-5">
        <Label data-gc="servidor.server-settings.server-profile-section.label--4" htmlFor="guild-description">{t("servidor.perfil.campoDescricao")}</Label>
        <Textarea data-gc="servidor.server-settings.server-profile-section.textarea"
          id="guild-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={512}
          rows={3}
          placeholder={t("servidor.perfil.doQueE")}
        />
      </div>

      {mudou && (
        <div data-gc="servidor.server-settings.server-profile-section.div--12" className="mt-6 flex items-center justify-between rounded-lg bg-surface-0 px-4 py-3">
          <p data-gc="servidor.server-settings.server-profile-section.p--4" className="text-sm text-ink-muted">
            {t("comum.naoSalvo")}
          </p>
          <div data-gc="servidor.server-settings.server-profile-section.div--13" className="flex gap-2">
            <Button data-gc="servidor.server-settings.server-profile-section.button--5"
              variant="ghost"
              size="sm"
              onClick={() => {
                setName(guild.name);
                setDescription(guild.description ?? "");
                setIconUrl(guild.iconUrl);
                setBannerUrl(guild.bannerUrl ?? null);
              }}
            >
              {t("comum.descartar")}
            </Button>
            <Button data-gc="servidor.server-settings.server-profile-section.button.salvar"
              size="sm"
              onClick={salvar}
              disabled={updateGuild.isPending || !name.trim()}
            >
              {updateGuild.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
