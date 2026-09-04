import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Clock, Loader2, Search } from "lucide-react";

import { Emoji } from "~/components/Emoji";
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
} from "~/lib/emoji";

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
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent side="bottom" align="start" portal={false} className="w-80 p-0">
        {aberto && (
          <Grade
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
    <div className="flex max-h-80 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3">
        <Search size={14} className="shrink-0 text-ink-faint" />
        <Input
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar emoji"
          className="bg-transparent px-0 focus:ring-0"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {!grupos && (
          <div className="flex justify-center py-10 text-ink-faint">
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}

        {!busca.trim() && recentes.length > 0 && (
          <Secao titulo="Usados com frequência" icone={<Clock size={12} />}>
            {recentes.map((emoji) => (
              <Botao
                key={emoji}
                emoji={emoji}
                onClick={() => onEscolher(emoji)}
              />
            ))}
          </Secao>
        )}

        {filtrados.map((grupo) => (
          <Secao key={grupo.slug} titulo={grupo.titulo}>
            {grupo.emojis.map((item) => (
              <Botao
                key={item.slug}
                emoji={item.emoji}
                title={item.name}
                onClick={() => onEscolher(item.emoji)}
              />
            ))}
          </Secao>
        ))}

        {grupos && !filtrados.length && (
          <p className="py-10 text-center text-sm text-ink-faint">
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
  <section className="mb-2">
    <p className="mb-1 flex items-center gap-1 px-1 text-11 font-semibold uppercase tracking-wide text-ink-faint">
      {icone} {titulo}
    </p>
    <div className="grid grid-cols-8 gap-0.5">{children}</div>
  </section>
);

const Botao: React.FC<{
  emoji: string;
  title?: string;
  onClick: () => void;
}> = ({ emoji, title, onClick }) => (
  <button
    onClick={onClick}
    title={title}
    className="flex size-8 items-center justify-center rounded transition hover:bg-surface-3"
  >
    <Emoji emoji={emoji} className="size-6" />
  </button>
);
