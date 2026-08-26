import React, { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import type { Sticker } from "@gravae/shared";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import type { GifModel } from "~/@core/application/requests/gif/gifs";
import { AbaEmoji } from "~/components/expression-picker/AbaEmoji";
import { AbaFigurinhas } from "~/components/expression-picker/AbaFigurinhas";
import { AbaGifs } from "~/components/expression-picker/AbaGifs";
import { campoNu, grupoDeCampo } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useServerSettingsStore } from "~/stores/server-settings-store";

export type Aba = "gifs" | "figurinhas" | "emoji";

interface ExpressionPickerProps {
  guildId: string | undefined;
  abaInicial?: Aba;
  /**
   * "reacao" tira as abas e deixa só o emoji: não dá pra reagir a uma
   * mensagem com um GIF nem com uma figurinha, então oferecê-los seria
   * prometer o que não existe.
   */
  modo?: "mensagem" | "reacao";
  onEmoji: (texto: string) => void;
  onSticker?: (sticker: Sticker) => void;
  onGif?: (gif: GifModel) => void;
  /// Fechar o popover que abriga o seletor. Só o "Adicionar emoji" usa: sair
  /// daqui para um modal com o seletor ainda aberto por cima fica confuso.
  onFechar?: () => void;
}

const ABAS: { id: Aba; label: string; placeholder: string }[] = [
  { id: "gifs", label: "GIFs", placeholder: "Buscar Klipy" },
  { id: "figurinhas", label: "Figurinha", placeholder: "Encontre a figurinha perfeita" },
  { id: "emoji", label: "Emoji", placeholder: "Encontre o emoji perfeito" },
];

export const ExpressionPicker: React.FC<ExpressionPickerProps> = ({
  guildId,
  abaInicial = "emoji",
  modo = "mensagem",
  onEmoji,
  onSticker,
  onGif,
  onFechar,
}) => {
  const soEmoji = modo === "reacao";
  const [aba, setAba] = useState<Aba>(soEmoji ? "emoji" : abaInicial);
  const [busca, setBusca] = useState("");

  useEffect(() => setBusca(""), [aba]);

  const abrirConfiguracoes = useServerSettingsStore((s) => s.abrir);

  /*
    O atalho para subir um emoji novo.

    Aparece só no servidor em que você está — a lista do seletor mostra todos
    os seus, mas as configurações que o botão abre são as deste. E só para
    quem pode: oferecer o caminho e esbarrar na permissão lá dentro é pior do
    que não oferecer.

    A consulta já está em cache (`staleTime: Infinity`); aqui ela não custa
    ida à rede.
  */
  const { data: servidor } = useFindGuild(guildId);

  const podeAdicionar = Boolean(
    servidor?.permissions.some((p) =>
      ["ADMINISTRATOR", "MANAGE_EXPRESSIONS", "CREATE_EXPRESSIONS"].includes(p),
    ),
  );

  const adicionarEmoji = () => {
    if (!guildId) return;
    onFechar?.();
    abrirConfiguracoes(guildId, "emoji");
  };

  const placeholder = soEmoji
    ? "Encontre a reação perfeita"
    : ABAS.find((a) => a.id === aba)?.placeholder;

  return (
    <div className="flex h-[440px] w-[460px] flex-col overflow-hidden rounded-lg bg-surface-1 shadow-2xl">
      {!soEmoji && (
        <nav className="flex shrink-0 items-center gap-1 p-3 pb-2">
          {ABAS.map((item) => (
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

          {aba === "emoji" && podeAdicionar && (
            <button
              type="button"
              onClick={adicionarEmoji}
              className="ml-auto flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink"
            >
              <Plus size={14} />
              Adicionar emoji
            </button>
          )}
        </nav>
      )}

      <div className={cn("shrink-0 px-3 pb-2", soEmoji && "pt-3")}>
        <div className={grupoDeCampo}>
          <Search size={14} className="shrink-0 text-ink-faint" />

          <input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={placeholder}
            className={campoNu}
          />

          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar a busca"
              className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {aba === "gifs" && onGif && <AbaGifs busca={busca} onGif={onGif} onBusca={setBusca} />}

        {aba === "figurinhas" && onSticker && (
          <AbaFigurinhas guildId={guildId} busca={busca} onSticker={onSticker} />
        )}

        {aba === "emoji" && <AbaEmoji guildId={guildId} busca={busca} onEmoji={onEmoji} />}
      </div>
    </div>
  );
};
