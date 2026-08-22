import React, { useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { LIMITS, type Emblema } from "@gravae/shared";

import { useCriarEmblema, useRemoverEmblema } from "~/@core/application/queries/guild/use-emblemas";
import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { Button } from "~/components/ui/button";
import { useConfirmar } from "~/components/ui/confirm";
import { Input, Label } from "~/components/ui/input";

/** O emblema aparece a 16px ao lado de um nome; 64 já cobre tela retina. */
const EMBLEMA_MAX_PX = 64;

interface EmblemasSectionProps {
  guildId: string;
  emblemas: Emblema[];
  /** sem MANAGE_GUILD a tela ainda abre, só não deixa criar nem apagar */
  editavel: boolean;
}

/**
 * Os emblemas do servidor.
 *
 * O servidor CRIA; quem VESTE é cada membro, sozinho, pelo próprio cartão. Não
 * existe conceder: um emblema que precisa de aprovação vira fila de pedido no
 * ouvido do dono, e a graça é a pessoa se identificar com o grupo sem pedir
 * licença. Quem quiser um "DEV" de mentira, que use — o custo social já resolve.
 */
export const EmblemasSection: React.FC<EmblemasSectionProps> = ({
  guildId,
  emblemas,
  editavel,
}) => {
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
      .mutateAsync({ file, maxSize: EMBLEMA_MAX_PX, finalidade: "iconeDeCargo" })
      .catch(() => null);

    if (resultado) {
      setIconUrl(resultado.attachment.url);
      setEmoji(""); // emoji OU imagem: escolher uma limpa a outra
    }
  };

  const podeCriar = Boolean(nome.trim()) && Boolean(emoji.trim() || iconUrl);

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold">Emblemas</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Ícones que qualquer membro pode vestir ao lado do nome. Você cria aqui; cada um escolhe
        quais usar no próprio cartão de perfil.
      </p>

      <div className="mt-6 space-y-2">
        {emblemas.map((emblema) => (
          <div
            key={emblema.id}
            className="flex items-center gap-3 rounded bg-surface-1 px-3 py-2.5"
          >
            <span className="flex size-7 items-center justify-center">
              {emblema.emoji ? (
                <span className="text-lg leading-none">{emblema.emoji}</span>
              ) : emblema.iconUrl ? (
                <img src={emblema.iconUrl} alt="" className="size-6 object-contain" />
              ) : null}
            </span>

            <span className="min-w-0 flex-1 truncate text-sm font-medium">{emblema.nome}</span>

            {editavel && (
              <button
                onClick={() =>
                  void confirmar({
                    titulo: `Apagar o emblema ${emblema.nome}?`,
                    descricao: "Ele sai de quem estiver usando. Não dá pra desfazer.",
                    acao: "Apagar",
                  }).then(({ confirmado }) => confirmado && remover.mutate(emblema.id))
                }
                aria-label={`Apagar ${emblema.nome}`}
                className="rounded p-1.5 text-ink-faint transition hover:bg-surface-3 hover:text-danger"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}

        {!emblemas.length && (
          <p className="rounded bg-surface-1 px-3 py-6 text-center text-sm text-ink-faint">
            Nenhum emblema ainda.
          </p>
        )}
      </div>

      {editavel && emblemas.length < LIMITS.emblemasPorServidor && (
        <div className="mt-6 rounded bg-surface-1 p-4">
          <p className="mb-3 text-sm font-medium">Novo emblema</p>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="emblema-nome">Nome</Label>
              <Input
                id="emblema-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={LIMITS.emblemaNome}
                placeholder="DEV"
              />
            </div>

            <div className="w-24">
              <Label htmlFor="emblema-emoji">Emoji</Label>
              <Input
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

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="surface"
              size="sm"
              onClick={() => arquivo.current?.click()}
              disabled={uploadImage.isPending}
            >
              <ImageUp size={14} />
              {uploadImage.isPending ? "Enviando…" : iconUrl ? "Trocar imagem" : "Usar imagem"}
            </Button>

            {iconUrl && <img src={iconUrl} alt="" className="size-6 object-contain" />}

            <input
              ref={arquivo}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => void enviarImagem(e)}
              className="hidden"
            />

            <Button
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
              Criar
            </Button>
          </div>

          <p className="mt-2 text-xs text-ink-faint">
            Emoji ou imagem, não os dois. Até {LIMITS.emblemasPorServidor} emblemas por servidor.
          </p>
        </div>
      )}
    </div>
  );
};
