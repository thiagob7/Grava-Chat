import React, { useEffect, useMemo, useState } from "react";
import { Clock, Loader2, Search, TrendingUp } from "lucide-react";
import type { GuildEmoji, Sticker } from "@gravae/shared";

import { useFindExpressions } from "~/@core/application/queries/expression/use-expressions";
import { useGifConfig, useSearchGifs, useTrendingGifs } from "~/@core/application/queries/gif/use-gifs";
import type { GifModel } from "~/@core/application/requests/gif/gifs";
import { Input } from "~/components/ui/input";
import {
  carregarEmojis,
  combina,
  emojisRecentes,
  registrarUso,
  type GrupoDeEmoji,
} from "~/lib/emoji";
import { cn } from "~/lib/utils";

export type Aba = "gifs" | "figurinhas" | "emoji";

interface ExpressionPickerProps {
  guildId: string | undefined;
  abaInicial?: Aba;
  /** emoji unicode ou `:nome:` do servidor — vai direto pro campo de texto */
  onEmoji: (texto: string) => void;
  onSticker: (sticker: Sticker) => void;
  /** o GIF é enviado na hora, como no Discord */
  onGif: (gif: GifModel) => void;
}

/**
 * O seletor de expressões: GIF, figurinha e emoji nas mesmas três abas do
 * Discord. Um componente só porque é uma janela só — separar em três daria
 * três estados de busca e três jeitos de fechar.
 */
export const ExpressionPicker: React.FC<ExpressionPickerProps> = ({
  guildId,
  abaInicial = "emoji",
  onEmoji,
  onSticker,
  onGif,
}) => {
  const [aba, setAba] = useState<Aba>(abaInicial);
  const [busca, setBusca] = useState("");

  // trocar de aba zera a busca: o termo de GIF não faz sentido em figurinha
  useEffect(() => setBusca(""), [aba]);

  const abas: { id: Aba; label: string }[] = [
    { id: "gifs", label: "GIFs" },
    { id: "figurinhas", label: "Figurinha" },
    { id: "emoji", label: "Emoji" },
  ];

  return (
    <div className="flex h-[420px] w-[420px] flex-col overflow-hidden rounded-lg bg-surface-1 shadow-2xl">
      <nav className="flex gap-1 p-3 pb-2">
        {abas.map((item) => (
          <button
            key={item.id}
            onClick={() => setAba(item.id)}
            className={cn(
              "rounded px-3 py-1.5 text-sm transition",
              aba === item.id ? "bg-surface-4 text-ink" : "text-ink-muted hover:bg-surface-3",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded bg-surface-0 px-2.5">
          <Search size={14} className="shrink-0 text-ink-faint" />
          <Input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={
              aba === "gifs"
                // A KLIPY pede atribuição da marca na barra de busca, e é o que
                // o Discord faz também — é o preço da API gratuita.
                ? "Buscar Klipy"
                : aba === "figurinhas"
                  ? "Encontre a figurinha perfeita"
                  : "Encontre o emoji perfeito"
            }
            className="bg-transparent px-0 py-2 text-sm"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {aba === "gifs" && <AbaGifs busca={busca} onGif={onGif} />}
        {aba === "figurinhas" && <AbaFigurinhas guildId={guildId} busca={busca} onSticker={onSticker} />}
        {aba === "emoji" && <AbaEmoji guildId={guildId} busca={busca} onEmoji={onEmoji} />}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------- GIFs

const AbaGifs: React.FC<{ busca: string; onGif: (gif: GifModel) => void }> = ({ busca, onGif }) => {
  const { data: config } = useGifConfig(true);
  const [termo, setTermo] = useState("");

  /**
   * Espera a pessoa parar de digitar antes de perguntar ao serviço de GIF. Sem
   * isso, cada letra viraria uma chamada — e a cota é do dono da chave.
   */
  useEffect(() => {
    const timer = setTimeout(() => setTermo(busca), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  const emAlta = useTrendingGifs(Boolean(config?.disponivel) && !termo.trim());
  const busca_ = useSearchGifs(config?.disponivel ? termo : "");

  if (config && !config.disponivel) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium">A busca de GIF precisa de uma chave</p>
        <p className="mt-2 text-xs text-ink-muted">
          Crie uma chave gratuita em{" "}
          <code className="rounded bg-surface-0 px-1">partner.klipy.com</code> e coloque em{" "}
          <code className="rounded bg-surface-0 px-1">KLIPY_API_KEY</code> no .env do projeto. Colar
          link de GIF continua funcionando sem isso.
        </p>
      </div>
    );
  }

  const lista = termo.trim() ? busca_.data : emAlta.data;
  const carregando = termo.trim() ? busca_.isLoading : emAlta.isLoading;

  return (
    <>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {termo.trim() ? <Search size={12} /> : <TrendingUp size={12} />}
        {termo.trim() ? `Resultados para "${termo}"` : "GIFs em alta"}
      </p>

      {carregando && <Carregando />}

      <div className="columns-2 gap-2">
        {(lista ?? []).map((gif) => (
          <button
            key={gif.id}
            onClick={() => onGif(gif)}
            className="mb-2 block w-full overflow-hidden rounded transition hover:brightness-110"
          >
            <img src={gif.preview} alt={gif.descricao} loading="lazy" className="w-full" />
          </button>
        ))}
      </div>

      {!carregando && !(lista ?? []).length && (
        <p className="py-10 text-center text-sm text-ink-faint">Nada por aqui.</p>
      )}
    </>
  );
};

// -------------------------------------------------------------- figurinhas

const AbaFigurinhas: React.FC<{
  guildId: string | undefined;
  busca: string;
  onSticker: (s: Sticker) => void;
}> = ({ guildId, busca, onSticker }) => {
  const { data } = useFindExpressions(guildId);
  const termo = busca.toLowerCase().trim();

  const figurinhas = termo
    ? data.stickers.filter(
        (s) => s.name.toLowerCase().includes(termo) || s.relatedEmoji.includes(termo),
      )
    : data.stickers;

  if (!data.stickers.length) {
    return (
      <p className="px-6 py-10 text-center text-sm text-ink-muted">
        Este servidor ainda não tem figurinhas. Quem gerencia expressões pode subir até 5 em
        Configurações do servidor.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {figurinhas.map((sticker) => (
        <button
          key={sticker.id}
          onClick={() => onSticker(sticker)}
          title={sticker.name}
          className="aspect-square rounded p-1 transition hover:bg-surface-3"
        >
          <img src={sticker.url} alt={sticker.name} className="size-full object-contain" />
        </button>
      ))}
    </div>
  );
};

// ------------------------------------------------------------------ emoji

const AbaEmoji: React.FC<{
  guildId: string | undefined;
  busca: string;
  onEmoji: (texto: string) => void;
}> = ({ guildId, busca, onEmoji }) => {
  const { data } = useFindExpressions(guildId);
  const [grupos, setGrupos] = useState<GrupoDeEmoji[] | null>(null);
  const [recentes, setRecentes] = useState<string[]>(() => emojisRecentes());

  useEffect(() => {
    void carregarEmojis().then(setGrupos);
  }, []);

  const escolher = (texto: string, unicode: boolean) => {
    if (unicode) {
      registrarUso(texto);
      setRecentes(emojisRecentes());
    }
    onEmoji(texto);
  };

  const filtrados = useMemo(() => {
    if (!grupos) return [];
    if (!busca.trim()) return grupos;

    return grupos
      .map((g) => ({ ...g, emojis: g.emojis.filter((e) => combina(e, busca)) }))
      .filter((g) => g.emojis.length);
  }, [grupos, busca]);

  const doServidor = data.emojis.filter((e) =>
    busca.trim() ? e.name.toLowerCase().includes(busca.toLowerCase().trim()) : true,
  );

  return (
    <>
      {doServidor.length > 0 && (
        <Secao titulo="Deste servidor">
          {doServidor.map((emoji: GuildEmoji) => (
            <button
              key={emoji.id}
              onClick={() => escolher(`:${emoji.name}:`, false)}
              title={`:${emoji.name}:`}
              className="flex size-9 items-center justify-center rounded transition hover:bg-surface-3"
            >
              <img src={emoji.url} alt={emoji.name} className="size-7 object-contain" />
            </button>
          ))}
        </Secao>
      )}

      {!busca.trim() && recentes.length > 0 && (
        <Secao titulo="Usados com frequência" icone={<Clock size={12} />}>
          {recentes.map((emoji) => (
            <BotaoEmoji key={emoji} emoji={emoji} onClick={() => escolher(emoji, true)} />
          ))}
        </Secao>
      )}

      {!grupos && <Carregando />}

      {filtrados.map((grupo) => (
        <Secao key={grupo.slug} titulo={grupo.titulo}>
          {grupo.emojis.map((item) => (
            <BotaoEmoji
              key={item.slug}
              emoji={item.emoji}
              title={item.name}
              onClick={() => escolher(item.emoji, true)}
            />
          ))}
        </Secao>
      ))}

      {grupos && !filtrados.length && !doServidor.length && (
        <p className="py-10 text-center text-sm text-ink-faint">Nenhum emoji com esse nome.</p>
      )}
    </>
  );
};

const BotaoEmoji: React.FC<{ emoji: string; title?: string; onClick: () => void }> = ({
  emoji,
  title,
  onClick,
}) => (
  <button
    onClick={onClick}
    title={title}
    className="flex size-9 items-center justify-center rounded text-2xl leading-none transition hover:bg-surface-3"
  >
    {emoji}
  </button>
);

const Secao: React.FC<{ titulo: string; icone?: React.ReactNode; children: React.ReactNode }> = ({
  titulo,
  icone,
  children,
}) => (
  <section className="mb-3">
    <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
      {icone}
      {titulo}
    </h4>
    <div className="flex flex-wrap gap-0.5">{children}</div>
  </section>
);

const Carregando: React.FC = () => (
  <div className="flex justify-center py-10 text-ink-faint">
    <Loader2 size={20} className="animate-spin" />
  </div>
);
