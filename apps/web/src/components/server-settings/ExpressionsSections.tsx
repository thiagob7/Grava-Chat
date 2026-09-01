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
import { Avatar } from "~/components/Avatar";
import { SeletorDeEmoji } from "~/components/SeletorDeEmoji";
import { Button } from "~/components/ui/button";
import { campoBase, Input, Label } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import { useConfirmar } from "~/components/ui/confirm";
import { formatBytes } from "~/lib/image";
import { uploadArquivo } from "~/lib/upload";
import { cn } from "~/lib/utils";

interface SecaoProps {
  guildId: string;
  podeGerenciar: boolean;
}

/// Metade do caminho. O som do painel toca por cima de quem está falando, e
/// 100% estoura o ouvido de quem está com o fone alto.
const VOLUME_PADRAO = 0.5;

const nomeSeguro = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .slice(0, 32);

export const EmojiSection: React.FC<SecaoProps> = ({ guildId, podeGerenciar }) => {
  const { data } = useFindExpressions(guildId);
  const criar = useCreateEmoji(guildId);
  const confirmar = useConfirmar();
  const apagar = useDeleteEmoji(guildId);
  const input = useRef<HTMLInputElement>(null);
  const [subindo, setSubindo] = useState(false);

  const escolher = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = [...(event.target.files ?? [])];
    event.target.value = "";
    if (!arquivos.length) return;

    setSubindo(true);

    for (const arquivo of arquivos) {
      const anexo = await uploadArquivo(arquivo).catch(() => null);
      if (!anexo) continue;

      const nome = nomeSeguro(arquivo.name.replace(/\.[^.]+$/, "")) || "emoji";
      await criar
        .mutateAsync({
          guildId,
          name: nome,
          url: anexo.url,
          animated: arquivo.type === "image/gif",
        })
        .catch(() => null);
    }

    setSubindo(false);
  };

  const restantes = LIMITS.emojisPorServidor - data.emojis.length;

  return (
    <div className="max-w-3xl pb-10">
      <h2 className="text-xl font-semibold">Emoji</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Adicione até {LIMITS.emojisPorServidor} emojis que todo mundo pode usar neste servidor.
        Digite <code className="rounded bg-surface-0 px-1">:nome:</code> no chat para mandar.
      </p>

      {podeGerenciar && (
        <>
          <Button className="mt-4" disabled={subindo || restantes <= 0} onClick={() => input.current?.click()}>
            <Upload size={16} /> {subindo ? "Enviando…" : "Enviar emoji"}
          </Button>

          <input
            ref={input}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => void escolher(e)}
            className="hidden"
          />

          <p className="mt-2 text-xs text-ink-faint">
            O nome vem do arquivo — dá pra subir vários de uma vez. {restantes} espaços disponíveis.
          </p>
        </>
      )}

      <table className="mt-6 w-full">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="pb-2 font-semibold">Imagem</th>
            <th className="pb-2 font-semibold">Nome</th>
            <th className="pb-2 font-semibold">Enviado por</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.emojis.map((emoji) => (
            <tr key={emoji.id} className="group border-b border-line">
              <td className="py-2">
                <img src={emoji.url} alt={emoji.name} className="size-8 object-contain" />
              </td>
              <td className="py-2 text-sm">:{emoji.name}:</td>
              <td className="py-2">
                {emoji.createdBy && (
                  <span className="flex items-center gap-2 text-sm text-ink-muted">
                    <Avatar
                      id={emoji.createdBy.id}
                      name={emoji.createdBy.displayName}
                      url={emoji.createdBy.avatarUrl}
                      size={20}
                    />
                    {emoji.createdBy.displayName}
                  </span>
                )}
              </td>
              <td className="py-2 text-right">
                {podeGerenciar && (
                  <button
                    onClick={() =>
                      void confirmar(pedidoDeExclusao("emoji", emoji.name)).then(
                        ({ confirmado }) =>
                          confirmado && apagar.mutate({ guildId, emojiId: emoji.id }),
                      )
                    }
                    title="Apagar"
                    className="rounded p-1.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!data.emojis.length && (
        <p className="py-10 text-center text-sm text-ink-faint">Nenhum emoji ainda.</p>
      )}
    </div>
  );
};

export const StickersSection: React.FC<SecaoProps> = ({ guildId, podeGerenciar }) => {
  const { data } = useFindExpressions(guildId);
  const criar = useCreateSticker(guildId);
  const confirmar = useConfirmar();
  const apagar = useDeleteSticker(guildId);
  const input = useRef<HTMLInputElement>(null);
  const [pendente, setPendente] = useState<{ file: File; url: string } | null>(null);
  const [nome, setNome] = useState("");
  const [emoji, setEmoji] = useState("😀");

  const escolher = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;

    if (arquivo.size > LIMITS.figurinhaBytes) {
      toast.error(`A figurinha passa de ${formatBytes(LIMITS.figurinhaBytes)}.`);
      return;
    }

    const anexo = await uploadArquivo(arquivo).catch(() => null);
    if (!anexo) return toast.error("Não deu pra subir o arquivo.");

    setPendente({ file: arquivo, url: anexo.url });
    setNome(arquivo.name.replace(/\.[^.]+$/, "").slice(0, 30));
  };

  const restantes = LIMITS.figurinhasPorServidor - data.stickers.length;

  return (
    <div className="max-w-2xl pb-10">
      <h2 className="text-xl font-semibold">Figurinhas</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Até {LIMITS.figurinhasPorServidor} figurinhas, de no máximo{" "}
        {formatBytes(LIMITS.figurinhaBytes)} cada (PNG, APNG, GIF ou WebP).
      </p>

      {podeGerenciar && (
        <>
          <Button className="mt-4" disabled={restantes <= 0} onClick={() => input.current?.click()}>
            <Upload size={16} /> Enviar figurinha
          </Button>
          <input
            ref={input}
            type="file"
            accept="image/png,image/gif,image/webp,image/apng"
            onChange={(e) => void escolher(e)}
            className="hidden"
          />
          <p className="mt-2 text-xs text-ink-faint">{restantes} espaços disponíveis.</p>
        </>
      )}

      {pendente && (
        <div className="mt-4 flex items-start gap-4 rounded-lg bg-surface-1 p-4">
          <img src={pendente.url} alt="" className="size-24 rounded object-contain bg-surface-0" />

          <div className="flex-1 space-y-3">
            <div>
              <Label htmlFor="fig-nome">Nome da figurinha</Label>
              <Input
                id="fig-nome"
                value={nome}
                maxLength={30}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: abraço de gatinho"
              />
            </div>

            <CampoDeEmoji id="fig-emoji" emoji={emoji} onEscolher={setEmoji} />

            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!nome.trim() || criar.isPending}
                onClick={() =>
                  criar.mutate(
                    {
                      guildId,
                      name: nome.trim(),
                      relatedEmoji: emoji || "😀",
                      url: pendente.url,
                      size: pendente.file.size,
                    },
                    { onSuccess: () => setPendente(null) },
                  )
                }
              >
                Enviar
              </Button>
              <Button variant="surface" size="sm" onClick={() => setPendente(null)}>
                Deixa pra lá
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-5 gap-3">
        {data.stickers.map((sticker) => (
          <div key={sticker.id} className="group relative rounded-lg bg-surface-1 p-3">
            <img src={sticker.url} alt={sticker.name} className="aspect-square w-full object-contain" />
            <p className="mt-2 truncate text-center text-xs text-ink-muted">{sticker.name}</p>

            {podeGerenciar && (
              <button
                onClick={() =>
                  void confirmar(pedidoDeExclusao("figurinha", sticker.name)).then(
                    ({ confirmado }) =>
                      confirmado && apagar.mutate({ guildId, stickerId: sticker.id }),
                  )
                }
                title="Apagar"
                className="absolute right-1 top-1 rounded bg-surface-0 p-1 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}

        {Array.from({ length: Math.max(0, restantes) }).map((_, i) => (
          <div
            key={`vazio-${i}`}
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-line text-ink-faint"
          >
            <span className="text-xs">vazio</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SoundboardSection: React.FC<SecaoProps> = ({ guildId, podeGerenciar }) => {
  const { data } = useFindExpressions(guildId);
  const criar = useCreateSound(guildId);
  const confirmar = useConfirmar();
  const apagar = useDeleteSound(guildId);
  const input = useRef<HTMLInputElement>(null);

  const [pendente, setPendente] = useState<{ file: File; url: string } | null>(null);
  const [nome, setNome] = useState("");
  const [emoji, setEmoji] = useState("🔊");
  /// Metade: som de painel entra por cima da conversa, e 100% costuma
  /// estourar. Quem subiu ajusta aqui, e depois na lista, quando ouvir.
  const [volume, setVolume] = useState(VOLUME_PADRAO);

  const escolher = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;

    if (arquivo.size > LIMITS.somBytes) {
      toast.error(`O som passa de ${formatBytes(LIMITS.somBytes)}.`);
      return;
    }

    const anexo = await uploadArquivo(arquivo).catch(() => null);
    if (!anexo) return toast.error("Não deu pra subir o arquivo.");

    setPendente({ file: arquivo, url: anexo.url });
    setNome(arquivo.name.replace(/\.[^.]+$/, "").slice(0, 32));
    setEmoji("🔊");
    setVolume(VOLUME_PADRAO);
  };

  const restantes = LIMITS.sonsPorServidor - data.sounds.length;

  return (
    <div className="max-w-2xl pb-10">
      <h2 className="text-xl font-semibold">Painel de efeitos sonoros</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Sons que qualquer pessoa na chamada pode tocar. Até {LIMITS.sonsPorServidor}, de no máximo{" "}
        {formatBytes(LIMITS.somBytes)} cada.
      </p>

      {podeGerenciar && (
        <>
          <Button className="mt-4" disabled={restantes <= 0} onClick={() => input.current?.click()}>
            <Upload size={16} /> Enviar som
          </Button>
          <input
            ref={input}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/webm"
            onChange={(e) => void escolher(e)}
            className="hidden"
          />
          <p className="mt-2 text-xs text-ink-faint">
            {restantes} de {LIMITS.sonsPorServidor} espaços disponíveis.
          </p>
        </>
      )}

      {pendente && (
        <div className="mt-4 space-y-3 rounded-lg bg-surface-1 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="som-nome">Nome do som</Label>
              <Input
                id="som-nome"
                value={nome}
                maxLength={32}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <CampoDeEmoji id="som-emoji" emoji={emoji} onEscolher={setEmoji} />
          </div>

          <div>
            <Label>Volume do som — {Math.round(volume * 100)}%</Label>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={volume}
              preenchido={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!nome.trim() || criar.isPending}
              onClick={() =>
                criar.mutate(
                  {
                    guildId,
                    name: nome.trim(),
                    emoji,
                    url: pendente.url,
                    volume,
                    size: pendente.file.size,
                  },
                  { onSuccess: () => setPendente(null) },
                )
              }
            >
              Enviar
            </Button>
            <Button variant="surface" size="sm" onClick={() => setPendente(null)}>
              Deixa pra lá
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-px">
        {data.sounds.map((som) => (
          <div key={som.id} className="group flex items-center gap-3 border-t border-line py-3">
            {/* `||`: som sem emoji vem com string vazia, e o `??` deixava um buraco. */}
            <span className="text-xl">{som.emoji || "🔊"}</span>
            <span className="min-w-0 flex-1 truncate text-sm">{som.name}</span>

            {som.createdBy && (
              <span className="flex items-center gap-2 text-xs text-ink-faint">
                <Avatar
                  id={som.createdBy.id}
                  name={som.createdBy.displayName}
                  url={som.createdBy.avatarUrl}
                  size={20}
                />
                {som.createdBy.displayName}
              </span>
            )}

            <button
              onClick={() => {
                const audio = new Audio(som.url);
                audio.volume = som.volume;
                void audio.play().catch(() => undefined);
              }}
              title="Ouvir"
              className="rounded p-1.5 text-ink-muted transition hover:text-ink"
            >
              <Play size={16} />
            </button>

            {podeGerenciar && <VolumeDoSom guildId={guildId} som={som} />}

            {podeGerenciar && (
              <button
                onClick={() =>
                  void confirmar(pedidoDeExclusao("som", som.name)).then(
                    ({ confirmado }) => confirmado && apagar.mutate({ guildId, soundId: som.id }),
                  )
                }
                title="Apagar"
                className="rounded p-1.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}

        {!data.sounds.length && (
          <p className="py-10 text-center text-sm text-ink-faint">Nenhum som ainda.</p>
        )}
      </div>
    </div>
  );
};

/**
 * O campo de emoji com o seletor do app.
 *
 * Era um campo de texto de 8 caracteres: pra colocar um emoji, a pessoa
 * precisava saber o atalho do teclado do sistema — ou colar de algum lugar. E
 * o campo aceitava "abc" numa boa, que ia parar na lista como emoji do som.
 */
const CampoDeEmoji: React.FC<{
  id: string;
  emoji: string;
  onEscolher: (emoji: string) => void;
}> = ({ id, emoji, onEscolher }) => (
  <div>
    <Label htmlFor={id}>Emoji relacionado</Label>
    <SeletorDeEmoji onEscolher={onEscolher}>
      <button
        id={id}
        type="button"
        className={cn(campoBase, "flex h-10 items-center gap-2 py-1 text-left hover:border-campo-foco")}
      >
        <span className="text-xl leading-none">{emoji || "😀"}</span>
        <span className="text-xs text-ink-faint">Trocar</span>
      </button>
    </SeletorDeEmoji>
  </div>
);

/**
 * O volume gravado no som, ajustável depois de subir.
 *
 * Antes só dava pra escolher na hora do envio, e quem errasse a mão tinha que
 * apagar e subir de novo — gastando um dos oito espaços no caminho. A gravação
 * sai quando o dedo solta a faixa, não a cada passo: seriam vinte chamadas
 * numa arrastada só.
 */
const VolumeDoSom: React.FC<{ guildId: string; som: GuildSound }> = ({ guildId, som }) => {
  const atualizar = useUpdateSound(guildId);
  const [volume, setVolume] = useState(som.volume);

  /// Se outra pessoa mexer, a lista chega com o valor novo.
  useEffect(() => setVolume(som.volume), [som.volume]);

  const salvar = () => {
    if (volume === som.volume) return;
    atualizar.mutate({ guildId, soundId: som.id, volume });
  };

  return (
    <Popover onOpenChange={(aberto) => !aberto && salvar()}>
      <PopoverTrigger asChild>
        <button
          title={`Volume do som — ${Math.round(som.volume * 100)}%`}
          className="rounded p-1.5 text-ink-muted transition hover:text-ink"
        >
          <Volume2 size={16} />
        </button>
      </PopoverTrigger>

      {/*
        `portal={false}` como no seletor de emoji: as configurações moram num
        diálogo modal, e o que sai pro `body` nasce com os cliques bloqueados —
        a faixa apareceria e não mexeria.
      */}
      <PopoverContent side="top" align="end" portal={false} className="w-64">
        <Label>Volume do som — {Math.round(volume * 100)}%</Label>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={volume}
          preenchido={volume}
          aria-label={`Volume de ${som.name}`}
          onChange={(e) => setVolume(Number(e.target.value))}
          onPointerUp={salvar}
          onKeyUp={salvar}
        />

        <button
          type="button"
          onClick={() => {
            const audio = new Audio(som.url);
            audio.volume = volume;
            void audio.play().catch(() => undefined);
          }}
          className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted transition hover:text-ink"
        >
          <Play size={13} /> Ouvir assim
        </button>

        <p className="mt-3 text-[11px] leading-snug text-ink-faint">
          Vale pra todo mundo do servidor. Cada pessoa ainda pode abaixar os sons só pra ela, no
          painel da chamada.
        </p>
      </PopoverContent>
    </Popover>
  );
};

function pedidoDeExclusao(tipo: "emoji" | "figurinha" | "som", nome: string) {
  return {
    titulo: `Excluir ${tipo} "${nome}"?`,
    descricao: `Some do servidor para todo mundo. As mensagens que já usaram continuam como estão.`,
    acao: "Excluir",
  } as const;
}
