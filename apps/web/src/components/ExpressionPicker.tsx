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
import { useTranslation } from "~/traducao";

export type Aba = "gifs" | "figurinhas" | "emoji";

interface ExpressionPickerProps {
  guildId: string | undefined;
  abaInicial?: Aba;
  modo?: "mensagem" | "reacao";
  onEmoji: (texto: string) => void;
  onSticker?: (sticker: Sticker) => void;
  onGif?: (gif: GifModel) => void;
  onFechar?: () => void;
}

const ABAS: { id: Aba; label: string; placeholder: string }[] = [
  { id: "gifs", label: "conversa.expressoes.gifs", placeholder: "conversa.expressoes.buscarGifs" },
  {
    id: "figurinhas",
    label: "conversa.expressoes.figurinha",
    placeholder: "conversa.expressoes.buscarFigurinha",
  },
  { id: "emoji", label: "comum.emoji", placeholder: "conversa.expressoes.buscarEmoji" },
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
  const { t } = useTranslation();
  const soEmoji = modo === "reacao";
  const [aba, setAba] = useState<Aba>(soEmoji ? "emoji" : abaInicial);
  const [busca, setBusca] = useState("");

  useEffect(() => setBusca(""), [aba]);

  const abrirConfiguracoes = useServerSettingsStore((s) => s.abrir);

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

  const chaveDaDica = soEmoji
    ? "conversa.expressoes.buscarReacao"
    : ABAS.find((a) => a.id === aba)?.placeholder;
  const placeholder = chaveDaDica ? t(chaveDaDica) : undefined;

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
              {t(item.label)}
            </button>
          ))}

          {aba === "emoji" && podeAdicionar && (
            <button
              type="button"
              onClick={adicionarEmoji}
              className="ml-auto flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink"
            >
              <Plus size={14} />
              {t("conversa.expressoes.adicionarEmoji")}
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
              aria-label={t("conversa.expressoes.limparBusca")}
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
