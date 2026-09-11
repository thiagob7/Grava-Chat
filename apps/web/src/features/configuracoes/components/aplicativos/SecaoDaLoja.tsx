import React, { useRef } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import {
  APP_CATEGORIES,
  CATEGORIES_LIMIT,
  LANGUAGES_LIMIT,
  type AppCategory,
} from "@gravae/shared";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import { coverGenerated } from "~/lib/capa-gerada";
import { cn } from "~/lib/utils";
import { LANGUAGES, useTranslation } from "~/traducao";

const COVER_MAX_PX = 1280;
const ICON_MAX_PX = 256;

interface StorePropsSection {
  botId: string;
  name: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  categories: string[];
  languages: string[];
  termsUrl: string;
  policyUrl: string;
  supportServerId: string | null;
  onCover: (url: string | null) => void;
  onIcon: (url: string) => void;
  onCategories: (values: string[]) => void;
  onLanguages: (values: string[]) => void;
  onTerms: (value: string) => void;
  onPolicy: (value: string) => void;
  onSupportServer: (id: string | null) => void;
}

const toggle = (list: string[], value: string, ceiling: number) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : list.length >= ceiling
      ? list
      : [...list, value];

const Chip: React.FC<{ marked: boolean; onClick: () => void; children: React.ReactNode }> = ({
  marked,
  onClick,
  children,
}) => (
  <button data-gc="configuracoes.aplicativos.secao-da-loja.button.on-click"
    type="button"
    onClick={onClick}
    aria-pressed={marked}
    className={cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition",
      marked
        ? "border-brand bg-brand text-sobre-marca"
        : "border-line text-ink-faint hover:border-ink-faint/40 hover:text-ink",
    )}
  >
    {children}
  </button>
);

export const StoreSection: React.FC<StorePropsSection> = ({
  botId,
  name,
  avatarUrl,
  coverUrl,
  categories,
  languages,
  termsUrl,
  policyUrl,
  supportServerId,
  onCover,
  onIcon,
  onCategories,
  onLanguages,
  onTerms,
  onPolicy,
  onSupportServer,
}) => {
  const { t } = useTranslation();
  const sendImage = useUploadImage();
  const pickCover = useRef<HTMLInputElement>(null);
  const pickIcon = useRef<HTMLInputElement>(null);
  const servers = useFindManyGuilds(true);

  const send = async (
    event: React.ChangeEvent<HTMLInputElement>,
    maxSize: number,
    onFinish: (url: string) => void,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const sent = await sendImage
      .mutateAsync({ file, maxSize, purpose: "banner" })
      .catch(() => null);

    if (sent) onFinish(sent.attachment.url);
  };

  return (
    <>
      <input data-gc="configuracoes.aplicativos.secao-da-loja.input"
        ref={pickCover}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => void send(event, COVER_MAX_PX, onCover)}
      />
      <input data-gc="configuracoes.aplicativos.secao-da-loja.input--2"
        ref={pickIcon}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(event) => void send(event, ICON_MAX_PX, onIcon)}
      />

      <div data-gc="configuracoes.aplicativos.secao-da-loja.div">
        <Label data-gc="configuracoes.aplicativos.secao-da-loja.label">{t("servidor.descoberta.previa")}</Label>

        <div data-gc="configuracoes.aplicativos.secao-da-loja.div--2" className="overflow-hidden rounded-xl border border-line bg-surface-1">
          <div data-gc="configuracoes.aplicativos.secao-da-loja.div--3" className="relative">
            <div data-gc="configuracoes.aplicativos.secao-da-loja.div--4" className="aspect-[16/9] w-full overflow-hidden bg-surface-3">
              {coverUrl ? (
                <img data-gc="configuracoes.aplicativos.secao-da-loja.img" src={coverUrl} alt="" className="size-full object-cover" />
              ) : (
                <span data-gc="configuracoes.aplicativos.secao-da-loja.span" aria-hidden className="block size-full" style={coverGenerated(botId)} />
              )}
            </div>

            <button data-gc="configuracoes.aplicativos.secao-da-loja.button"
              type="button"
              disabled={sendImage.isPending}
              onClick={() => pickCover.current?.click()}
              className="absolute inset-0 flex items-center justify-center gap-2 bg-sobre-midia text-sm font-medium text-sobre-marca opacity-0 transition hover:opacity-100 focus-visible:opacity-100"
            >
              <ImagePlus data-gc="configuracoes.aplicativos.secao-da-loja.image-plus" size={18} /> {t("servidor.descoberta.trocarCapa")}
            </button>

            <button data-gc="configuracoes.aplicativos.secao-da-loja.button--2"
              type="button"
              disabled={sendImage.isPending}
              onClick={() => pickIcon.current?.click()}
              title={t("servidor.descoberta.trocarIcone")}
              className="group absolute -bottom-3 left-3 rounded-xl border-4 border-surface-1 bg-surface-1"
            >
              <Avatar data-gc="configuracoes.aplicativos.secao-da-loja.avatar" id={botId} name={name} url={avatarUrl} size={44} />

              <span data-gc="configuracoes.aplicativos.secao-da-loja.span--2" className="absolute inset-0 flex items-center justify-center rounded-lg bg-sobre-midia opacity-0 transition group-hover:opacity-100">
                <Upload data-gc="configuracoes.aplicativos.secao-da-loja.upload" size={14} className="text-sobre-marca" />
              </span>
            </button>
          </div>

          <div data-gc="configuracoes.aplicativos.secao-da-loja.div--5" className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3 pt-6">
            <p data-gc="configuracoes.aplicativos.secao-da-loja.p" className="min-w-0 truncate text-sm font-semibold">{name}</p>

            {coverUrl && (
              <Button data-gc="configuracoes.aplicativos.secao-da-loja.button--3"
                variant="ghost"
                size="sm"
                onClick={() => onCover(null)}
              >
                <Trash2 data-gc="configuracoes.aplicativos.secao-da-loja.trash2" size={14} /> {t("servidor.descoberta.tirarCapa")}
              </Button>
            )}
          </div>
        </div>

        <p data-gc="configuracoes.aplicativos.secao-da-loja.p--2" className="mt-1.5 text-xs text-ink-faint">
          {t("servidor.descoberta.capaDetalhe")}
        </p>
      </div>

      <div data-gc="configuracoes.aplicativos.secao-da-loja.div--6" className="mt-6">
        <Label data-gc="configuracoes.aplicativos.secao-da-loja.label--2">
          {t("servidor.descoberta.categorias")}{" "}
          <span data-gc="configuracoes.aplicativos.secao-da-loja.span--3" className="font-normal text-ink-faint">
            {categories.length}/{CATEGORIES_LIMIT}
          </span>
        </Label>

        <div data-gc="configuracoes.aplicativos.secao-da-loja.div--7" className="flex flex-wrap gap-2 rounded-lg border border-line bg-surface-1 p-3">
          {APP_CATEGORIES.map((category: AppCategory) => (
            <Chip data-gc="configuracoes.aplicativos.secao-da-loja.chip"
              key={category}
              marked={categories.includes(category)}
              onClick={() => onCategories(toggle(categories, category, CATEGORIES_LIMIT))}
            >
              {t(`servidor.descoberta.categoria.${category}`)}
            </Chip>
          ))}
        </div>

        <p data-gc="configuracoes.aplicativos.secao-da-loja.p--3" className="mt-1.5 text-xs text-ink-faint">
          {t("servidor.descoberta.categoriasDetalhe", { quantas: CATEGORIES_LIMIT })}
        </p>
      </div>

      <div data-gc="configuracoes.aplicativos.secao-da-loja.div--8" className="mt-6">
        <Label data-gc="configuracoes.aplicativos.secao-da-loja.label--3">
          {t("servidor.descoberta.idiomas")}{" "}
          <span data-gc="configuracoes.aplicativos.secao-da-loja.span--4" className="font-normal text-ink-faint">
            {languages.length}/{LANGUAGES_LIMIT}
          </span>
        </Label>

        <div data-gc="configuracoes.aplicativos.secao-da-loja.div--9" className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-lg border border-line bg-surface-1 p-3">
          {LANGUAGES.map((language) => (
            <Chip data-gc="configuracoes.aplicativos.secao-da-loja.chip--2"
              key={language.lng}
              marked={languages.includes(language.lng)}
              onClick={() => onLanguages(toggle(languages, language.lng, LANGUAGES_LIMIT))}
            >
              {language.flag} {language.native}
            </Chip>
          ))}
        </div>

        <p data-gc="configuracoes.aplicativos.secao-da-loja.p--4" className="mt-1.5 text-xs text-ink-faint">
          {t("servidor.descoberta.idiomasDetalhe", { quantos: LANGUAGES_LIMIT })}
        </p>
      </div>

      <div data-gc="configuracoes.aplicativos.secao-da-loja.div--10" className="mt-6 grid gap-4 sm:grid-cols-2">
        <div data-gc="configuracoes.aplicativos.secao-da-loja.div--11">
          <Label data-gc="configuracoes.aplicativos.secao-da-loja.label--4" htmlFor="app-termos">
            {t("servidor.descoberta.termos")}
          </Label>
          <Input data-gc="configuracoes.aplicativos.secao-da-loja.input--3"
            id="app-termos"
            value={termsUrl}
            placeholder="https://"
            onChange={(event) => onTerms(event.target.value)}
          />
        </div>

        <div data-gc="configuracoes.aplicativos.secao-da-loja.div--12">
          <Label data-gc="configuracoes.aplicativos.secao-da-loja.label--5" htmlFor="app-politica">
            {t("servidor.descoberta.politica")}
          </Label>
          <Input data-gc="configuracoes.aplicativos.secao-da-loja.input--4"
            id="app-politica"
            value={policyUrl}
            placeholder="https://"
            onChange={(event) => onPolicy(event.target.value)}
          />
        </div>
      </div>

      <div data-gc="configuracoes.aplicativos.secao-da-loja.div--13" className="mt-6">
        <Label data-gc="configuracoes.aplicativos.secao-da-loja.label--6" htmlFor="app-suporte">
          {t("servidor.descoberta.servidorDeSuporte")}
        </Label>
        <SelectField data-gc="configuracoes.aplicativos.secao-da-loja.select-field"
          id="app-suporte"
          value={supportServerId ?? ""}
          onSelect={(id) => onSupportServer(id || null)}
          options={[
            { value: "", label: t("servidor.descoberta.semServidor") },
            ...(servers.data ?? []).map((server) => ({
              value: server.id,
              label: server.name,
            })),
          ]}
        />
        <p data-gc="configuracoes.aplicativos.secao-da-loja.p--5" className="mt-1.5 text-xs text-ink-faint">
          {t("servidor.descoberta.servidorDeSuporteDetalhe")}
        </p>
      </div>
    </>
  );
};
