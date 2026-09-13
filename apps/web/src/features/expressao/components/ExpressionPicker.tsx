import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Sticker } from "@gravae/shared";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import type { GifModel } from "~/@core/application/requests/gif/gifs";
import { TabEmoji } from "~/features/expressao/components/seletor/AbaEmoji";
import { TabStickers } from "~/features/expressao/components/seletor/AbaFigurinhas";
import { TabGifs } from "~/features/expressao/components/seletor/AbaGifs";
import { Button } from "~/components/ui/button";
import { SearchField } from "~/components/ui/input";
import { TabButton } from "~/components/ui/nav-item";
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
            <TabButton data-gc="expressao.expression-picker.tab-button"
              key={item.id}
              active={tab === item.id}
              onClick={() => setTab(item.id)}
              className="px-3 py-1.5 font-normal"
            >
              {t(item.label)}
            </TabButton>
          ))}

          {tab === "emoji" && canAdd && (
            <Button data-gc="expressao.expression-picker.button.add-emoji"
              variant="ghost"
              size="xs"
              className="ml-auto gap-1 py-1.5 text-sm font-normal"
              onClick={addEmoji}
            >
              <Plus data-gc="expressao.expression-picker.plus" size={14} />
              {t("conversa.expressoes.adicionarEmoji")}
            </Button>
          )}
        </nav>
      )}

      <div data-gc="expressao.expression-picker.div--2" className={cn("shrink-0 px-3 pb-2", soEmoji && "pt-3")}>
        <SearchField data-gc="expressao.expression-picker.search-field"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </div>

      <div data-gc="expressao.expression-picker.div--3" className="flex min-h-0 flex-1 flex-col">
        {tab === "gifs" && onGif && <TabGifs data-gc="expressao.expression-picker.tab-gifs.on-gif" search={search} onGif={onGif} onSearch={setSearch} />}

        {tab === "figurinhas" && onSticker && (
          <TabStickers data-gc="expressao.expression-picker.tab-stickers.on-sticker" guildId={guildId} search={search} onSticker={onSticker} />
        )}

        {tab === "emoji" && <TabEmoji data-gc="expressao.expression-picker.tab-emoji.on-emoji" guildId={guildId} search={search} onEmoji={onEmoji} />}
      </div>
    </div>
  );
};
