import React, { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { LIMITS } from "@gravae/shared";

import { useUpdateGuild } from "~/@core/application/queries/guild/use-update-guild";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { importImage } from "~/@core/application/requests/upload/importar-imagem";
import type { GuildModel } from "~/@core/domain/models/guild-model";
import { ImageEditor } from "~/components/EditorDeImagem";
import { ImagePicker } from "~/components/SeletorDeImagem";
import { Button } from "~/components/ui/button";
import { Input, Label, Textarea } from "~/components/ui/input";
import { avatarColor, initials } from "~/lib/format";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

const ICON_PX = 512;
const BANNER_PX = 960;
const BANNER_ASPECT = 16 / 9;
const BANNER_TALLEST = 1;

type Target = "icon" | "banner";

const FORMATS = "PNG, JPEG, WebP ou GIF";

/*
  Ícone e banner passam pelo mesmo caminho: escolher (arquivo ou GIF do Klipy),
  enquadrar e subir. O GIF é recortado quadro a quadro e continua animado.
*/
export const ServerProfileSection: React.FC<{ guild: GuildModel }> = ({ guild }) => {
  const { t } = useTranslation();
  const updateGuild = useUpdateGuild();
  const uploadImage = useUploadImage();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(guild.name);
  const [description, setDescription] = useState(guild.description ?? "");
  const [iconUrl, setIconUrl] = useState(guild.iconUrl);
  const [bannerUrl, setBannerUrl] = useState(guild.bannerUrl ?? null);

  const [picking, setPicking] = useState<Target | null>(null);
  const [fileFor, setFileFor] = useState<Target>("icon");
  const [framing, setFraming] = useState<{ file: File; target: Target } | null>(null);
  const [busy, setBusy] = useState<Target | null>(null);
  const [dropping, setDropping] = useState<Target | null>(null);

  const setUrl = (target: Target, url: string) => (target === "icon" ? setIconUrl(url) : setBannerUrl(url));

  const upload = async (file: File, target: Target) => {
    setBusy(target);
    const sent = await uploadImage
      .mutateAsync({
        file,
        maxSize: target === "icon" ? ICON_PX : BANNER_PX,
        purpose: target === "icon" ? "avatar" : "banner",
      })
      .catch(() => null)
      .finally(() => setBusy(null));

    if (sent) setUrl(target, sent.attachment.url);
  };

  const receive = (file: File, target: Target) => {
    if (!file.type.startsWith("image/")) return;
    setFraming({ file, target });
  };

  const pickGif = async (url: string, target: Target) => {
    setBusy(target);
    const file = await fetch(url)
      .then((reply) => (reply.ok ? reply.blob() : Promise.reject()))
      .then((blob) => new File([blob], "klipy.gif", { type: blob.type || "image/gif" }))
      .catch(() => null)
      .finally(() => setBusy(null));

    if (file) return setFraming({ file, target });

    setBusy(target);
    const attachment = await importImage(url, target === "icon" ? "avatar" : "banner")
      .catch(() => {
        toast.error("Não consegui trazer esse GIF.");
        return null;
      })
      .finally(() => setBusy(null));

    if (attachment) setUrl(target, attachment.url);
  };

  const openFile = (target: Target) => {
    setFileFor(target);
    setPicking(null);
    fileInput.current?.click();
  };

  const dropProps = (target: Target) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDropping(target);
    },
    onDragLeave: () => setDropping(null),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDropping(null);
      const file = e.dataTransfer.files?.[0];
      if (file) receive(file, target);
    },
  });

  const changed =
    name.trim() !== guild.name ||
    (description.trim() || null) !== (guild.description ?? null) ||
    iconUrl !== guild.iconUrl ||
    bannerUrl !== (guild.bannerUrl ?? null);

  const reset = () => {
    setName(guild.name);
    setDescription(guild.description ?? "");
    setIconUrl(guild.iconUrl);
    setBannerUrl(guild.bannerUrl ?? null);
  };

  const save = () =>
    updateGuild.mutate({
      guildId: guild.id,
      name: name.trim(),
      description: description.trim() || null,
      iconUrl,
      bannerUrl,
    });

  return (
    <div data-gc="servidor.server-settings.server-profile-section.div" className="max-w-3xl pb-24">
      <h2 data-gc="servidor.server-settings.server-profile-section.h2" className="text-xl font-semibold">{t("servidor.perfil.titulo")}</h2>
      <p data-gc="servidor.server-settings.server-profile-section.p" className="mt-1 text-sm text-ink-muted">{t("servidor.perfil.descricao")}</p>

      <input data-gc="servidor.server-settings.server-profile-section.input"
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) receive(file, fileFor);
        }}
      />

      <Block data-gc="servidor.server-settings.server-profile-section.block" title="Marca">
        <Field data-gc="servidor.server-settings.server-profile-section.field" label={t("servidor.perfil.icone")} hint={`${FORMATS}. Recomendado: 512×512.`}>
          <div data-gc="servidor.server-settings.server-profile-section.div--2" className="flex flex-wrap items-center gap-5">
            <button data-gc="servidor.server-settings.server-profile-section.button"
              type="button"
              onClick={() => setPicking("icon")}
              disabled={busy === "icon"}
              aria-label="Mudar o ícone do servidor"
              {...dropProps("icon")}
              className={cn(
                "group/icone relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 transition",
                dropping === "icon" ? "ring-brand" : "ring-line-sutil hover:ring-line",
                busy === "icon" && "cursor-wait opacity-70",
              )}
              style={iconUrl ? undefined : { backgroundColor: avatarColor(guild.id) }}
            >
              {iconUrl ? (
                <img data-gc="servidor.server-settings.server-profile-section.img" src={iconUrl} alt="" className="size-full object-cover" />
              ) : (
                <span data-gc="servidor.server-settings.server-profile-section.span" className="text-2xl font-bold text-sobre-marca">{initials(name || guild.name)}</span>
              )}
              <span data-gc="servidor.server-settings.server-profile-section.span--2" className="absolute inset-0 flex items-center justify-center bg-sobre-midia opacity-0 transition group-hover/icone:opacity-100">
                <Upload data-gc="servidor.server-settings.server-profile-section.upload" size={18} className="text-palco-ink" />
              </span>
            </button>

            <div data-gc="servidor.server-settings.server-profile-section.div--3" className="flex flex-wrap gap-2">
              <Button data-gc="servidor.server-settings.server-profile-section.button--2" onClick={() => setPicking("icon")} disabled={busy === "icon"}>
                <ImagePlus data-gc="servidor.server-settings.server-profile-section.image-plus" size={15} /> {busy === "icon" ? "Enviando…" : "Carregar ícone"}
              </Button>
              {iconUrl && (
                <Button data-gc="servidor.server-settings.server-profile-section.button--3" variant="surface" onClick={() => setIconUrl(null)}>
                  <Trash2 data-gc="servidor.server-settings.server-profile-section.trash2" size={15} /> {t("comum.remover")}
                </Button>
              )}
            </div>
          </div>
        </Field>

        <Field data-gc="servidor.server-settings.server-profile-section.field--2" label={t("servidor.perfil.nomeDoServidor")} htmlFor="guild-name">
          <Input data-gc="servidor.server-settings.server-profile-section.input--2" id="guild-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={LIMITS.guildName} />
        </Field>

        <Field data-gc="servidor.server-settings.server-profile-section.field--3" label={t("servidor.perfil.campoDescricao")} htmlFor="guild-description" hint={`${description.length} / 512`}>
          <Textarea data-gc="servidor.server-settings.server-profile-section.textarea"
            id="guild-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={512}
            rows={3}
            placeholder={t("servidor.perfil.doQueE")}
          />
        </Field>

        <div data-gc="servidor.server-settings.server-profile-section.div--4" className="grid gap-5 md:grid-cols-2">
          <Field data-gc="servidor.server-settings.server-profile-section.field--4" label="Banner" hint={`Aparece no alto da lista de canais e no convite. ${FORMATS}. Recomendado: 960×540 (16:9).`}>
            <div data-gc="servidor.server-settings.server-profile-section.div--5" className="flex flex-wrap gap-2">
              <Button data-gc="servidor.server-settings.server-profile-section.button--4" onClick={() => setPicking("banner")} disabled={busy === "banner"}>
                <ImagePlus data-gc="servidor.server-settings.server-profile-section.image-plus--2" size={15} /> {busy === "banner" ? "Enviando…" : "Carregar banner"}
              </Button>
              {bannerUrl && (
                <Button data-gc="servidor.server-settings.server-profile-section.button--5" variant="surface" onClick={() => setBannerUrl(null)}>
                  <Trash2 data-gc="servidor.server-settings.server-profile-section.trash2--2" size={15} /> {t("comum.remover")}
                </Button>
              )}
            </div>
          </Field>

          <button data-gc="servidor.server-settings.server-profile-section.button--6"
            type="button"
            onClick={() => setPicking("banner")}
            disabled={busy === "banner"}
            aria-label="Mudar o banner do servidor"
            {...dropProps("banner")}
            className={cn(
              "group/banner relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border bg-surface-1 bg-cover bg-center transition",
              dropping === "banner"
                ? "border-solid border-brand"
                : bannerUrl
                  ? "border-line-sutil"
                  : "border-dashed border-line hover:border-ink-faint",
              busy === "banner" && "cursor-wait opacity-70",
            )}
            style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
          >
            <span data-gc="servidor.server-settings.server-profile-section.span--3"
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition",
                bannerUrl
                  ? "bg-sobre-midia text-palco-ink opacity-0 group-hover/banner:opacity-100"
                  : "text-ink-faint group-hover/banner:text-ink-muted",
              )}
            >
              {dropping === "banner" ? "Solte a imagem aqui" : bannerUrl ? "Mudar banner" : "Sem banner da comunidade"}
            </span>
          </button>
        </div>
      </Block>

      <Block data-gc="servidor.server-settings.server-profile-section.block--2" title="Prévia" description="Como o servidor aparece no convite.">
        <article data-gc="servidor.server-settings.server-profile-section.article" className="w-full max-w-[26rem] overflow-hidden rounded-xl border border-line-sutil bg-surface-1 shadow-sm">
          {bannerUrl && <img data-gc="servidor.server-settings.server-profile-section.img--2" src={bannerUrl} alt="" className="block h-28 w-full border-b border-line-sutil object-cover" />}
          <div data-gc="servidor.server-settings.server-profile-section.div--6" className="flex items-center gap-4 px-4 py-4">
            {iconUrl ? (
              <img data-gc="servidor.server-settings.server-profile-section.img--3" src={iconUrl} alt="" className="size-14 shrink-0 rounded-full object-cover ring-1 ring-line-sutil" />
            ) : (
              <span data-gc="servidor.server-settings.server-profile-section.span--4"
                className="flex size-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-sobre-marca"
                style={{ backgroundColor: avatarColor(guild.id) }}
              >
                {initials(name || guild.name)}
              </span>
            )}
            <div data-gc="servidor.server-settings.server-profile-section.div--7" className="min-w-0">
              <p data-gc="servidor.server-settings.server-profile-section.p--2" className="truncate text-base font-semibold">{name.trim() || guild.name}</p>
              {description.trim() && <p data-gc="servidor.server-settings.server-profile-section.p--3" className="line-clamp-2 text-xs text-ink-muted">{description.trim()}</p>}
            </div>
          </div>
        </article>
      </Block>

      <ImagePicker data-gc="servidor.server-settings.server-profile-section.image-picker"
        open={picking !== null}
        onClose={() => setPicking(null)}
        onFile={() => picking && openFile(picking)}
        onGif={(gif) => picking && void pickGif(gif.gif ?? gif.url, picking)}
        title={picking === "banner" ? "Mudar banner" : "Mudar ícone"}
        footer={
          picking === "banner"
            ? `${FORMATS}. Até ${Math.round(LIMITS.bannerBytes / 1024 / 1024)} MB. O GIF continua animado.`
            : `${FORMATS}. Até ${Math.round(LIMITS.avatarBytes / 1024 / 1024)} MB. O GIF continua animado.`
        }
      />

      <ImageEditor data-gc="servidor.server-settings.server-profile-section.image-editor"
        file={framing?.file ?? null}
        aspect={framing?.target === "banner" ? BANNER_ASPECT : 1}
        tallestAspect={framing?.target === "banner" ? BANNER_TALLEST : undefined}
        exportWidth={framing?.target === "banner" ? BANNER_PX : ICON_PX}
        mime="image/webp"
        gifWidth={framing?.target === "banner" ? 480 : 256}
        gifMaxBytes={framing?.target === "banner" ? LIMITS.bannerBytes : LIMITS.avatarBytes}
        round={framing?.target === "icon"}
        title={framing?.target === "banner" ? "Cortar banner" : "Cortar ícone da comunidade"}
        description={
          framing?.target === "banner"
            ? "Arraste para reposicionar e use a roda do mouse ou a pinça para o zoom. O tamanho mínimo recomendado é 960×540 (16:9)."
            : "Arraste para reposicionar e use a roda do mouse ou a pinça para o zoom. O tamanho mínimo recomendado é 256×256."
        }
        applyLabel={framing?.target === "banner" ? "Salvar banner" : "Salvar ícone"}
        onCancel={() => setFraming(null)}
        onSkip={() => {
          const open = framing;
          setFraming(null);
          if (open) void upload(open.file, open.target);
        }}
        onApply={(cut) => {
          const open = framing;
          setFraming(null);
          if (open) void upload(cut, open.target);
        }}
      />

      {changed && (
        <div data-gc="servidor.server-settings.server-profile-section.div--8" className="sticky bottom-4 mt-6 flex items-center justify-between gap-3 rounded-xl border border-line-sutil bg-surface-0/95 px-4 py-3 shadow-2xl backdrop-blur">
          <p data-gc="servidor.server-settings.server-profile-section.p--4" className="text-sm text-ink-muted">{t("comum.naoSalvo")}</p>
          <div data-gc="servidor.server-settings.server-profile-section.div--9" className="flex gap-2">
            <Button data-gc="servidor.server-settings.server-profile-section.button.reset" variant="ghost" size="sm" onClick={reset}>
              {t("comum.descartar")}
            </Button>
            <Button data-gc="servidor.server-settings.server-profile-section.button.save" size="sm" onClick={save} disabled={!name.trim()} loading={updateGuild.isPending}>
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const Block: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <section data-gc="servidor.server-settings.server-profile-section.section" className="mt-8 border-t border-line pt-6">
    <h3 data-gc="servidor.server-settings.server-profile-section.h3" className="text-base font-semibold">{title}</h3>
    {description && <p data-gc="servidor.server-settings.server-profile-section.p--5" className="mt-0.5 text-sm text-ink-muted">{description}</p>}
    <div data-gc="servidor.server-settings.server-profile-section.div--10" className="mt-5 space-y-6">{children}</div>
  </section>
);

const Field: React.FC<{ label: string; hint?: string; htmlFor?: string; children: React.ReactNode }> = ({
  label,
  hint,
  htmlFor,
  children,
}) => (
  <div data-gc="servidor.server-settings.server-profile-section.div--11">
    <Label data-gc="servidor.server-settings.server-profile-section.label" htmlFor={htmlFor} className="mb-2 block text-sm font-semibold normal-case text-ink">
      {label}
    </Label>
    {children}
    {hint && <p data-gc="servidor.server-settings.server-profile-section.p--6" className="mt-2 text-xs text-ink-faint">{hint}</p>}
  </div>
);
