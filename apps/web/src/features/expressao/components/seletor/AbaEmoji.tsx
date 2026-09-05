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
} from "~/features/expressao/components/seletor/pecas";
import { Emoji } from "~/features/expressao/components/Emoji";
import { useColapso } from "~/features/expressao/components/seletor/use-colapso";
import { useSecoes } from "~/features/expressao/components/seletor/use-secoes";
import { useServidores } from "~/features/expressao/components/seletor/use-servidores";
import {
  carregarEmojis,
  combina,
  emojisRecentes,
  registrarUso,
  type GrupoDeEmoji,
} from "~/features/expressao/lib/emoji";

const ICONES: Record<string, React.ReactNode> = {
  smileys_emotion: <Smile data-gc="expressao.seletor.aba-emoji.smile" size={18} />,
  people_body: <Hand data-gc="expressao.seletor.aba-emoji.hand" size={18} />,
  animals_nature: <Leaf data-gc="expressao.seletor.aba-emoji.leaf" size={18} />,
  food_drink: <Pizza data-gc="expressao.seletor.aba-emoji.pizza" size={18} />,
  travel_places: <Plane data-gc="expressao.seletor.aba-emoji.plane" size={18} />,
  activities: <Trophy data-gc="expressao.seletor.aba-emoji.trophy" size={18} />,
  objects: <Lightbulb data-gc="expressao.seletor.aba-emoji.lightbulb" size={18} />,
  symbols: <Hash data-gc="expressao.seletor.aba-emoji.hash" size={18} />,
  flags: <Flag data-gc="expressao.seletor.aba-emoji.flag" size={18} />,
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

  useEffect(aoRolar, [fechadas, aoRolar]);

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
      ? [{ id: "recentes", titulo: "Usados com frequência", icone: <Clock data-gc="expressao.seletor.aba-emoji.clock" size={18} /> }]
      : []),
    ...comEmoji.map((s) => ({
      id: `servidor:${s.id}`,
      titulo: s.nome,
      icone: <IconeDoServidor data-gc="expressao.seletor.aba-emoji.icone-do-servidor" nome={s.nome} iconUrl={s.iconUrl} />,
    })),
    ...filtrados.map((g) => ({
      id: g.slug,
      titulo: g.titulo,
      icone: ICONES[g.slug] ?? <Smile data-gc="expressao.seletor.aba-emoji.smile--2" size={18} />,
    })),
  ];

  const nada = Boolean(grupos) && !filtrados.length && !comEmoji.length;

  return (
    <div data-gc="expressao.seletor.aba-emoji.div" className="flex min-h-0 flex-1 flex-col">
      <div data-gc="expressao.seletor.aba-emoji.div--2" className="flex min-h-0 flex-1">
        <BarraLateral data-gc="expressao.seletor.aba-emoji.barra-lateral.ir-eabrir" atalhos={atalhos} ativo={ativo} onIr={irEAbrir} />

        <div data-gc="expressao.seletor.aba-emoji.div.ao-rolar"
          ref={container}
          onScroll={aoRolar}
          onMouseLeave={() => setApontado(null)}
          className="relative min-h-0 flex-1 overflow-y-auto px-3 py-2"
        >
          {mostraRecentes && (
            <div data-gc="expressao.seletor.aba-emoji.div--3" ref={registrar("recentes")}>
              <Secao data-gc="expressao.seletor.aba-emoji.secao"
                titulo="Usados com frequência"
                icone={<Clock data-gc="expressao.seletor.aba-emoji.clock--2" size={12} />}
                fechada={fechadas.has("recentes")}
                onAlternar={() => alternar("recentes")}
              >
                <div data-gc="expressao.seletor.aba-emoji.div--4" className="flex flex-wrap gap-0.5">
                  {recentes.map((emoji) => (
                    <BotaoEmoji data-gc="expressao.seletor.aba-emoji.botao-emoji"
                      key={emoji}
                      emoji={emoji}
                      onClick={() => escolher(emoji, true)}
                      onApontar={() => setApontado({ amostra: <Emoji data-gc="expressao.seletor.aba-emoji.emoji" emoji={emoji} className="size-7" />, titulo: emoji })}
                    />
                  ))}
                </div>
              </Secao>
            </div>
          )}

          {comEmoji.map((servidor) => (
            <div data-gc="expressao.seletor.aba-emoji.div--5" key={servidor.id} ref={registrar(`servidor:${servidor.id}`)}>
              <Secao data-gc="expressao.seletor.aba-emoji.secao--2"
                titulo={servidor.nome}
                icone={
                  <IconeDoServidor data-gc="expressao.seletor.aba-emoji.icone-do-servidor--2"
                    nome={servidor.nome}
                    iconUrl={servidor.iconUrl}
                    className="size-4"
                  />
                }
                fechada={fechadas.has(`servidor:${servidor.id}`)}
                onAlternar={() => alternar(`servidor:${servidor.id}`)}
              >
                <div data-gc="expressao.seletor.aba-emoji.div--6" className="flex flex-wrap gap-0.5">
                  {servidor.emojis.map((emoji) => (
                    <button data-gc="expressao.seletor.aba-emoji.button"
                      key={emoji.id}
                      onClick={() => escolher(`:${emoji.name}:`, false)}
                      onMouseEnter={() =>
                        setApontado({
                          amostra: (
                            <img data-gc="expressao.seletor.aba-emoji.img" src={emoji.url} alt="" className="size-7 object-contain" />
                          ),
                          titulo: `:${emoji.name}:`,
                          detalhe: `de ${servidor.nome}`,
                          direita: (
                            <IconeDoServidor data-gc="expressao.seletor.aba-emoji.icone-do-servidor--3"
                              nome={servidor.nome}
                              iconUrl={servidor.iconUrl}
                              className="size-6"
                            />
                          ),
                        })
                      }
                      className="flex size-9 items-center justify-center rounded transition hover:bg-surface-3"
                    >
                      <img data-gc="expressao.seletor.aba-emoji.img--2" src={emoji.url} alt={emoji.name} className="size-7 object-contain" />
                    </button>
                  ))}
                </div>
              </Secao>
            </div>
          ))}

          {!grupos && <Carregando data-gc="expressao.seletor.aba-emoji.carregando" />}

          {filtrados.map((grupo) => (
            <div data-gc="expressao.seletor.aba-emoji.div--7" key={grupo.slug} ref={registrar(grupo.slug)}>
              <Secao data-gc="expressao.seletor.aba-emoji.secao--3"
                titulo={grupo.titulo}
                fechada={fechadas.has(grupo.slug)}
                onAlternar={() => alternar(grupo.slug)}
              >
                <div data-gc="expressao.seletor.aba-emoji.div--8" className="flex flex-wrap gap-0.5">
                  {grupo.emojis.map((item) => (
                    <BotaoEmoji data-gc="expressao.seletor.aba-emoji.botao-emoji--2"
                      key={item.slug}
                      emoji={item.emoji}
                      onClick={() => escolher(item.emoji, true)}
                      onApontar={() =>
                        setApontado({
                          amostra: <Emoji data-gc="expressao.seletor.aba-emoji.emoji--2" emoji={item.emoji} className="size-7" />,
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

          {nada && <Vazio data-gc="expressao.seletor.aba-emoji.vazio">Nenhum emoji com esse nome.</Vazio>}
        </div>
      </div>

      <Rodape data-gc="expressao.seletor.aba-emoji.rodape"
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
  <button data-gc="expressao.seletor.aba-emoji.button.on-click"
    onClick={onClick}
    onMouseEnter={onApontar}
    onFocus={onApontar}
    className="flex size-9 items-center justify-center rounded transition hover:bg-surface-3"
  >
    <Emoji data-gc="expressao.seletor.aba-emoji.emoji--3" emoji={emoji} className="size-7" />
  </button>
);
