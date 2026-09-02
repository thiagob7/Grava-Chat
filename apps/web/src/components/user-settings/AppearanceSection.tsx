import React, { useState } from "react";
import { Check, Flame, Monitor, Moon, Palette, Sparkles, Sun, Video } from "lucide-react";

import { Switch } from "~/components/ui/switch";
import { CampoSelect } from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { EstudioDeTemas } from "~/components/estudio/EstudioDeTemas";
import {
  CORES_DE_DESTAQUE,
  useAparencia,
  type Densidade,
  type QuandoMostrarSpoiler,
  type Tema,
} from "~/stores/aparencia";
import { cn } from "~/lib/utils";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";

interface TemaDaLista {
  id: Tema;
  nome: string;
  icone: React.ReactNode;
  amostra: string[];
  /// o tema da casa não se explica com três faixas de cinza: ele mostra a marca
  marca?: boolean;
  /// tema cuja graça é o acento, e não a escala de cinza: ele aparece na amostra
  acento?: string;
}

const TEMAS: TemaDaLista[] = [
  {
    id: "claro",
    nome: "Claro",
    icone: <Sun size={14} />,
    amostra: ["#f0f1f3", "#ebecef", "#e6e7ea"],
    acento: "#413cdd",
  },
  {
    id: "escuro",
    nome: "Escuro",
    icone: <Moon size={14} />,
    amostra: ["#1e1d23", "#1a181e", "#232028"],
    acento: "#413cdd",
  },
  {
    id: "mais-escuro",
    nome: "Mais escuro",
    icone: <Moon size={14} />,
    amostra: ["#020203", "#0f0e12", "#141217"],
    acento: "#413cdd",
  },
  {
    id: "sistema",
    nome: "Seguir o sistema",
    icone: <Monitor size={14} />,
    amostra: ["#ebecef", "#8a8a94", "#1a181e"],
  },
  {
    id: "gravae",
    nome: "Modo Gravaê",
    icone: <Flame size={14} />,
    amostra: ["#171011", "#120c0d", "#0b0708"],
    marca: true,
  },
];

export const AppearanceSection: React.FC = () => {
  const prefs = useAparencia();
  const [estudioAberto, setEstudioAberto] = useState(false);

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Secao id="tema" titulo="Tema">
        <div className="flex flex-wrap gap-3">
          {TEMAS.map((tema) => (
            <button
              key={tema.id}
              onClick={() => prefs.definir({ tema: tema.id })}
              aria-pressed={prefs.tema === tema.id}
              className={cn(
                "relative w-36 overflow-hidden rounded-lg border-2 text-left transition",
                prefs.tema === tema.id
                  ? "border-brand"
                  : "border-line hover:border-ink-faint",
              )}
            >
              {/*
                A amostra é a própria escala do tema — as três superfícies que
                o app usa mais. Um quadrado de cor só não diz nada; três em
                camada mostram o contraste que você vai encarar.
              */}
              <span className="relative flex h-14" aria-hidden>
                {tema.amostra.map((cor) => (
                  <span key={cor} className="flex-1" style={{ backgroundColor: cor }} />
                ))}

                {tema.marca && (
                  <img
                    src="/brand/marca.svg"
                    alt=""
                    className="absolute inset-0 m-auto h-8 w-auto drop-shadow"
                  />
                )}

                {tema.acento && (
                  <span
                    className="absolute inset-0 m-auto size-6 rounded-full shadow"
                    style={{ backgroundColor: tema.acento }}
                  />
                )}
              </span>

              <span
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium",
                  tema.marca && "text-brand",
                )}
              >
                {tema.icone}
                {tema.nome}
              </span>

              {prefs.tema === tema.id && (
                <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-white">
                  <Check size={12} />
                </span>
              )}
            </button>
          ))}
        </div>

        {/*
          O tema escolhido é a base; o estúdio é o que se pinta por cima dela.
          Por isso o botão mora aqui embaixo da grade, e não numa seção sua.
        */}
        <div className="mt-4">
          <Button variant="surface" onClick={() => setEstudioAberto(true)}>
            <Palette size={16} /> Abrir estúdio de temas…
          </Button>
          <p className="mt-1.5 text-xs text-ink-faint">
            Muda cor por cor em cima do tema base, escreve CSS e guarda o resultado. Vale só neste
            aparelho.
          </p>
        </div>

        <EstudioDeTemas open={estudioAberto} onClose={() => setEstudioAberto(false)} />
      </Secao>

      <Secao
        id="cor-de-destaque"
        titulo="Cor de destaque"
        detalhe="A cor dos botões, dos links e de tudo o que o app quer que você veja primeiro."
      >
        <div className="flex flex-wrap items-center gap-2">
          {CORES_DE_DESTAQUE.map((cor, indice) => {
            /// A primeira é a da marca — escolher ela é voltar ao padrão, e
            /// padrão é ausência de escolha guardada.
            const valor = indice === 0 ? null : cor.valor;
            const escolhida = prefs.destaque === valor;

            return (
              <button
                key={cor.valor}
                onClick={() => prefs.definir({ destaque: valor })}
                title={cor.nome}
                aria-label={cor.nome}
                aria-pressed={escolhida}
                style={{ backgroundColor: cor.valor }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-white transition hover:scale-110",
                  escolhida && "ring-2 ring-ink ring-offset-2 ring-offset-surface-2",
                )}
              >
                {escolhida && <Check size={14} />}
              </button>
            );
          })}
        </div>
      </Secao>

      <Secao id="mensagens" titulo="Mensagens">
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
            onEscolher={(v) => prefs.definir({ spoilers: v as QuandoMostrarSpoiler })}
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

      <Secao id="caixa-de-chat" titulo="Caixa de chat">
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
        id="modo-streamer"
        titulo="Modo streamer"
        detalhe="Para quando a sua tela está sendo vista por gente que não está na conversa."
      >
        <div className="mb-3 flex items-start gap-3 rounded bg-surface-2 p-3">
          <Video size={18} className={cn("mt-0.5 shrink-0", prefs.modoStreamer ? "text-brand" : "text-ink-faint")} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {prefs.modoStreamer ? "Ligado — a tela está protegida" : "Desligado"}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Ligue antes de começar a transmitir. O que estiver marcado abaixo some da tela
              enquanto ele estiver de pé.
            </p>
          </div>
          <Switch
            checked={prefs.modoStreamer}
            onCheckedChange={(v) => prefs.definir({ modoStreamer: v })}
          />
        </div>

        <Opcao
          titulo="Esconder meus dados"
          detalhe="E-mail e a forma de login, na tela de conta."
          ligado={prefs.streamerEscondeDados}
          onMudar={(v) => prefs.definir({ streamerEscondeDados: v })}
        />

        <Opcao
          titulo="Esconder links de convite"
          detalhe="O código do convite fica tapado até você clicar para revelar."
          ligado={prefs.streamerEscondeConvites}
          onMudar={(v) => prefs.definir({ streamerEscondeConvites: v })}
        />

        <Opcao
          titulo="Silenciar os sons"
          detalhe="Entrar e sair de chamada, mutar, mensagem nova."
          ligado={prefs.streamerSemSom}
          onMudar={(v) => prefs.definir({ streamerSemSom: v })}
        />

        <Opcao
          titulo="Não mostrar avisos na tela"
          detalhe="A janelinha do sistema com o que chegou — que é o jeito mais rápido de vazar uma conversa numa live."
          ligado={prefs.streamerSemAvisos}
          onMudar={(v) => prefs.definir({ streamerSemAvisos: v })}
        />
      </Secao>

      <div className="mt-10 border-t border-line pt-5">
        <Button variant="surface" size="sm" onClick={prefs.restaurarPadrao}>
          Voltar ao padrão
        </Button>
      </div>
    </div>
  );
};

const Opcao: React.FC<{
  titulo: string;
  detalhe: string;
  ligado: boolean;
  onMudar: (valor: boolean) => void;
}> = ({ titulo, detalhe, ligado, onMudar }) => (
  <div className="mt-4 flex items-start gap-4 first:mt-0">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{titulo}</p>
      <p className="mt-0.5 text-xs text-ink-faint">{detalhe}</p>
    </div>
    <Switch checked={ligado} onCheckedChange={onMudar} />
  </div>
);

const Linha: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <div className="mt-4 flex items-center justify-between gap-4">
    <p className="text-sm font-medium">{titulo}</p>
    <div className="w-52">{children}</div>
  </div>
);
