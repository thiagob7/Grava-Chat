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

  /*
    A faixa é larga e vive no alto da lista de canais — por isso sobe com um
    teto de largura bem maior que o do ícone, que é um quadradinho.
  */
  /// Recebe o arquivo, e não o evento: o mesmo envio serve ao clique no seletor
  /// e ao arquivo largado em cima da faixa.
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
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold">{t("servidor.perfil.titulo")}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {t("servidor.perfil.descricao")}
      </p>

      <div className="my-6 h-px bg-line" />

      <Label>{t("servidor.perfil.icone")}</Label>
      <div className="flex items-center gap-4">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt=""
            className="size-20 rounded-3xl object-cover"
          />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIconUrl(null)}
                className="text-danger"
              >
                {t("comum.remover")}
              </Button>
            )}
          </div>

          <p className="mt-1.5 text-xs text-ink-faint">
            {economia
              ? t("servidor.perfil.comprimido", { economia })
              : "A imagem é reduzida no navegador."}
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

      <Label>{t("servidor.perfil.faixa")}</Label>

      {/*
        A área da imagem É o campo.

        Antes ela era um retângulo decorativo com o botão embaixo: a coisa que
        parecia clicável não era, e a que era ficava fora dela. Agora clicar na
        faixa abre o seletor, arrastar um arquivo em cima envia, e o "remover"
        mora no canto da própria imagem — que é onde se procura por ele.
      */}
      <div className="space-y-2">
        <div className="relative">
          <button
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
              /// Largar uma pasta, um .zip ou um texto aqui não é erro de quem
              /// larga — mas mandar isso pro upload é erro nosso.
              if (arquivo?.type.startsWith("image/")) void enviarFaixa(arquivo);
            }}
            disabled={uploadImage.isPending}
            aria-label={
              bannerUrl ? "Alterar a faixa do servidor" : "Enviar a faixa do servidor"
            }
            className={cn(
              "group/faixa relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border-2 bg-cover bg-center outline-none transition",
              "focus-visible:border-brand",
              /// Tracejado só enquanto está vazia: é o desenho universal de
              /// "solte algo aqui". Com imagem dentro, tracejado vira sujeira
              /// por cima da foto de quem manda no servidor.
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
            {/*
              O véu só aparece com o mouse em cima, e só quando JÁ existe faixa:
              escurecer uma imagem que a pessoa acabou de escolher, o tempo todo,
              é mentir sobre como ela vai aparecer no alto da lista de canais.
            */}
            <span
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg px-4 py-3 text-xs transition",
                bannerUrl
                  ? "bg-black/60 text-white opacity-0 group-hover/faixa:opacity-100"
                  : "text-white/80",
              )}
            >
              <ImageUp size={20} />
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
            <button
              type="button"
              onClick={() => setBannerUrl(null)}
              aria-label={t("comum.remover")}
              title={t("comum.remover")}
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur transition hover:bg-danger hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <p className="text-xs text-ink-faint">
          Aparece no alto da lista de canais. PNG, JPG, WEBP ou GIF — a imagem é
          reduzida no navegador.
        </p>

        <input
          ref={inputDaFaixa}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => void escolherFaixa(e)}
          className="hidden"
        />
      </div>

      <div className="my-6 h-px bg-line" />

      <Label htmlFor="guild-name">{t("servidor.perfil.nomeDoServidor")}</Label>
      <Input
        id="guild-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={LIMITS.guildName}
      />

      <div className="mt-5">
        <Label htmlFor="guild-description">{t("servidor.perfil.campoDescricao")}</Label>
        <Textarea
          id="guild-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={512}
          rows={3}
          placeholder={t("servidor.perfil.doQueE")}
        />
      </div>

      {mudou && (
        <div className="mt-6 flex items-center justify-between rounded-lg bg-surface-0 px-4 py-3">
          <p className="text-sm text-ink-muted">
            {t("comum.naoSalvo")}
          </p>
          <div className="flex gap-2">
            <Button
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
            <Button
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
