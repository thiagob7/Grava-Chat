import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Play, Trash2, Upload, Volume2 } from "lucide-react";
import { LIMITS, type GuildSound } from "@gravae/shared";

import {
  useCreateEmoji,
  useCreateSound,
  useCreateSticker,
  useDeleteEmoji,
  useDeleteSound,
  useDeleteSticker,
  useFindExpressions,
  useUpdateSound,
} from "~/@core/application/queries/expression/use-expressions";
import { Avatar } from "~/features/perfil/components/Avatar";
import { EmojiPicker } from "~/features/expressao/components/SeletorDeEmoji";
import { Button } from "~/components/ui/button";
import { fieldBase, Input, Label } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import { useConfirm } from "~/components/ui/confirm";
import { formatBytes } from "~/lib/image";
import { sendFile } from "~/lib/upload";
import { cn } from "~/lib/utils";
import { i18next, useTranslation } from "~/traducao";

interface SectionProps {
  guildId: string;
  canManage: boolean;
}

const DEFAULT_VOLUME = 0.5;

const nameSafe = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .slice(0, 32);

export const EmojiSection: React.FC<SectionProps> = ({
  guildId,
  canManage,
}) => {
  const { t } = useTranslation();
  const { data } = useFindExpressions(guildId);
  const create = useCreateEmoji(guildId);
  const confirm = useConfirm();
  const doDelete = useDeleteEmoji(guildId);
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (!files.length) return;

    setUploading(true);

    for (const file of files) {
      const attachment = await sendFile(file).catch(() => null);
      if (!attachment) continue;

      const name = nameSafe(file.name.replace(/\.[^.]+$/, "")) || "emoji";
      await create
        .mutateAsync({
          guildId,
          name: name,
          url: attachment.url,
          animated: file.type === "image/gif",
        })
        .catch(() => null);
    }

    setUploading(false);
  };

  const remaining = LIMITS.emojisByServer - data.emojis.length;

  return (
    <div data-gc="servidor.server-settings.expressions-sections.div" className="max-w-3xl pb-10">
      <h2 data-gc="servidor.server-settings.expressions-sections.h2" className="text-xl font-semibold">{t("comum.emoji")}</h2>
      <p data-gc="servidor.server-settings.expressions-sections.p" className="mt-1 text-sm text-ink-muted">
        {t("servidor.expressoes.comoUsar", { limite: LIMITS.emojisByServer })}
      </p>

      {canManage && (
        <>
          <Button data-gc="servidor.server-settings.expressions-sections.button"
            className="mt-4"
            disabled={uploading || remaining <= 0}
            onClick={() => input.current?.click()}
          >
            <Upload data-gc="servidor.server-settings.expressions-sections.upload" size={16} /> {uploading ? "Enviando…" : "Enviar emoji"}
          </Button>

          <input data-gc="servidor.server-settings.expressions-sections.input"
            ref={input}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => void pick(e)}
            className="hidden"
          />

          <p data-gc="servidor.server-settings.expressions-sections.p--2" className="mt-2 text-xs text-ink-faint">
            O nome vem do arquivo — dá pra subir vários de uma vez. {remaining}{" "}
            espaços disponíveis.
          </p>
        </>
      )}

      <table data-gc="servidor.server-settings.expressions-sections.table" className="mt-6 w-full">
        <thead data-gc="servidor.server-settings.expressions-sections.thead">
          <tr data-gc="servidor.server-settings.expressions-sections.tr" className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
            <th data-gc="servidor.server-settings.expressions-sections.th" className="pb-2 font-semibold">{t("servidor.expressoes.imagem")}</th>
            <th data-gc="servidor.server-settings.expressions-sections.th--2" className="pb-2 font-semibold">{t("comum.nome")}</th>
            <th data-gc="servidor.server-settings.expressions-sections.th--3" className="pb-2 font-semibold">{t("servidor.expressoes.enviadoPor")}</th>
            <th data-gc="servidor.server-settings.expressions-sections.th--4" />
          </tr>
        </thead>
        <tbody data-gc="servidor.server-settings.expressions-sections.tbody">
          {data.emojis.map((emoji) => (
            <tr data-gc="servidor.server-settings.expressions-sections.tr--2" key={emoji.id} className="group border-b border-line">
              <td data-gc="servidor.server-settings.expressions-sections.td" className="py-2">
                <img data-gc="servidor.server-settings.expressions-sections.img"
                  src={emoji.url}
                  alt={emoji.name}
                  className="size-8 object-contain"
                />
              </td>
              <td data-gc="servidor.server-settings.expressions-sections.td--2" className="py-2 text-sm">:{emoji.name}:</td>
              <td data-gc="servidor.server-settings.expressions-sections.td--3" className="py-2">
                {emoji.createdBy && (
                  <span data-gc="servidor.server-settings.expressions-sections.span" className="flex items-center gap-2 text-sm text-ink-muted">
                    <Avatar data-gc="servidor.server-settings.expressions-sections.avatar"
                      id={emoji.createdBy.id}
                      name={emoji.createdBy.displayName}
                      url={emoji.createdBy.avatarUrl}
                      size={20}
                    />
                    {emoji.createdBy.displayName}
                  </span>
                )}
              </td>
              <td data-gc="servidor.server-settings.expressions-sections.td--4" className="py-2 text-right">
                {canManage && (
                  <button data-gc="servidor.server-settings.expressions-sections.button--2"
                    onClick={() =>
                      void confirm(
                        deletionRequest("emoji", emoji.name),
                      ).then(
                        ({ confirmed }) =>
                          confirmed &&
                          doDelete.mutate({ guildId, emojiId: emoji.id }),
                      )
                    }
                    title={t("comum.apagar")}
                    className="rounded p-1.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
                  >
                    <Trash2 data-gc="servidor.server-settings.expressions-sections.trash2" size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!data.emojis.length && (
        <p data-gc="servidor.server-settings.expressions-sections.p--3" className="py-10 text-center text-sm text-ink-faint">
          {t("servidor.expressoes.semEmoji")}
        </p>
      )}
    </div>
  );
};

export const StickersSection: React.FC<SectionProps> = ({
  guildId,
  canManage,
}) => {
  const { t } = useTranslation();
  const { data } = useFindExpressions(guildId);
  const create = useCreateSticker(guildId);
  const confirm = useConfirm();
  const doDelete = useDeleteSticker(guildId);
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ file: File; url: string } | null>(
    null,
  );
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("😀");

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > LIMITS.stickerBytes) {
      toast.error(
        t("servidor.expressoes.figurinhaGrande", { limite: formatBytes(LIMITS.stickerBytes) }),
      );
      return;
    }

    const attachment = await sendFile(file).catch(() => null);
    if (!attachment) return toast.error(t("servidor.expressoes.falhaEnvio"));

    setPending({ file: file, url: attachment.url });
    setName(file.name.replace(/\.[^.]+$/, "").slice(0, 30));
  };

  const remaining = LIMITS.stickersByServer - data.stickers.length;

  return (
    <div data-gc="servidor.server-settings.expressions-sections.div--2" className="max-w-2xl pb-10">
      <h2 data-gc="servidor.server-settings.expressions-sections.h2--2" className="text-xl font-semibold">{t("servidor.expressoes.figurinhas")}</h2>
      <p data-gc="servidor.server-settings.expressions-sections.p--4" className="mt-1 text-sm text-ink-muted">
        Até {LIMITS.stickersByServer} figurinhas, de no máximo{" "}
        {formatBytes(LIMITS.stickerBytes)} cada (PNG, APNG, GIF ou WebP).
      </p>

      {canManage && (
        <>
          <Button data-gc="servidor.server-settings.expressions-sections.button--3"
            className="mt-4"
            disabled={remaining <= 0}
            onClick={() => input.current?.click()}
          >
            <Upload data-gc="servidor.server-settings.expressions-sections.upload--2" size={16} /> {t("servidor.expressoes.enviarFigurinha")}
          </Button>
          <input data-gc="servidor.server-settings.expressions-sections.input--2"
            ref={input}
            type="file"
            accept="image/png,image/gif,image/webp,image/apng"
            onChange={(e) => void pick(e)}
            className="hidden"
          />
          <p data-gc="servidor.server-settings.expressions-sections.p--5" className="mt-2 text-xs text-ink-faint">
            {remaining} espaços disponíveis.
          </p>
        </>
      )}

      {pending && (
        <div data-gc="servidor.server-settings.expressions-sections.div--3" className="mt-4 flex items-start gap-4 rounded-lg bg-surface-1 p-4">
          <img data-gc="servidor.server-settings.expressions-sections.img--2"
            src={pending.url}
            alt=""
            className="size-24 rounded object-contain bg-surface-0"
          />

          <div data-gc="servidor.server-settings.expressions-sections.div--4" className="flex-1 space-y-3">
            <div data-gc="servidor.server-settings.expressions-sections.div--5">
              <Label data-gc="servidor.server-settings.expressions-sections.label" htmlFor="fig-nome">{t("servidor.expressoes.nomeDaFigurinha")}</Label>
              <Input data-gc="servidor.server-settings.expressions-sections.input--3"
                id="fig-nome"
                value={name}
                maxLength={30}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("servidor.expressoes.exemploFigurinha")}
              />
            </div>

            <EmojiField data-gc="servidor.server-settings.expressions-sections.emoji-field.set-emoji" id="fig-emoji" emoji={emoji} onPick={setEmoji} />

            <div data-gc="servidor.server-settings.expressions-sections.div--6" className="flex gap-2">
              <Button data-gc="servidor.server-settings.expressions-sections.button--4"
                size="sm"
                disabled={!name.trim() || create.isPending}
                onClick={() =>
                  create.mutate(
                    {
                      guildId,
                      name: name.trim(),
                      relatedEmoji: emoji || "😀",
                      url: pending.url,
                      size: pending.file.size,
                    },
                    { onSuccess: () => setPending(null) },
                  )
                }
              >
                {t("comum.enviar")}
              </Button>
              <Button data-gc="servidor.server-settings.expressions-sections.button--5"
                variant="surface"
                size="sm"
                onClick={() => setPending(null)}
              >
                {t("servidor.expressoes.deixaPraLa")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div data-gc="servidor.server-settings.expressions-sections.div--7" className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {data.stickers.map((sticker) => (
          <div data-gc="servidor.server-settings.expressions-sections.div--8"
            key={sticker.id}
            className="group relative rounded-lg bg-surface-1 p-3"
          >
            <img data-gc="servidor.server-settings.expressions-sections.img--3"
              src={sticker.url}
              alt={sticker.name}
              className="aspect-square w-full object-contain"
            />
            <p data-gc="servidor.server-settings.expressions-sections.p--6" className="mt-2 truncate text-center text-xs text-ink-muted">
              {sticker.name}
            </p>

            {canManage && (
              <button data-gc="servidor.server-settings.expressions-sections.button--6"
                onClick={() =>
                  void confirm(
                    deletionRequest("figurinha", sticker.name),
                  ).then(
                    ({ confirmed }) =>
                      confirmed &&
                      doDelete.mutate({ guildId, stickerId: sticker.id }),
                  )
                }
                title={t("comum.apagar")}
                className="absolute right-1 top-1 rounded bg-surface-0 p-1 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
              >
                <Trash2 data-gc="servidor.server-settings.expressions-sections.trash2--2" size={14} />
              </button>
            )}
          </div>
        ))}

        {Array.from({ length: Math.max(0, remaining) }).map((_, i) => (
          <div data-gc="servidor.server-settings.expressions-sections.div--9"
            key={`vazio-${i}`}
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-line text-ink-faint"
          >
            <span data-gc="servidor.server-settings.expressions-sections.span--2" className="text-xs">vazio</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SoundboardSection: React.FC<SectionProps> = ({
  guildId,
  canManage,
}) => {
  const { t } = useTranslation();
  const { data } = useFindExpressions(guildId);
  const create = useCreateSound(guildId);
  const confirm = useConfirm();
  const doDelete = useDeleteSound(guildId);
  const input = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState<{ file: File; url: string } | null>(
    null,
  );
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔊");
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > LIMITS.soundBytes) {
      toast.error(t("servidor.expressoes.somGrande", { limite: formatBytes(LIMITS.soundBytes) }));
      return;
    }

    const attachment = await sendFile(file).catch(() => null);
    if (!attachment) return toast.error(t("servidor.expressoes.falhaEnvio"));

    setPending({ file: file, url: attachment.url });
    setName(file.name.replace(/\.[^.]+$/, "").slice(0, 32));
    setEmoji("🔊");
    setVolume(DEFAULT_VOLUME);
  };

  const remaining = LIMITS.soundsByServer - data.sounds.length;

  return (
    <div data-gc="servidor.server-settings.expressions-sections.div--10" className="max-w-2xl pb-10">
      <h2 data-gc="servidor.server-settings.expressions-sections.h2--3" className="text-xl font-semibold">{t("servidor.expressoes.sons")}</h2>
      <p data-gc="servidor.server-settings.expressions-sections.p--7" className="mt-1 text-sm text-ink-muted">
        Sons que qualquer pessoa na chamada pode tocar. Até{" "}
        {LIMITS.soundsByServer}, de no máximo {formatBytes(LIMITS.soundBytes)}{" "}
        cada.
      </p>

      {canManage && (
        <>
          <Button data-gc="servidor.server-settings.expressions-sections.button--7"
            className="mt-4"
            disabled={remaining <= 0}
            onClick={() => input.current?.click()}
          >
            <Upload data-gc="servidor.server-settings.expressions-sections.upload--3" size={16} /> {t("servidor.expressoes.enviarSom")}
          </Button>
          <input data-gc="servidor.server-settings.expressions-sections.input--4"
            ref={input}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/webm"
            onChange={(e) => void pick(e)}
            className="hidden"
          />
          <p data-gc="servidor.server-settings.expressions-sections.p--8" className="mt-2 text-xs text-ink-faint">
            {remaining} de {LIMITS.soundsByServer} espaços disponíveis.
          </p>
        </>
      )}

      {pending && (
        <div data-gc="servidor.server-settings.expressions-sections.div--11" className="mt-4 space-y-3 rounded-lg bg-surface-1 p-4">
          <div data-gc="servidor.server-settings.expressions-sections.div--12" className="grid grid-cols-2 gap-3">
            <div data-gc="servidor.server-settings.expressions-sections.div--13">
              <Label data-gc="servidor.server-settings.expressions-sections.label--2" htmlFor="som-nome">{t("servidor.expressoes.nomeDoSom")}</Label>
              <Input data-gc="servidor.server-settings.expressions-sections.input--5"
                id="som-nome"
                value={name}
                maxLength={32}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <EmojiField data-gc="servidor.server-settings.expressions-sections.emoji-field.set-emoji--2" id="som-emoji" emoji={emoji} onPick={setEmoji} />
          </div>

          <div data-gc="servidor.server-settings.expressions-sections.div--14">
            <Label data-gc="servidor.server-settings.expressions-sections.label--3">Volume do som — {Math.round(volume * 100)}%</Label>
            <Slider data-gc="servidor.server-settings.expressions-sections.slider"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              filled={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </div>

          <div data-gc="servidor.server-settings.expressions-sections.div--15" className="flex gap-2">
            <Button data-gc="servidor.server-settings.expressions-sections.button--8"
              size="sm"
              disabled={!name.trim() || create.isPending}
              onClick={() =>
                create.mutate(
                  {
                    guildId,
                    name: name.trim(),
                    emoji,
                    url: pending.url,
                    volume,
                    size: pending.file.size,
                  },
                  { onSuccess: () => setPending(null) },
                )
              }
            >
              {t("comum.enviar")}
            </Button>
            <Button data-gc="servidor.server-settings.expressions-sections.button--9"
              variant="surface"
              size="sm"
              onClick={() => setPending(null)}
            >
              {t("servidor.expressoes.deixaPraLa")}
            </Button>
          </div>
        </div>
      )}

      <div data-gc="servidor.server-settings.expressions-sections.div--16" className="mt-6 space-y-px">
        {data.sounds.map((sound) => (
          <div data-gc="servidor.server-settings.expressions-sections.div--17"
            key={sound.id}
            className="group flex items-center gap-3 border-t border-line py-3"
          >
            <span data-gc="servidor.server-settings.expressions-sections.span--3" className="text-xl">{sound.emoji || "🔊"}</span>
            <span data-gc="servidor.server-settings.expressions-sections.span--4" className="min-w-0 flex-1 truncate text-sm">{sound.name}</span>

            {sound.createdBy && (
              <span data-gc="servidor.server-settings.expressions-sections.span--5" className="flex items-center gap-2 text-xs text-ink-faint">
                <Avatar data-gc="servidor.server-settings.expressions-sections.avatar--2"
                  id={sound.createdBy.id}
                  name={sound.createdBy.displayName}
                  url={sound.createdBy.avatarUrl}
                  size={20}
                />
                {sound.createdBy.displayName}
              </span>
            )}

            <button data-gc="servidor.server-settings.expressions-sections.button--10"
              onClick={() => {
                const audio = new Audio(sound.url);
                audio.volume = sound.volume;
                void audio.play().catch(() => undefined);
              }}
              title={t("servidor.expressoes.ouvir")}
              className="rounded p-1.5 text-ink-muted transition hover:text-ink"
            >
              <Play data-gc="servidor.server-settings.expressions-sections.play" size={16} />
            </button>

            {canManage && <SoundVolume data-gc="servidor.server-settings.expressions-sections.sound-volume" guildId={guildId} sound={sound} />}

            {canManage && (
              <button data-gc="servidor.server-settings.expressions-sections.button--11"
                onClick={() =>
                  void confirm(deletionRequest("som", sound.name)).then(
                    ({ confirmed }) =>
                      confirmed && doDelete.mutate({ guildId, soundId: sound.id }),
                  )
                }
                title={t("comum.apagar")}
                className="rounded p-1.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
              >
                <Trash2 data-gc="servidor.server-settings.expressions-sections.trash2--3" size={16} />
              </button>
            )}
          </div>
        ))}

        {!data.sounds.length && (
          <p data-gc="servidor.server-settings.expressions-sections.p--9" className="py-10 text-center text-sm text-ink-faint">
            {t("servidor.expressoes.semSom")}
          </p>
        )}
      </div>
    </div>
  );
};

const EmojiField: React.FC<{
  id: string;
  emoji: string;
  onPick: (emoji: string) => void;
}> = ({ id, emoji, onPick }) => {
  const { t } = useTranslation();

  return (
  <div data-gc="servidor.server-settings.expressions-sections.div--18">
    <Label data-gc="servidor.server-settings.expressions-sections.label--4" htmlFor={id}>{t("servidor.expressoes.emojiRelacionado")}</Label>
    <EmojiPicker data-gc="servidor.server-settings.expressions-sections.emoji-picker.on-pick" onPick={onPick}>
      <button data-gc="servidor.server-settings.expressions-sections.button--12"
        id={id}
        type="button"
        className={cn(
          fieldBase,
          "flex h-10 items-center gap-2 py-1 text-left hover:border-campo-foco",
        )}
      >
        <span data-gc="servidor.server-settings.expressions-sections.span--6" className="text-xl leading-none">{emoji || "😀"}</span>
        <span data-gc="servidor.server-settings.expressions-sections.span--7" className="text-xs text-ink-faint">{t("comum.trocar")}</span>
      </button>
    </EmojiPicker>
  </div>
  );
};

const SoundVolume: React.FC<{ guildId: string; sound: GuildSound }> = ({
  guildId,
  sound,
}) => {
  const { t } = useTranslation();
  const update = useUpdateSound(guildId);
  const [volume, setVolume] = useState(sound.volume);

  useEffect(() => setVolume(sound.volume), [sound.volume]);

  const save = () => {
    if (volume === sound.volume) return;
    update.mutate({ guildId, soundId: sound.id, volume });
  };

  return (
    <Popover data-gc="servidor.server-settings.expressions-sections.popover" onOpenChange={(isOpen) => !isOpen && save()}>
      <PopoverTrigger data-gc="servidor.server-settings.expressions-sections.popover-trigger" asChild>
        <button data-gc="servidor.server-settings.expressions-sections.button--13"
          title={`Volume do som — ${Math.round(sound.volume * 100)}%`}
          className="rounded p-1.5 text-ink-muted transition hover:text-ink"
        >
          <Volume2 data-gc="servidor.server-settings.expressions-sections.volume2" size={16} />
        </button>
      </PopoverTrigger>

      <PopoverContent data-gc="servidor.server-settings.expressions-sections.popover-content" side="top" align="end" portal={false} className="w-64">
        <Label data-gc="servidor.server-settings.expressions-sections.label--5">Volume do som — {Math.round(volume * 100)}%</Label>
        <Slider data-gc="servidor.server-settings.expressions-sections.slider.save"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          filled={volume}
          aria-label={t("servidor.expressoes.volumeDe", { nome: sound.name })}
          onChange={(e) => setVolume(Number(e.target.value))}
          onPointerUp={save}
          onKeyUp={save}
        />

        <button data-gc="servidor.server-settings.expressions-sections.button--14"
          type="button"
          onClick={() => {
            const audio = new Audio(sound.url);
            audio.volume = volume;
            void audio.play().catch(() => undefined);
          }}
          className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted transition hover:text-ink"
        >
          <Play data-gc="servidor.server-settings.expressions-sections.play--2" size={13} /> {t("servidor.expressoes.ouvirAssim")}
        </button>

        <p data-gc="servidor.server-settings.expressions-sections.p--10" className="mt-3 text-11 leading-snug text-ink-faint">
          {t("servidor.expressoes.volumeDica")}
        </p>
      </PopoverContent>
    </Popover>
  );
};

function deletionRequest(kind: "emoji" | "figurinha" | "som", name: string) {
  return {
    title: i18next.t("servidor.expressoes.excluirTitulo", { tipo: kind, nome: name }),
    description: i18next.t("servidor.expressoes.excluirDescricao"),
    action: i18next.t("comum.excluir"),
  } as const;
}
