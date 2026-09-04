import React, { useEffect } from "react";
import type { Decoracao } from "@gravae/shared";

import {
  DECORACOES_DE_AVATAR,
  EFEITOS_DO_NOME,
  FONTES,
  PATENTES_DE_PERFIL,
} from "~/lib/cosmeticos/catalogo";
import { DecoracaoDeArquivo } from "~/components/DecoracaoDeArquivo";
import { PatenteAnimada } from "~/components/PatenteAnimada";
import { ehDeArquivo } from "~/lib/cosmeticos/decoracoes";
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

export const EnfeitesAba: React.FC<EnfeitesAbaProps> = ({
  rascunho,
  definir,
}) => {
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

      {/*
        A moldura do avatar, o efeito do cartão e a placa do nome saíram da
        grade por enquanto — veja FAMILIAS_DESLIGADAS no catálogo.
      */}

      <div className="h-px bg-line" />

      <GradeDeOpcoes
        label="Patente"
        opcoes={PATENTES_DE_PERFIL}
        valor={rascunho.patente}
        onEscolher={(id) => definir("patente", id)}
        amostra={(id) => <PatenteAnimada patente={id} animar altura={24} />}
      />

    </div>
  );
};

export const Amostra: React.FC<{ familia: string; id: string }> = ({
  familia,
  id,
}) => {
  const classe = classeDoEnfeite(familia, id);
  const deArquivo = familia === "decoracao" && ehDeArquivo(id as Decoracao);

  /// Moldura agora e do cartao: a amostra dela precisa ter forma de cartao,
  /// senao a pessoa escolhe achando que vai em volta do retrato.
  const doCartao = familia === "moldura";

  return (
    <span
      className={cn(
        "relative block bg-surface-4",
        doCartao ? "h-7 w-10 rounded" : "size-7 rounded-full",
      )}
    >
      {deArquivo && <DecoracaoDeArquivo decoracao={id as Decoracao} animar />}

      {!deArquivo && classe && (
        <span
          aria-hidden
          className={cn(doCartao ? "gc-camada--cartao" : "gc-camada", classe)}
          style={{
            ...variaveisDoEnfeite({ animar: true, velocidade: "8s" }),
            /// A amostra tem 28px de altura; molduras desenhadas usam borda de
            /// 36px no cartão e aqui se sobreporiam.
            ...(doCartao ? { "--gc-borda": "7px" } : null),
          }}
        />
      )}
    </span>
  );
};
