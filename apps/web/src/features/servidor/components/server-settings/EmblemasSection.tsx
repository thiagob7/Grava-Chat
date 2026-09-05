import React, { useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { LIMITS, type Emblema } from "@gravae/shared";

import {
  useCriarEmblema,
  useRemoverEmblema,
} from "~/@core/application/queries/guild/use-emblemas";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { Button } from "~/components/ui/button";
import { useConfirmar } from "~/components/ui/confirm";
import { Input, Label } from "~/components/ui/input";
import { useTranslation } from "~/traducao";

const EMBLEMA_MAX_PX = 64;

interface EmblemasSectionProps {
  guildId: string;
  emblemas: Emblema[];
  editavel: boolean;
}

export const EmblemasSection: React.FC<EmblemasSectionProps> = ({
  guildId,
  emblemas,
  editavel,
}) => {
  const { t } = useTranslation();
  const criar = useCriarEmblema(guildId);
  const remover = useRemoverEmblema(guildId);
  const uploadImage = useUploadImage();
  const confirmar = useConfirmar();
  const arquivo = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [emoji, setEmoji] = useState("");
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  const limpar = () => {
    setNome("");
    setEmoji("");
    setIconUrl(null);
  };

  const enviarImagem = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const file = evento.target.files?.[0];
    evento.target.value = "";
    if (!file) return;

    const resultado = await uploadImage
      .mutateAsync({
        file,
        maxSize: EMBLEMA_MAX_PX,
        finalidade: "iconeDeCargo",
      })
      .catch(() => null);

    if (resultado) {
      setIconUrl(resultado.attachment.url);
      setEmoji("");
    }
  };

  const podeCriar = Boolean(nome.trim()) && Boolean(emoji.trim() || iconUrl);

  return (
    <div data-gc="servidor.server-settings.emblemas-section.div" className="max-w-xl">
      <h2 data-gc="servidor.server-settings.emblemas-section.h2" className="text-xl font-semibold">{t("servidor.emblemas.titulo")}</h2>
      <p data-gc="servidor.server-settings.emblemas-section.p" className="mt-1 text-sm text-ink-muted">
        Ícones que qualquer membro pode vestir ao lado do nome. Você cria aqui;
        cada um escolhe quais usar no próprio cartão de perfil.
      </p>

      <div data-gc="servidor.server-settings.emblemas-section.div--2" className="mt-6 space-y-2">
        {emblemas.map((emblema) => (
          <div data-gc="servidor.server-settings.emblemas-section.div--3"
            key={emblema.id}
            className="flex items-center gap-3 rounded bg-surface-1 px-3 py-2.5"
          >
            <span data-gc="servidor.server-settings.emblemas-section.span" className="flex size-7 items-center justify-center">
              {emblema.emoji ? (
                <span data-gc="servidor.server-settings.emblemas-section.span--2" className="text-lg leading-none">{emblema.emoji}</span>
              ) : emblema.iconUrl ? (
                <img data-gc="servidor.server-settings.emblemas-section.img"
                  src={emblema.iconUrl}
                  alt=""
                  className="size-6 object-contain"
                />
              ) : null}
            </span>

            <span data-gc="servidor.server-settings.emblemas-section.span--3" className="min-w-0 flex-1 truncate text-sm font-medium">
              {emblema.nome}
            </span>

            {editavel && (
              <button data-gc="servidor.server-settings.emblemas-section.button"
                onClick={() =>
                  void confirmar({
                    titulo: `Apagar o emblema ${emblema.nome}?`,
                    descricao:
                      t("servidor.emblemas.apagarDescricao"),
                    acao: t("comum.apagar"),
                  }).then(
                    ({ confirmado }) =>
                      confirmado && remover.mutate(emblema.id),
                  )
                }
                aria-label={`Apagar ${emblema.nome}`}
                className="rounded p-1.5 text-ink-faint transition hover:bg-surface-3 hover:text-danger"
              >
                <Trash2 data-gc="servidor.server-settings.emblemas-section.trash2" size={15} />
              </button>
            )}
          </div>
        ))}

        {!emblemas.length && (
          <p data-gc="servidor.server-settings.emblemas-section.p--2" className="rounded bg-surface-1 px-3 py-6 text-center text-sm text-ink-faint">
            {t("servidor.emblemas.vazio")}
          </p>
        )}
      </div>

      {editavel && emblemas.length < LIMITS.emblemasPorServidor && (
        <div data-gc="servidor.server-settings.emblemas-section.div--4" className="mt-6 rounded bg-surface-1 p-4">
          <p data-gc="servidor.server-settings.emblemas-section.p--3" className="mb-3 text-sm font-medium">{t("servidor.emblemas.novo")}</p>

          <div data-gc="servidor.server-settings.emblemas-section.div--5" className="flex gap-3">
            <div data-gc="servidor.server-settings.emblemas-section.div--6" className="flex-1">
              <Label data-gc="servidor.server-settings.emblemas-section.label" htmlFor="emblema-nome">{t("comum.nome")}</Label>
              <Input data-gc="servidor.server-settings.emblemas-section.input"
                id="emblema-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={LIMITS.emblemaNome}
                placeholder="DEV"
              />
            </div>

            <div data-gc="servidor.server-settings.emblemas-section.div--7" className="w-24">
              <Label data-gc="servidor.server-settings.emblemas-section.label--2" htmlFor="emblema-emoji">{t("comum.emoji")}</Label>
              <Input data-gc="servidor.server-settings.emblemas-section.input--2"
                id="emblema-emoji"
                value={emoji}
                onChange={(e) => {
                  setEmoji(e.target.value);
                  if (e.target.value) setIconUrl(null);
                }}
                maxLength={8}
                placeholder="⚡"
              />
            </div>
          </div>

          <div data-gc="servidor.server-settings.emblemas-section.div--8" className="mt-3 flex items-center gap-2">
            <Button data-gc="servidor.server-settings.emblemas-section.button--2"
              variant="surface"
              size="sm"
              onClick={() => arquivo.current?.click()}
              disabled={uploadImage.isPending}
            >
              <ImageUp data-gc="servidor.server-settings.emblemas-section.image-up" size={14} />
              {uploadImage.isPending
                ? "Enviando…"
                : iconUrl
                  ? "Trocar imagem"
                  : "Usar imagem"}
            </Button>

            {iconUrl && (
              <img data-gc="servidor.server-settings.emblemas-section.img--2" src={iconUrl} alt="" className="size-6 object-contain" />
            )}

            <input data-gc="servidor.server-settings.emblemas-section.input--3"
              ref={arquivo}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => void enviarImagem(e)}
              className="hidden"
            />

            <Button data-gc="servidor.server-settings.emblemas-section.button--3"
              size="sm"
              className="ml-auto"
              disabled={!podeCriar || criar.isPending}
              onClick={() =>
                criar.mutate(
                  { nome: nome.trim(), emoji: emoji.trim() || null, iconUrl },
                  { onSuccess: limpar },
                )
              }
            >
              {t("comum.criar")}
            </Button>
          </div>

          <p data-gc="servidor.server-settings.emblemas-section.p--4" className="mt-2 text-xs text-ink-faint">
            Emoji ou imagem, não os dois. Até {LIMITS.emblemasPorServidor}{" "}
            emblemas por servidor.
          </p>
        </div>
      )}
    </div>
  );
};
