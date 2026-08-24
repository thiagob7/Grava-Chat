import React, { useEffect } from "react";
import type { Decoracao } from "@gravae/shared";

import {
  DECORACOES_DE_AVATAR,
  EFEITOS_DO_NOME,
  EFEITOS_DO_PERFIL,
  FONTES,
  MOLDURAS_DE_AVATAR,
  PATENTES_DE_PERFIL,
  PLACAS_DE_PERFIL,
} from "~/lib/cosmeticos/catalogo";
import { DecoracaoAnimada } from "~/components/DecoracaoAnimada";
import { PatenteAnimada } from "~/components/PatenteAnimada";
import { ehAnimada } from "~/lib/cosmeticos/animadas";
import { classeDoEnfeite, variaveisDoEnfeite } from "~/lib/cosmeticos/estilos";
import { carregarTodasAsFontes, familiaDaFonte } from "~/lib/cosmeticos/fontes";
import { estiloDoNome } from "~/lib/cosmeticos/nome";
import {
  CampoDeCor,
  GradeDeOpcoes,
} from "~/components/user-settings/perfil/campos";
import type { RascunhoDePerfil } from "~/components/user-settings/perfil/rascunho";
import { cn } from "~/lib/utils";

interface EnfeitesAbaProps {
  rascunho: RascunhoDePerfil;
  definir: <K extends keyof RascunhoDePerfil>(
    campo: K,
    valor: RascunhoDePerfil[K],
  ) => void;
}

/**
 * Os adornos: fonte e efeito do nome, decoração e moldura do avatar, efeito do
 * cartão, patente e placa do nome.
 *
 * Cada amostra da grade chama a MESMA função que o chat chama pra renderizar de
 * verdade. Não existe caminho onde a amostra e o resultado possam divergir —
 * seria o pior tipo de mentira aqui, porque é exatamente sobre a aparência que
 * a pessoa está decidindo.
 */
export const EnfeitesAba: React.FC<EnfeitesAbaProps> = ({
  rascunho,
  definir,
}) => {
  /**
   * O editor carrega as cinco fontes de uma vez: aqui as amostras aparecem lado
   * a lado, e uma grade em que elas vão chegando uma a uma não deixa comparar —
   * que é justamente o que se está fazendo nessa tela.
   */
  useEffect(() => carregarTodasAsFontes(), []);

  return (
    <div className="space-y-6">
      <GradeDeOpcoes
        label="Fonte do nome"
        opcoes={FONTES}
        valor={rascunho.fonte}
        onEscolher={(id) => definir("fonte", id)}
        amostra={(id) => (
          <span
            className="text-base"
            style={{ fontFamily: familiaDaFonte(id) ?? undefined }}
          >
            Ana
          </span>
        )}
      />

      <GradeDeOpcoes
        label="Efeito do nome"
        opcoes={EFEITOS_DO_NOME}
        valor={rascunho.efeitoDoNome}
        onEscolher={(id) => definir("efeitoDoNome", id)}
        amostra={(id) => {
          const enfeite = estiloDoNome({
            estilo: { efeito: id, cor: rascunho.cor, cor2: rascunho.cor2 },
            // `md` porque a amostra é grande: é aqui que gradiente e brilho valem
            tamanho: "md",
            animar: true,
          });

          return (
            <span
              className={cn("text-base font-bold", enfeite.className)}
              style={enfeite.style}
            >
              Ana
            </span>
          );
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <CampoDeCor
          label="Cor do nome"
          valor={rascunho.cor}
          onMudar={(cor) => definir("cor", cor)}
          dica="Sem escolha, o efeito usa a cor do seu cargo mais alto."
        />
        <CampoDeCor
          label="Segunda cor"
          valor={rascunho.cor2}
          onMudar={(cor) => definir("cor2", cor)}
          dica="Só o gradiente usa."
        />
      </div>

      <div className="h-px bg-line" />

      <GradeDeOpcoes
        label="Decoração do avatar"
        opcoes={DECORACOES_DE_AVATAR}
        valor={rascunho.decoracao}
        onEscolher={(id) => definir("decoracao", id)}
        amostra={(id) => <Amostra familia="decoracao" id={id} />}
      />

      <GradeDeOpcoes
        label="Moldura do avatar"
        opcoes={MOLDURAS_DE_AVATAR}
        valor={rascunho.moldura}
        onEscolher={(id) => definir("moldura", id)}
        amostra={(id) => <Amostra familia="moldura" id={id} />}
      />

      <div className="h-px bg-line" />

      <GradeDeOpcoes
        label="Efeito do cartão"
        opcoes={EFEITOS_DO_PERFIL}
        valor={rascunho.efeitoDoPerfil}
        onEscolher={(id) => definir("efeitoDoPerfil", id)}
      />

      <GradeDeOpcoes
        label="Patente"
        opcoes={PATENTES_DE_PERFIL}
        valor={rascunho.patente}
        onEscolher={(id) => definir("patente", id)}
        /*
          A amostra é o player de verdade, e por isso ela MONTA na sua frente
          quando a aba abre — que é exatamente o que vai acontecer quando alguém
          abrir seu cartão. Um quadro parado esconderia justamente a única coisa
          que diferencia esta escolha das outras.
        */
        amostra={(id) => <PatenteAnimada patente={id} animar altura={24} />}
      />

      <GradeDeOpcoes
        label="Placa do nome"
        opcoes={PLACAS_DE_PERFIL}
        valor={rascunho.placa}
        onEscolher={(id) => definir("placa", id)}
        amostra={(id) => {
          const placa = classeDoEnfeite("placa", id);
          return (
            <span className={cn("text-xs", placa && "gc-placa", placa)}>
              Ana
            </span>
          );
        }}
      />
    </div>
  );
};

/**
 * A amostra de decoração e moldura é um círculo cinza com a camada por cima —
 * a mesma camada do `Avatar`, no mesmo tamanho relativo. Um quadrado colorido
 * com o nome do efeito não diria nada sobre como o enfeite fica em volta de uma
 * foto redonda.
 *
 * As decorações ANIMADAS passam pelo mesmo player do chat, e não por uma classe
 * de CSS que não existe pra elas. Sem isto, "Aro dourado", "Moldura alada" e
 * "Selo do sol" apareciam como três bolinhas cinzas idênticas na grade — três
 * escolhas indistinguíveis numa tela que só serve pra escolher com os olhos.
 */
const Amostra: React.FC<{ familia: string; id: string }> = ({
  familia,
  id,
}) => {
  const classe = classeDoEnfeite(familia, id);
  // o `id` vem sempre do catálogo, que é montado a partir do próprio enum
  const animada = familia === "decoracao" && ehAnimada(id as Decoracao);

  return (
    <span className="relative block size-7 rounded-full bg-surface-4">
      {animada && <DecoracaoAnimada decoracao={id as Decoracao} animar />}

      {!animada && classe && (
        <span
          aria-hidden
          className={cn(
            "gc-camada",
            familia === "moldura" && "gc-camada--moldura",
            classe,
          )}
          style={variaveisDoEnfeite({ animar: true, velocidade: "8s" })}
        />
      )}
    </span>
  );
};
