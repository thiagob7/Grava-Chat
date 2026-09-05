import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import type { Sticker } from "@gravae/shared";

import {
  BarraLateral,
  IconeDoServidor,
  Rodape,
  Secao,
  Vazio,
  type AtalhoDaBarra,
} from "~/features/expressao/components/seletor/pecas";
import { useColapso } from "~/features/expressao/components/seletor/use-colapso";
import { useSecoes } from "~/features/expressao/components/seletor/use-secoes";
import { useServidores } from "~/features/expressao/components/seletor/use-servidores";
import { figurinhasRecentes, registrarFigurinha } from "~/features/expressao/lib/expressoes-recentes";

type ComAutor = Sticker & { createdBy: { displayName: string } | null };

interface Apontada {
  figurinha: ComAutor;
  servidor: { nome: string; iconUrl: string | null };
}

export const AbaFigurinhas: React.FC<{
  guildId: string | undefined;
  busca: string;
  onSticker: (s: Sticker) => void;
}> = ({ guildId, busca, onSticker }) => {
  const servidores = useServidores(guildId);
  const [recentes, setRecentes] = useState<string[]>(() => figurinhasRecentes());
  const [apontada, setApontada] = useState<Apontada | null>(null);
  const { container, registrar, irPara, aoRolar, ativo } = useSecoes();
  const { fechadas, alternar, abrir } = useColapso("figurinhas");

  useEffect(aoRolar, [fechadas, aoRolar]);

  const irEAbrir = (id: string) => {
    abrir(id);
    irPara(id);
  };

  const termo = busca.toLowerCase().trim();

  const combina = (s: Sticker) =>
    s.name.toLowerCase().includes(termo) || s.relatedEmoji.includes(termo);

  const comFigurinha = servidores
    .map((s) => ({ ...s, figurinhas: termo ? s.figurinhas.filter(combina) : s.figurinhas }))
    .filter((s) => s.figurinhas.length);

  const usadas = termo
    ? []
    : recentes.flatMap((id) => {
        for (const servidor of comFigurinha) {
          const achada = servidor.figurinhas.find((f) => f.id === id);
          if (achada) return [{ figurinha: achada, servidor }];
        }
        return [];
      });

  const escolher = (figurinha: ComAutor) => {
    registrarFigurinha(figurinha.id);
    setRecentes(figurinhasRecentes());
    onSticker(figurinha);
  };

  if (!servidores.some((s) => s.figurinhas.length)) {
    return (
      <div data-gc="expressao.seletor.aba-figurinhas.div" className="flex min-h-0 flex-1 flex-col">
        <Vazio data-gc="expressao.seletor.aba-figurinhas.vazio">
          Nenhum dos seus servidores tem figurinhas. Quem gerencia expressões pode subir até 5 em
          Configurações do servidor.
        </Vazio>
      </div>
    );
  }

  const atalhos: AtalhoDaBarra[] = [
    ...(usadas.length
      ? [{ id: "recentes", titulo: "Utilizadas com frequência", icone: <Clock data-gc="expressao.seletor.aba-figurinhas.clock" size={18} /> }]
      : []),
    ...comFigurinha.map((s) => ({
      id: `servidor:${s.id}`,
      titulo: s.nome,
      icone: <IconeDoServidor data-gc="expressao.seletor.aba-figurinhas.icone-do-servidor" nome={s.nome} iconUrl={s.iconUrl} />,
    })),
  ];

  return (
    <div data-gc="expressao.seletor.aba-figurinhas.div--2" className="flex min-h-0 flex-1 flex-col">
      <div data-gc="expressao.seletor.aba-figurinhas.div--3" className="flex min-h-0 flex-1">
        <BarraLateral data-gc="expressao.seletor.aba-figurinhas.barra-lateral.ir-eabrir" atalhos={atalhos} ativo={ativo} onIr={irEAbrir} />

        <div data-gc="expressao.seletor.aba-figurinhas.div.ao-rolar"
          ref={container}
          onScroll={aoRolar}
          onMouseLeave={() => setApontada(null)}
          className="relative min-h-0 flex-1 overflow-y-auto px-3 py-2"
        >
          {usadas.length > 0 && (
            <div data-gc="expressao.seletor.aba-figurinhas.div--4" ref={registrar("recentes")}>
              <Secao data-gc="expressao.seletor.aba-figurinhas.secao"
                titulo="Utilizadas com frequência"
                icone={<Clock data-gc="expressao.seletor.aba-figurinhas.clock--2" size={12} />}
                fechada={fechadas.has("recentes")}
                onAlternar={() => alternar("recentes")}
              >
                <Grade data-gc="expressao.seletor.aba-figurinhas.grade.escolher" itens={usadas} onEscolher={escolher} onApontar={setApontada} />
              </Secao>
            </div>
          )}

          {comFigurinha.map((servidor) => (
            <div data-gc="expressao.seletor.aba-figurinhas.div--5" key={servidor.id} ref={registrar(`servidor:${servidor.id}`)}>
              <Secao data-gc="expressao.seletor.aba-figurinhas.secao--2"
                titulo={servidor.nome}
                icone={
                  <IconeDoServidor data-gc="expressao.seletor.aba-figurinhas.icone-do-servidor--2"
                    nome={servidor.nome}
                    iconUrl={servidor.iconUrl}
                    className="size-4"
                  />
                }
                fechada={fechadas.has(`servidor:${servidor.id}`)}
                onAlternar={() => alternar(`servidor:${servidor.id}`)}
              >
                <Grade data-gc="expressao.seletor.aba-figurinhas.grade.escolher--2"
                  itens={servidor.figurinhas.map((figurinha) => ({ figurinha, servidor }))}
                  onEscolher={escolher}
                  onApontar={setApontada}
                />
              </Secao>
            </div>
          ))}

          {!comFigurinha.length && <Vazio data-gc="expressao.seletor.aba-figurinhas.vazio--2">Nenhuma figurinha com esse nome.</Vazio>}
        </div>
      </div>

      <Rodape data-gc="expressao.seletor.aba-figurinhas.rodape"
        amostra={
          apontada && (
            <img data-gc="expressao.seletor.aba-figurinhas.img" src={apontada.figurinha.url} alt="" className="size-7 rounded object-contain" />
          )
        }
        titulo={apontada?.figurinha.name}
        detalhe={apontada ? `de ${apontada.servidor.nome}` : undefined}
        direita={
          apontada && (
            <IconeDoServidor data-gc="expressao.seletor.aba-figurinhas.icone-do-servidor--3"
              nome={apontada.servidor.nome}
              iconUrl={apontada.servidor.iconUrl}
              className="size-6"
            />
          )
        }
        vazio="Passe o mouse para ver o nome"
      />
    </div>
  );
};

const Grade: React.FC<{
  itens: Apontada[];
  onEscolher: (s: ComAutor) => void;
  onApontar: (a: Apontada) => void;
}> = ({ itens, onEscolher, onApontar }) => (
  <div data-gc="expressao.seletor.aba-figurinhas.div--6" className="grid grid-cols-3 gap-2">
    {itens.map(({ figurinha, servidor }) => (
      <button data-gc="expressao.seletor.aba-figurinhas.button"
        key={figurinha.id}
        onClick={() => onEscolher(figurinha)}
        onMouseEnter={() => onApontar({ figurinha, servidor })}
        onFocus={() => onApontar({ figurinha, servidor })}
        className="aspect-square rounded-lg p-1.5 transition hover:bg-surface-3"
      >
        <img data-gc="expressao.seletor.aba-figurinhas.img--2"
          src={figurinha.url}
          alt={figurinha.name}
          loading="lazy"
          className="size-full object-contain"
        />
      </button>
    ))}
  </div>
);
