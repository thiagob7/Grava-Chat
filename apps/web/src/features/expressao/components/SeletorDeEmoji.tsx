import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Clock, Loader2, Search } from "lucide-react";

import { Emoji } from "~/features/expressao/components/Emoji";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  carregarEmojis,
  combina,
  emojisRecentes,
  registrarUso,
  type GrupoDeEmoji,
} from "~/features/expressao/lib/emoji";

interface SeletorDeEmojiProps {
  children: ReactNode;
  onEscolher: (emoji: string) => void;
}

export const SeletorDeEmoji: React.FC<SeletorDeEmojiProps> = ({
  children,
  onEscolher,
}) => {
  const [aberto, setAberto] = useState(false);

  return (
    <Popover data-gc="expressao.seletor-de-emoji.popover.set-aberto" open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger data-gc="expressao.seletor-de-emoji.popover-trigger" asChild>{children}</PopoverTrigger>

      <PopoverContent data-gc="expressao.seletor-de-emoji.popover-content" side="bottom" align="start" portal={false} className="w-80 p-0">
        {aberto && (
          <Grade data-gc="expressao.seletor-de-emoji.grade"
            onEscolher={(emoji) => {
              registrarUso(emoji);
              onEscolher(emoji);
              setAberto(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};

const Grade: React.FC<{ onEscolher: (emoji: string) => void }> = ({
  onEscolher,
}) => {
  const [grupos, setGrupos] = useState<GrupoDeEmoji[] | null>(null);
  const [busca, setBusca] = useState("");
  const recentes = useMemo(() => emojisRecentes(), []);

  useEffect(() => {
    void carregarEmojis().then(setGrupos);
  }, []);

  const filtrados = useMemo(() => {
    if (!grupos) return [];
    if (!busca.trim()) return grupos;

    return grupos
      .map((g) => ({ ...g, emojis: g.emojis.filter((e) => combina(e, busca)) }))
      .filter((g) => g.emojis.length);
  }, [grupos, busca]);

  return (
    <div data-gc="expressao.seletor-de-emoji.div" className="flex max-h-80 flex-col">
      <div data-gc="expressao.seletor-de-emoji.div--2" className="flex shrink-0 items-center gap-2 border-b border-line px-3">
        <Search data-gc="expressao.seletor-de-emoji.search" size={14} className="shrink-0 text-ink-faint" />
        <Input data-gc="expressao.seletor-de-emoji.input"
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar emoji"
          className="bg-transparent px-0 focus:ring-0"
        />
      </div>

      <div data-gc="expressao.seletor-de-emoji.div--3" className="min-h-0 flex-1 overflow-y-auto p-2">
        {!grupos && (
          <div data-gc="expressao.seletor-de-emoji.div--4" className="flex justify-center py-10 text-ink-faint">
            <Loader2 data-gc="expressao.seletor-de-emoji.loader2" size={20} className="animate-spin" />
          </div>
        )}

        {!busca.trim() && recentes.length > 0 && (
          <Secao data-gc="expressao.seletor-de-emoji.secao" titulo="Usados com frequência" icone={<Clock data-gc="expressao.seletor-de-emoji.clock" size={12} />}>
            {recentes.map((emoji) => (
              <Botao data-gc="expressao.seletor-de-emoji.botao"
                key={emoji}
                emoji={emoji}
                onClick={() => onEscolher(emoji)}
              />
            ))}
          </Secao>
        )}

        {filtrados.map((grupo) => (
          <Secao data-gc="expressao.seletor-de-emoji.secao--2" key={grupo.slug} titulo={grupo.titulo}>
            {grupo.emojis.map((item) => (
              <Botao data-gc="expressao.seletor-de-emoji.botao--2"
                key={item.slug}
                emoji={item.emoji}
                title={item.name}
                onClick={() => onEscolher(item.emoji)}
              />
            ))}
          </Secao>
        ))}

        {grupos && !filtrados.length && (
          <p data-gc="expressao.seletor-de-emoji.p" className="py-10 text-center text-sm text-ink-faint">
            Nenhum emoji com esse nome.
          </p>
        )}
      </div>
    </div>
  );
};

const Secao: React.FC<{
  titulo: string;
  icone?: ReactNode;
  children: ReactNode;
}> = ({ titulo, icone, children }) => (
  <section data-gc="expressao.seletor-de-emoji.section" className="mb-2">
    <p data-gc="expressao.seletor-de-emoji.p--2" className="mb-1 flex items-center gap-1 px-1 text-11 font-semibold uppercase tracking-wide text-ink-faint">
      {icone} {titulo}
    </p>
    <div data-gc="expressao.seletor-de-emoji.div--5" className="grid grid-cols-8 gap-0.5">{children}</div>
  </section>
);

const Botao: React.FC<{
  emoji: string;
  title?: string;
  onClick: () => void;
}> = ({ emoji, title, onClick }) => (
  <button data-gc="expressao.seletor-de-emoji.button.on-click"
    onClick={onClick}
    title={title}
    className="flex size-8 items-center justify-center rounded transition hover:bg-surface-3"
  >
    <Emoji data-gc="expressao.seletor-de-emoji.emoji" emoji={emoji} className="size-6" />
  </button>
);
