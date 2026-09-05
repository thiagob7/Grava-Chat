import React, { useEffect } from "react";
import type { Decoracao } from "@gravae/shared";

import {
  DECORACOES_DE_AVATAR,
  EFEITOS_DO_NOME,
  FONTES,
  PATENTES_DE_PERFIL,
} from "~/features/perfil/lib/catalogo";
import { DecoracaoDeArquivo } from "~/features/perfil/components/DecoracaoDeArquivo";
import { PatenteAnimada } from "~/features/perfil/components/PatenteAnimada";
import { ehDeArquivo } from "~/features/perfil/lib/decoracoes";
import { classeDoEnfeite, variaveisDoEnfeite } from "~/features/perfil/lib/estilos";
import { carregarTodasAsFontes, familiaDaFonte } from "~/features/perfil/lib/fontes";
import { estiloDoNome } from "~/features/perfil/lib/nome";
import {
  CampoDeCor,
  GradeDeOpcoes,
} from "~/features/configuracoes/components/perfil/campos";
import type { RascunhoDePerfil } from "~/features/configuracoes/components/perfil/rascunho";
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
    <div data-gc="configuracoes.perfil.enfeites-aba.div" className="space-y-6">
      <GradeDeOpcoes data-gc="configuracoes.perfil.enfeites-aba.grade-de-opcoes"
        label="Fonte do nome"
        opcoes={FONTES}
        valor={rascunho.fonte}
        onEscolher={(id) => definir("fonte", id)}
        amostra={(id) => (
          <span data-gc="configuracoes.perfil.enfeites-aba.span"
            className="text-base"
            style={{ fontFamily: familiaDaFonte(id) ?? undefined }}
          >
            Ana
          </span>
        )}
      />

      <GradeDeOpcoes data-gc="configuracoes.perfil.enfeites-aba.grade-de-opcoes--2"
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
            <span data-gc="configuracoes.perfil.enfeites-aba.span--2"
              className={cn("text-base font-bold", enfeite.className)}
              style={enfeite.style}
            >
              Ana
            </span>
          );
        }}
      />

      <div data-gc="configuracoes.perfil.enfeites-aba.div--2" className="grid grid-cols-2 gap-4">
        <CampoDeCor data-gc="configuracoes.perfil.enfeites-aba.campo-de-cor"
          label="Cor do nome"
          valor={rascunho.cor}
          onMudar={(cor) => definir("cor", cor)}
          dica="Sem escolha, o efeito usa a cor do seu cargo mais alto."
        />
        <CampoDeCor data-gc="configuracoes.perfil.enfeites-aba.campo-de-cor--2"
          label="Segunda cor"
          valor={rascunho.cor2}
          onMudar={(cor) => definir("cor2", cor)}
          dica="Só o gradiente usa."
        />
      </div>

      <div data-gc="configuracoes.perfil.enfeites-aba.div--3" className="h-px bg-line" />

      <GradeDeOpcoes data-gc="configuracoes.perfil.enfeites-aba.grade-de-opcoes--3"
        label="Decoração do avatar"
        opcoes={DECORACOES_DE_AVATAR}
        valor={rascunho.decoracao}
        onEscolher={(id) => definir("decoracao", id)}
        amostra={(id) => <Amostra data-gc="configuracoes.perfil.enfeites-aba.amostra" familia="decoracao" id={id} />}
      />

      <div data-gc="configuracoes.perfil.enfeites-aba.div--4" className="h-px bg-line" />

      <GradeDeOpcoes data-gc="configuracoes.perfil.enfeites-aba.grade-de-opcoes--4"
        label="Patente"
        opcoes={PATENTES_DE_PERFIL}
        valor={rascunho.patente}
        onEscolher={(id) => definir("patente", id)}
        amostra={(id) => <PatenteAnimada data-gc="configuracoes.perfil.enfeites-aba.patente-animada" patente={id} animar altura={24} />}
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

  const doCartao = familia === "moldura";

  return (
    <span data-gc="configuracoes.perfil.enfeites-aba.span--3"
      className={cn(
        "relative block bg-surface-4",
        doCartao ? "h-7 w-10 rounded" : "size-7 rounded-full",
      )}
    >
      {deArquivo && <DecoracaoDeArquivo data-gc="configuracoes.perfil.enfeites-aba.decoracao-de-arquivo" decoracao={id as Decoracao} animar />}

      {!deArquivo && classe && (
        <span data-gc="configuracoes.perfil.enfeites-aba.span--4"
          aria-hidden
          className={cn(doCartao ? "gc-camada--cartao" : "gc-camada", classe)}
          style={{
            ...variaveisDoEnfeite({ animar: true, velocidade: "8s" }),
            ...(doCartao ? { "--gc-borda": "7px" } : null),
          }}
        />
      )}
    </span>
  );
};
