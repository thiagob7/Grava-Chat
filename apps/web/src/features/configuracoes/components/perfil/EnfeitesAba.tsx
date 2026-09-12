import React, { useEffect } from "react";
import type { Decoration } from "@gravae/shared";

import {
  AVATAR_DECORATIONS,
  NAME_EFFECT_OPTIONS,
  FONTS,
  PROFILE_RANKS,
} from "~/features/perfil/lib/catalogo";
import { Avatar } from "~/features/perfil/components/Avatar";
import { RankAnimated } from "~/features/perfil/components/PatenteAnimada";
import { loadAllFonts, fontFamily } from "~/features/perfil/lib/fontes";
import { nameStyle } from "~/features/perfil/lib/nome";
import {
  ColorField,
  OptionsGrid,
} from "~/features/configuracoes/components/perfil/campos";
import type { ProfileDraft } from "~/features/configuracoes/components/perfil/rascunho";
import { cn } from "~/lib/utils";

interface CharmsTabProps {
  id: string;
  draft: ProfileDraft;
  set: <K extends keyof ProfileDraft>(
    field: K,
    value: ProfileDraft[K],
  ) => void;
}

export const CharmsTab: React.FC<CharmsTabProps> = ({
  id,
  draft,
  set,
}) => {
  useEffect(() => loadAllFonts(), []);

  const photo = { id, name: draft.displayName, url: draft.avatarUrl };

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
        sample={(option) => <Sample data-gc="configuracoes.perfil.enfeites-aba.sample" decoration={option} photo={photo} />}
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

export interface SamplePhoto {
  id: string;
  name: string;
  url: string | null;
}

/*
  A amostra é a foto de quem está escolhendo, com o enfeite em cima — não um
  disco cinza. O bicho senta na borda de cima do avatar, e num disco de 28 px
  não dava para saber qual era qual: todos viravam um risco colorido.
*/
export const Sample: React.FC<{
  decoration: Decoration;
  photo: SamplePhoto;
}> = ({ decoration, photo }) => (
  <Avatar data-gc="configuracoes.perfil.enfeites-aba.avatar"
    id={photo.id}
    name={photo.name}
    url={photo.url}
    size={48}
    charms={{ decoration, frame: "nenhuma" }}
    animate
  />
);
