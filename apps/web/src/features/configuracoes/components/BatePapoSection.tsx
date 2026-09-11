import React from "react";

import { SelectField } from "~/components/ui/select";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { Line, Choice } from "~/features/configuracoes/components/campos-de-config";
import {
  useAppearance,
  type Density,
  type WhenShowSpoiler,
} from "~/features/configuracoes/stores/aparencia";

export const VoiceChatSection: React.FC = () => {
  const prefs = useAppearance();

  return (
    <div data-gc="configuracoes.bate-papo-section.div">
      <p data-gc="configuracoes.bate-papo-section.p" className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Section data-gc="configuracoes.bate-papo-section.section"
        id="exibicao"
        title="Exibição"
        detail="O que aparece em volta de cada mensagem."
      >
        <Choice data-gc="configuracoes.bate-papo-section.choice"
          title="Reações"
          detail="As pílulas de emoji embaixo das mensagens. Desligado, elas somem — e o atalho de reagir também."
          on={prefs.reactions}
          onChange={(v) => prefs.set({ reactions: v })}
        />

        <Choice data-gc="configuracoes.bate-papo-section.choice--2"
          title="Avatares"
          detail="A foto de quem escreveu, à esquerda da mensagem."
          on={prefs.avatars}
          onChange={(v) => prefs.set({ avatars: v })}
        />

        <Line data-gc="configuracoes.bate-papo-section.line" title="Mostrar spoilers">
          <SelectField data-gc="configuracoes.bate-papo-section.select-field"
            value={prefs.spoilers}
            onSelect={(v) =>
              prefs.set({ spoilers: v as WhenShowSpoiler })
            }
            options={[
              { value: "ao-clicar", label: "Ao clicar" },
              { value: "sempre", label: "Sempre" },
            ]}
          />
        </Line>

        <Line data-gc="configuracoes.bate-papo-section.line--2" title="Espaçamento das mensagens">
          <SelectField data-gc="configuracoes.bate-papo-section.select-field--2"
            value={prefs.density}
            onSelect={(v) => prefs.set({ density: v as Density })}
            options={[
              { value: "confortavel", label: "Confortável" },
              { value: "compacta", label: "Compacta" },
            ]}
          />
        </Line>
      </Section>

      <Section data-gc="configuracoes.bate-papo-section.section--2"
        id="entrada"
        title="Entrada"
        detail="O que a caixa de escrever faz enquanto você digita."
      >
        <Choice data-gc="configuracoes.bate-papo-section.choice--3"
          title="Sugestões enquanto digita"
          detail="A lista que abre no @ para mencionar alguém e no / para os comandos dos bots."
          on={prefs.suggestions}
          onChange={(v) => prefs.set({ suggestions: v })}
        />

        <Choice data-gc="configuracoes.bate-papo-section.choice--4"
          title="Converter emoticons em emoji"
          detail="Digitar :) manda 🙂. Vale para os clássicos: :) :( ;) :P :D :'( <3"
          on={prefs.emoticons}
          onChange={(v) => prefs.set({ emoticons: v })}
        />

        <Choice data-gc="configuracoes.bate-papo-section.choice--5"
          title="Botão de enviar"
          detail="O aviãozinho ao lado do emoji. Desligado, sobra o Enter — que é como quase todo mundo manda."
          on={prefs.sendButton}
          onChange={(v) => prefs.set({ sendButton: v })}
        />
      </Section>

      <Section data-gc="configuracoes.bate-papo-section.section--3"
        id="midia"
        title="Mídia"
        detail="O que o app baixa sozinho. Desligar economiza dados e esconde surpresas de quem cola link."
      >
        <Choice data-gc="configuracoes.bate-papo-section.choice--6"
          title="Imagens e vídeos de links"
          detail="Quando alguém cola o endereço de uma imagem ou de um GIF, ele aparece aberto na conversa."
          on={prefs.linksImages}
          onChange={(v) => prefs.set({ linksImages: v })}
        />

        <Choice data-gc="configuracoes.bate-papo-section.choice--7"
          title="Imagens enviadas aqui"
          detail="Os anexos enviados pelo app. Desligado, cada um vira uma linha com o nome do arquivo."
          on={prefs.imagesSent}
          onChange={(v) => prefs.set({ imagesSent: v })}
        />

        <Choice data-gc="configuracoes.bate-papo-section.choice--8"
          title="Prévia de links"
          detail="O cartão com título, descrição e capa do site — e o tocador do YouTube dentro da conversa."
          on={prefs.linksPreview}
          onChange={(v) => prefs.set({ linksPreview: v })}
        />
      </Section>
    </div>
  );
};
