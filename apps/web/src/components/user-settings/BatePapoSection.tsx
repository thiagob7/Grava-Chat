import React from "react";

import { CampoSelect } from "~/components/ui/select";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";
import { Linha, Opcao } from "~/components/user-settings/campos-de-config";
import {
  useAparencia,
  type Densidade,
  type QuandoMostrarSpoiler,
} from "~/stores/aparencia";

export const BatePapoSection: React.FC = () => {
  const prefs = useAparencia();

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Secao
        id="exibicao"
        titulo="Exibição"
        detalhe="O que aparece em volta de cada mensagem."
      >
        <Opcao
          titulo="Reações"
          detalhe="As pílulas de emoji embaixo das mensagens. Desligado, elas somem — e o atalho de reagir também."
          ligado={prefs.reacoes}
          onMudar={(v) => prefs.definir({ reacoes: v })}
        />

        <Opcao
          titulo="Avatares"
          detalhe="A foto de quem escreveu, à esquerda da mensagem."
          ligado={prefs.avatares}
          onMudar={(v) => prefs.definir({ avatares: v })}
        />

        <Linha titulo="Mostrar spoilers">
          <CampoSelect
            valor={prefs.spoilers}
            onEscolher={(v) =>
              prefs.definir({ spoilers: v as QuandoMostrarSpoiler })
            }
            opcoes={[
              { valor: "ao-clicar", rotulo: "Ao clicar" },
              { valor: "sempre", rotulo: "Sempre" },
            ]}
          />
        </Linha>

        <Linha titulo="Espaçamento das mensagens">
          <CampoSelect
            valor={prefs.densidade}
            onEscolher={(v) => prefs.definir({ densidade: v as Densidade })}
            opcoes={[
              { valor: "confortavel", rotulo: "Confortável" },
              { valor: "compacta", rotulo: "Compacta" },
            ]}
          />
        </Linha>
      </Secao>

      <Secao
        id="entrada"
        titulo="Entrada"
        detalhe="O que a caixa de escrever faz enquanto você digita."
      >
        <Opcao
          titulo="Sugestões enquanto digita"
          detalhe="A lista que abre no @ para mencionar alguém e no / para os comandos dos bots."
          ligado={prefs.sugestoes}
          onMudar={(v) => prefs.definir({ sugestoes: v })}
        />

        <Opcao
          titulo="Converter emoticons em emoji"
          detalhe="Digitar :) manda 🙂. Vale para os clássicos: :) :( ;) :P :D :'( <3"
          ligado={prefs.emoticons}
          onMudar={(v) => prefs.definir({ emoticons: v })}
        />

        <Opcao
          titulo="Botão de enviar"
          detalhe="O aviãozinho ao lado do emoji. Desligado, sobra o Enter — que é como quase todo mundo manda."
          ligado={prefs.botaoDeEnviar}
          onMudar={(v) => prefs.definir({ botaoDeEnviar: v })}
        />
      </Secao>

      <Secao
        id="midia"
        titulo="Mídia"
        detalhe="O que o app baixa sozinho. Desligar economiza dados e esconde surpresas de quem cola link."
      >
        <Opcao
          titulo="Imagens e vídeos de links"
          detalhe="Quando alguém cola o endereço de uma imagem ou de um GIF, ele aparece aberto na conversa."
          ligado={prefs.imagensDeLinks}
          onMudar={(v) => prefs.definir({ imagensDeLinks: v })}
        />

        <Opcao
          titulo="Imagens enviadas aqui"
          detalhe="Os anexos enviados pelo app. Desligado, cada um vira uma linha com o nome do arquivo."
          ligado={prefs.imagensEnviadas}
          onMudar={(v) => prefs.definir({ imagensEnviadas: v })}
        />

        <Opcao
          titulo="Prévia de links"
          detalhe="O cartão com título, descrição e capa do site — e o tocador do YouTube dentro da conversa."
          ligado={prefs.previaDeLinks}
          onMudar={(v) => prefs.definir({ previaDeLinks: v })}
        />
      </Secao>
    </div>
  );
};
