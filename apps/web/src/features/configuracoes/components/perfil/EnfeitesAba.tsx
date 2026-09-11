import React, { useEffect } from "react";
import type { Decoration } from "@gravae/shared";

import {
  AVATAR_DECORATIONS,
  NAME_EFFECT_OPTIONS,
  FONTS,
  PROFILE_RANKS,
} from "~/features/perfil/lib/catalogo";
import { FileDecoration } from "~/features/perfil/components/DecoracaoDeArquivo";
import { RankAnimated } from "~/features/perfil/components/PatenteAnimada";
import { isFile } from "~/features/perfil/lib/decoracoes";
import { charmClass, charmVariables } from "~/features/perfil/lib/estilos";
import { loadAllFonts, fontFamily } from "~/features/perfil/lib/fontes";
import { nameStyle } from "~/features/perfil/lib/nome";
import {
  ColorField,
  OptionsGrid,
} from "~/features/configuracoes/components/perfil/campos";
import type { ProfileDraft } from "~/features/configuracoes/components/perfil/rascunho";
import { cn } from "~/lib/utils";

interface CharmsTabProps {
  draft: ProfileDraft;
  set: <K extends keyof ProfileDraft>(
    field: K,
    value: ProfileDraft[K],
  ) => void;
}

export const CharmsTab: React.FC<CharmsTabProps> = ({
  draft,
  set,
}) => {
  useEffect(() => loadAllFonts(), []);

  return (
    <div data-gc="configuracoes.perfil.enfeites-aba.div" className="space-y-6">
      <OptionsGrid data-gc="configuracoes.perfil.enfeites-aba.options-grid"
        label="Fonte do nome"
        options={FONTS}
        value={draft.font}
        onPick={(id) => set("font", id)}
        sample={(id) => (
          <span data-gc="configuracoes.perfil.enfeites-aba.span"
            className="text-base"
            style={{ fontFamily: fontFamily(id) ?? undefined }}
          >
            Ana
          </span>
        )}
      />

      <OptionsGrid data-gc="configuracoes.perfil.enfeites-aba.options-grid--2"
        label="Efeito do nome"
        options={NAME_EFFECT_OPTIONS}
        value={draft.nameEffect}
        onPick={(id) => set("nameEffect", id)}
        sample={(id) => {
          const charm = nameStyle({
            style: { effect: id, color: draft.color, color2: draft.color2 },
            size: "md",
            animate: true,
          });

          return (
            <span data-gc="configuracoes.perfil.enfeites-aba.span--2"
              className={cn("text-base font-bold", charm.className)}
              style={charm.style}
            >
              Ana
            </span>
          );
        }}
      />

      <div data-gc="configuracoes.perfil.enfeites-aba.div--2" className="grid grid-cols-2 gap-4">
        <ColorField data-gc="configuracoes.perfil.enfeites-aba.color-field"
          label="Cor do nome"
          value={draft.color}
          onChange={(color) => set("color", color)}
          hint="Sem escolha, o efeito usa a cor do seu cargo mais alto."
        />
        <ColorField data-gc="configuracoes.perfil.enfeites-aba.color-field--2"
          label="Segunda cor"
          value={draft.color2}
          onChange={(color) => set("color2", color)}
          hint="Só o gradiente usa."
        />
      </div>

      <div data-gc="configuracoes.perfil.enfeites-aba.div--3" className="h-px bg-line" />

      <OptionsGrid data-gc="configuracoes.perfil.enfeites-aba.options-grid--3"
        label="Decoração do avatar"
        options={AVATAR_DECORATIONS}
        value={draft.decoration}
        onPick={(id) => set("decoration", id)}
        sample={(id) => <Sample data-gc="configuracoes.perfil.enfeites-aba.sample" family="decoration" id={id} />}
      />

      <div data-gc="configuracoes.perfil.enfeites-aba.div--4" className="h-px bg-line" />

      <OptionsGrid data-gc="configuracoes.perfil.enfeites-aba.options-grid--4"
        label="Rank"
        options={PROFILE_RANKS}
        value={draft.rank}
        onPick={(id) => set("rank", id)}
        sample={(id) => <RankAnimated data-gc="configuracoes.perfil.enfeites-aba.rank-animated" rank={id} animate height={24} />}
      />

    </div>
  );
};

export const Sample: React.FC<{ family: string; id: string }> = ({
  family,
  id,
}) => {
  const cssClass = charmClass(family, id);
  const fromFile = family === "decoration" && isFile(id as Decoration);

  const fromCard = family === "frame";

  return (
    <span data-gc="configuracoes.perfil.enfeites-aba.span--3"
      className={cn(
        "relative block bg-surface-4",
        fromCard ? "h-7 w-10 rounded" : "size-7 rounded-full",
      )}
    >
      {fromFile && <FileDecoration data-gc="configuracoes.perfil.enfeites-aba.file-decoration" decoration={id as Decoration} animate />}

      {!fromFile && cssClass && (
        <span data-gc="configuracoes.perfil.enfeites-aba.span--4"
          aria-hidden
          className={cn(fromCard ? "gc-camada--cartao" : "gc-camada", cssClass)}
          style={{
            ...charmVariables({ animate: true, speed: "8s" }),
            ...(fromCard ? { "--gc-borda": "7px" } : null),
          }}
        />
      )}
    </span>
  );
};
