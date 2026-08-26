import React, { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Flag,
  Hand,
  Hash,
  Leaf,
  Lightbulb,
  Pizza,
  Plane,
  Smile,
  Trophy,
} from "lucide-react";

import {
  BarraLateral,
  Carregando,
  IconeDoServidor,
  Rodape,
  Secao,
  Vazio,
  type AtalhoDaBarra,
} from "~/components/expression-picker/pecas";
import { useColapso } from "~/components/expression-picker/use-colapso";
import { useSecoes } from "~/components/expression-picker/use-secoes";
import { useServidores } from "~/components/expression-picker/use-servidores";
import {
  carregarEmojis,
  combina,
  emojisRecentes,
  registrarUso,
  type GrupoDeEmoji,
} from "~/lib/emoji";

const ICONES: Record<string, React.ReactNode> = {
  smileys_emotion: <Smile size={18} />,
  people_body: <Hand size={18} />,
  animals_nature: <Leaf size={18} />,
  food_drink: <Pizza size={18} />,
  travel_places: <Plane size={18} />,
  activities: <Trophy size={18} />,
  objects: <Lightbulb size={18} />,
  symbols: <Hash size={18} />,
  flags: <Flag size={18} />,
};

interface Apontado {
  amostra: React.ReactNode;
  titulo: string;
  detalhe?: string;
  direita?: React.ReactNode;
}

export const AbaEmoji: React.FC<{
  guildId: string | undefined;
  busca: string;
  onEmoji: (texto: string) => void;
}> = ({ guildId, busca, onEmoji }) => {
  const servidores = useServidores(guildId);
  const [grupos, setGrupos] = useState<GrupoDeEmoji[] | null>(null);
  const [recentes, setRecentes] = useState<string[]>(() => emojisRecentes());
  const [apontado, setApontado] = useState<Apontado | null>(null);
  const { container, registrar, irPara, aoRolar, ativo } = useSecoes();
  const { fechadas, alternar, abrir } = useColapso("emoji");

  useEffect(() => {
    void carregarEmojis().then(setGrupos);
  }, []);

  /// Fechar uma seção encurta tudo que vem depois dela, e o navegador não
  /// dispara `scroll` por causa disso. Sem recontar aqui, a coluna da
  /// esquerda continua acesa na seção errada.
  useEffect(aoRolar, [fechadas, aoRolar]);

  /// O atalho existe para mostrar a seção. Levar até um cabeçalho fechado
  /// pareceria um clique que não fez nada — então ele abre no caminho. O
  /// `offsetTop` do alvo não muda com a própria abertura (o que cresce fica
  /// abaixo do cabeçalho), então a ordem aqui não importa.
  const irEAbrir = (id: string) => {
    abrir(id);
    irPara(id);
  };

  const escolher = (texto: string, unicode: boolean) => {
    if (unicode) {
      registrarUso(texto);
      setRecentes(emojisRecentes());
    }
    onEmoji(texto);
  };

  const termo = busca.trim();
  const termoMinusculo = termo.toLowerCase();

  const filtrados = useMemo(() => {
    if (!grupos) return [];
    if (!termo) return grupos;

    return grupos
      .map((g) => ({ ...g, emojis: g.emojis.filter((e) => combina(e, termo)) }))
      .filter((g) => g.emojis.length);
  }, [grupos, termo]);

  /// Um servidor sem emoji que caiba na busca some da lista e da coluna — não
  /// adianta um atalho que leva a um vazio.
  const comEmoji = servidores
    .map((s) => ({
      ...s,
      emojis: termo
        ? s.emojis.filter((e) => e.name.toLowerCase().includes(termoMinusculo))
        : s.emojis,
    }))
    .filter((s) => s.emojis.length);

  const mostraRecentes = !termo && recentes.length > 0;

  const atalhos: AtalhoDaBarra[] = [
    ...(mostraRecentes
      ? [{ id: "recentes", titulo: "Usados com frequência", icone: <Clock size={18} /> }]
      : []),
    ...comEmoji.map((s) => ({
      id: `servidor:${s.id}`,
      titulo: s.nome,
      icone: <IconeDoServidor nome={s.nome} iconUrl={s.iconUrl} />,
    })),
    ...filtrados.map((g) => ({
      id: g.slug,
      titulo: g.titulo,
      icone: ICONES[g.slug] ?? <Smile size={18} />,
    })),
  ];

  const nada = Boolean(grupos) && !filtrados.length && !comEmoji.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <BarraLateral atalhos={atalhos} ativo={ativo} onIr={irEAbrir} />

        <div
          ref={container}
          onScroll={aoRolar}
          onMouseLeave={() => setApontado(null)}
          className="relative min-h-0 flex-1 overflow-y-auto px-3 py-2"
        >
          {mostraRecentes && (
            <div ref={registrar("recentes")}>
              <Secao
                titulo="Usados com frequência"
                icone={<Clock size={12} />}
                fechada={fechadas.has("recentes")}
                onAlternar={() => alternar("recentes")}
              >
                <div className="flex flex-wrap gap-0.5">
                  {recentes.map((emoji) => (
                    <BotaoEmoji
                      key={emoji}
                      emoji={emoji}
                      onClick={() => escolher(emoji, true)}
                      onApontar={() => setApontado({ amostra: emoji, titulo: emoji })}
                    />
                  ))}
                </div>
              </Secao>
            </div>
          )}

          {comEmoji.map((servidor) => (
            <div key={servidor.id} ref={registrar(`servidor:${servidor.id}`)}>
              <Secao
                titulo={servidor.nome}
                icone={
                  <IconeDoServidor
                    nome={servidor.nome}
                    iconUrl={servidor.iconUrl}
                    className="size-4"
                  />
                }
                fechada={fechadas.has(`servidor:${servidor.id}`)}
                onAlternar={() => alternar(`servidor:${servidor.id}`)}
              >
                <div className="flex flex-wrap gap-0.5">
                  {servidor.emojis.map((emoji) => (
                    <button
                      key={emoji.id}
                      onClick={() => escolher(`:${emoji.name}:`, false)}
                      onMouseEnter={() =>
                        setApontado({
                          amostra: (
                            <img src={emoji.url} alt="" className="size-7 object-contain" />
                          ),
                          titulo: `:${emoji.name}:`,
                          detalhe: `de ${servidor.nome}`,
                          direita: (
                            <IconeDoServidor
                              nome={servidor.nome}
                              iconUrl={servidor.iconUrl}
                              className="size-6"
                            />
                          ),
                        })
                      }
                      className="flex size-9 items-center justify-center rounded transition hover:bg-surface-3"
                    >
                      <img src={emoji.url} alt={emoji.name} className="size-7 object-contain" />
                    </button>
                  ))}
                </div>
              </Secao>
            </div>
          ))}

          {!grupos && <Carregando />}

          {filtrados.map((grupo) => (
            <div key={grupo.slug} ref={registrar(grupo.slug)}>
              <Secao
                titulo={grupo.titulo}
                fechada={fechadas.has(grupo.slug)}
                onAlternar={() => alternar(grupo.slug)}
              >
                <div className="flex flex-wrap gap-0.5">
                  {grupo.emojis.map((item) => (
                    <BotaoEmoji
                      key={item.slug}
                      emoji={item.emoji}
                      onClick={() => escolher(item.emoji, true)}
                      onApontar={() =>
                        setApontado({
                          amostra: item.emoji,
                          titulo: `:${item.slug}:`,
                          detalhe: item.name,
                        })
                      }
                    />
                  ))}
                </div>
              </Secao>
            </div>
          ))}

          {nada && <Vazio>Nenhum emoji com esse nome.</Vazio>}
        </div>
      </div>

      <Rodape
        amostra={apontado?.amostra}
        titulo={apontado?.titulo}
        detalhe={apontado?.detalhe}
        direita={apontado?.direita}
        vazio="Passe o mouse para ver o nome"
      />
    </div>
  );
};

const BotaoEmoji: React.FC<{ emoji: string; onClick: () => void; onApontar: () => void }> = ({
  emoji,
  onClick,
  onApontar,
}) => (
  <button
    onClick={onClick}
    onMouseEnter={onApontar}
    onFocus={onApontar}
    className="flex size-9 items-center justify-center rounded text-2xl leading-none transition hover:bg-surface-3"
  >
    {emoji}
  </button>
);
