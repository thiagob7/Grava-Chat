import React, { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import type { Sticker } from "@gravae/shared";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import type { GifModel } from "~/@core/application/requests/gif/gifs";
import { TabEmoji } from "~/features/expressao/components/seletor/AbaEmoji";
import { TabStickers } from "~/features/expressao/components/seletor/AbaFigurinhas";
import { TabGifs } from "~/features/expressao/components/seletor/AbaGifs";
import { bareField, fieldGroup } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useServerSettingsStore } from "~/features/servidor/stores/server-settings-store";
import { useTranslation } from "~/traducao";
import { flx } from "~/lib/compat-de-tema";

export type Tab = "gifs" | "figurinhas" | "emoji";

interface ExpressionPickerProps {
  guildId: string | undefined;
  initialTab?: Tab;
  mode?: "mensagem" | "reacao";
  onEmoji: (text: string) => void;
  onSticker?: (sticker: Sticker) => void;
  onGif?: (gif: GifModel) => void;
  onClose?: () => void;
}

const TABS: { id: Tab; label: string; placeholder: string }[] = [
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
  initialTab = "emoji",
  mode = "mensagem",
  onEmoji,
  onSticker,
  onGif,
  onClose,
}) => {
  const { t } = useTranslation();
  const soEmoji = mode === "reacao";
  const [tab, setTab] = useState<Tab>(soEmoji ? "emoji" : initialTab);
  const [search, setSearch] = useState("");

  useEffect(() => setSearch(""), [tab]);

  const openSettings = useServerSettingsStore((s) => s.open);

  const { data: server } = useFindGuild(guildId);

  const canAdd = Boolean(
    server?.permissions.some((p) =>
      ["ADMINISTRATOR", "MANAGE_EXPRESSIONS", "CREATE_EXPRESSIONS"].includes(p),
    ),
  );

  const addEmoji = () => {
    if (!guildId) return;
    onClose?.();
    openSettings(guildId, "emoji");
  };

  const hintKey = soEmoji
    ? "conversa.expressoes.buscarReacao"
    : TABS.find((a) => a.id === tab)?.placeholder;
  const placeholder = hintKey ? t(hintKey) : undefined;

  return (
    <div data-gc="expressao.expression-picker.div" {...flx("expressionPicker", "flex h-[min(440px,70svh)] w-[min(460px,92vw)] flex-col overflow-hidden rounded-lg bg-surface-1 shadow-2xl")}>
      {!soEmoji && (
        <nav data-gc="expressao.expression-picker.nav" className="flex shrink-0 items-center gap-1 p-3 pb-2">
          {TABS.map((item) => (
            <button data-gc="expressao.expression-picker.button"
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition",
                tab === item.id ? "bg-surface-4 text-ink" : "text-ink-muted hover:bg-surface-3",
              )}
            >
              {t(item.label)}
            </button>
          ))}

          {tab === "emoji" && canAdd && (
            <button data-gc="expressao.expression-picker.button.add-emoji"
              type="button"
              onClick={addEmoji}
              className="ml-auto flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink"
            >
              <Plus data-gc="expressao.expression-picker.plus" size={14} />
              {t("conversa.expressoes.adicionarEmoji")}
            </button>
          )}
        </nav>
      )}

      <div data-gc="expressao.expression-picker.div--2" className={cn("shrink-0 px-3 pb-2", soEmoji && "pt-3")}>
        <div data-gc="expressao.expression-picker.div--3" className={fieldGroup}>
          <Search data-gc="expressao.expression-picker.search" size={14} className="shrink-0 text-ink-faint" />

          <input data-gc="expressao.expression-picker.input"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className={bareField}
          />

          {search && (
            <button data-gc="expressao.expression-picker.button--2"
              type="button"
              onClick={() => setSearch("")}
              aria-label={t("conversa.expressoes.limparBusca")}
              className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
            >
              <X data-gc="expressao.expression-picker.x" size={14} />
            </button>
          )}
        </div>
      </div>

      <div data-gc="expressao.expression-picker.div--4" className="flex min-h-0 flex-1 flex-col">
        {tab === "gifs" && onGif && <TabGifs data-gc="expressao.expression-picker.tab-gifs.on-gif" search={search} onGif={onGif} onSearch={setSearch} />}

        {tab === "figurinhas" && onSticker && (
          <TabStickers data-gc="expressao.expression-picker.tab-stickers.on-sticker" guildId={guildId} search={search} onSticker={onSticker} />
        )}

        {tab === "emoji" && <TabEmoji data-gc="expressao.expression-picker.tab-emoji.on-emoji" guildId={guildId} search={search} onEmoji={onEmoji} />}
      </div>
    </div>
  );
};
