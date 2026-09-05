import React, { useState } from "react";
import {
  Check,
  Flame,
  Monitor,
  Moon,
  Palette,
  Sparkles,
  Sun,
  Video,
} from "lucide-react";

import { Switch } from "~/components/ui/switch";
import { CampoSelect } from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { EstudioDeTemas } from "~/features/configuracoes/components/estudio/EstudioDeTemas";
import {
  CORES_DE_DESTAQUE,
  useAparencia,
  type Densidade,
  type QuandoMostrarSpoiler,
  type Tema,
} from "~/features/configuracoes/stores/aparencia";
import { cn } from "~/lib/utils";
import { ehDesktop } from "~/lib/desktop";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";
import { ControleDeEscala } from "~/features/configuracoes/components/ControleDeEscala";
import { Linha, Opcao } from "~/features/configuracoes/components/campos-de-config";

interface TemaDaLista {
  id: Tema;
  nome: string;
  icone: React.ReactNode;
  amostra: string[];
  marca?: boolean;
  acento?: string;
}

const TEMAS: TemaDaLista[] = [
  {
    id: "claro",
    nome: "Claro",
    icone: <Sun data-gc="configuracoes.appearance-section.sun" size={14} />,
    amostra: ["#f0f1f3", "#ebecef", "#e6e7ea"],
    acento: "#413cdd",
  },
  {
    id: "escuro",
    nome: "Escuro",
    icone: <Moon data-gc="configuracoes.appearance-section.moon" size={14} />,
    amostra: ["#1e1d23", "#1a181e", "#232028"],
    acento: "#413cdd",
  },
  {
    id: "mais-escuro",
    nome: "Mais escuro",
    icone: <Moon data-gc="configuracoes.appearance-section.moon--2" size={14} />,
    amostra: ["#020203", "#0f0e12", "#141217"],
    acento: "#413cdd",
  },
  {
    id: "sistema",
    nome: "Seguir o sistema",
    icone: <Monitor data-gc="configuracoes.appearance-section.monitor" size={14} />,
    amostra: ["#ebecef", "#8a8a94", "#1a181e"],
  },
  {
    id: "gravae",
    nome: "Modo Gravaê",
    icone: <Flame data-gc="configuracoes.appearance-section.flame" size={14} />,
    amostra: ["#171011", "#120c0d", "#0b0708"],
    marca: true,
  },
];

export const AppearanceSection: React.FC = () => {
  const prefs = useAparencia();
  const [estudioAberto, setEstudioAberto] = useState(false);

  return (
    <div data-gc="configuracoes.appearance-section.div">
      <p data-gc="configuracoes.appearance-section.p" className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Secao data-gc="configuracoes.appearance-section.secao" id="tema" titulo="Tema">
        <div data-gc="configuracoes.appearance-section.div--2" className="flex flex-wrap gap-3">
          {TEMAS.map((tema) => (
            <button data-gc="configuracoes.appearance-section.button"
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
              <span data-gc="configuracoes.appearance-section.span" className="relative flex h-14" aria-hidden>
                {tema.amostra.map((cor) => (
                  <span data-gc="configuracoes.appearance-section.span--2"
                    key={cor}
                    className="flex-1"
                    style={{ backgroundColor: cor }}
                  />
                ))}

                {tema.marca && (
                  <img data-gc="configuracoes.appearance-section.img"
                    src="/brand/marca.svg"
                    alt=""
                    className="absolute inset-0 m-auto h-8 w-auto drop-shadow"
                  />
                )}

                {tema.acento && (
                  <span data-gc="configuracoes.appearance-section.span--3"
                    className="absolute inset-0 m-auto size-6 rounded-full shadow"
                    style={{ backgroundColor: tema.acento }}
                  />
                )}
              </span>

              <span data-gc="configuracoes.appearance-section.span--4"
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium",
                  tema.marca && "text-brand",
                )}
              >
                {tema.icone}
                {tema.nome}
              </span>

              {prefs.tema === tema.id && (
                <span data-gc="configuracoes.appearance-section.span--5" className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-white">
                  <Check data-gc="configuracoes.appearance-section.check" size={12} />
                </span>
              )}
            </button>
          ))}
        </div>

        <div data-gc="configuracoes.appearance-section.div--3" className="mt-4">
          <Button data-gc="configuracoes.appearance-section.button--2" variant="surface" onClick={() => setEstudioAberto(true)}>
            <Palette data-gc="configuracoes.appearance-section.palette" size={16} /> Abrir estúdio de temas…
          </Button>
          <p data-gc="configuracoes.appearance-section.p--2" className="mt-1.5 text-xs text-ink-faint">
            Muda cor por cor em cima do tema base, escreve CSS e guarda o
            resultado. Vale só neste aparelho.
          </p>
        </div>

        <EstudioDeTemas data-gc="configuracoes.appearance-section.estudio-de-temas"
          open={estudioAberto}
          onClose={() => setEstudioAberto(false)}
        />
      </Secao>

      <Secao data-gc="configuracoes.appearance-section.secao--2"
        id="cor-de-destaque"
        titulo="Cor de destaque"
        detalhe="A cor dos botões, dos links e de tudo o que o app quer que você veja primeiro."
      >
        <div data-gc="configuracoes.appearance-section.div--4" className="flex flex-wrap items-center gap-2">
          {CORES_DE_DESTAQUE.map((cor, indice) => {
            const valor = indice === 0 ? null : cor.valor;
            const escolhida = prefs.destaque === valor;

            return (
              <button data-gc="configuracoes.appearance-section.button--3"
                key={cor.valor}
                onClick={() => prefs.definir({ destaque: valor })}
                title={cor.nome}
                aria-label={cor.nome}
                aria-pressed={escolhida}
                style={{ backgroundColor: cor.valor }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-white transition hover:scale-110",
                  escolhida &&
                    "ring-2 ring-ink ring-offset-2 ring-offset-surface-2",
                )}
              >
                {escolhida && <Check data-gc="configuracoes.appearance-section.check--2" size={14} />}
              </button>
            );
          })}
        </div>
      </Secao>

      <Secao data-gc="configuracoes.appearance-section.secao--3"
        id="zoom-do-app"
        titulo="Nível de zoom do app"
        detalhe="Cresce a interface inteira — texto, ícones, avatares e espaçamentos, na mesma proporção."
      >
        <ControleDeEscala data-gc="configuracoes.appearance-section.controle-de-escala"
          valor={prefs.zoomDoApp}
          onMudar={(zoomDoApp) => prefs.definir({ zoomDoApp })}
          min={50}
          max={200}
          passo={5}
          marcas={[50, 75, 100, 125, 150, 200]}
        />
      </Secao>

      <Secao data-gc="configuracoes.appearance-section.secao--4"
        id="escala-da-fonte"
        titulo="Escala da fonte do chat"
        detalhe="Cresce só o texto das mensagens. Os menus e a lista de canais ficam como estão."
      >
        <ControleDeEscala data-gc="configuracoes.appearance-section.controle-de-escala--2"
          valor={prefs.escalaDoChat}
          onMudar={(escalaDoChat) => prefs.definir({ escalaDoChat })}
          min={80}
          max={180}
          passo={5}
          marcas={[80, 100, 120, 150, 180]}
        />
      </Secao>

      <Secao data-gc="configuracoes.appearance-section.secao--5"
        id="interface"
        titulo="Interface"
        detalhe="O contorno da janela e as colunas que ficam em volta da conversa."
      >
        {ehDesktop() && (
          <Opcao data-gc="configuracoes.appearance-section.opcao"
            titulo="Cantos arredondados"
            detalhe="A curva no alto à esquerda do miolo, onde ele encontra a faixa de título."
            ligado={prefs.cantosArredondados}
            onMudar={(cantosArredondados) =>
              prefs.definir({ cantosArredondados })
            }
          />
        )}

        <Opcao data-gc="configuracoes.appearance-section.opcao--2"
          titulo="Lista de membros"
          detalhe="A coluna da direita com quem está no servidor. Ela já some sozinha em tela estreita; isto é para quem tem tela larga e prefere a conversa ocupando tudo."
          ligado={prefs.listaDeMembros}
          onMudar={(listaDeMembros) => prefs.definir({ listaDeMembros })}
        />
      </Secao>

      <Secao data-gc="configuracoes.appearance-section.secao--6"
        id="lista-de-canais"
        titulo="Lista de canais"
        detalhe="A coluna da esquerda, dentro de um servidor."
      >
        <Opcao data-gc="configuracoes.appearance-section.opcao--3"
          titulo="Faixa do servidor"
          detalhe="A imagem larga no alto da lista, quando o servidor tem uma. O nome continua logo abaixo de qualquer jeito."
          ligado={prefs.faixaDoServidor}
          onMudar={(faixaDoServidor) => prefs.definir({ faixaDoServidor })}
        />

        <Opcao data-gc="configuracoes.appearance-section.opcao--4"
          titulo="Lembrar categorias fechadas"
          detalhe="Fechar uma categoria passa a valer na próxima vez que você abrir o app. Desligado, tudo volta aberto a cada recarga."
          ligado={prefs.lembrarCategoriasFechadas}
          onMudar={(lembrarCategoriasFechadas) =>
            prefs.definir({ lembrarCategoriasFechadas })
          }
        />
      </Secao>

      <Secao data-gc="configuracoes.appearance-section.secao--7"
        id="modo-streamer"
        titulo="Privacidade de transmissão"
        detalhe="Para quando a sua tela está sendo vista por gente que não está na conversa."
      >
        <div data-gc="configuracoes.appearance-section.div--5" className="mb-3 flex items-start gap-3 rounded bg-surface-2 p-3">
          <Video data-gc="configuracoes.appearance-section.video"
            size={18}
            className={cn(
              "mt-0.5 shrink-0",
              prefs.modoStreamer ? "text-brand" : "text-ink-faint",
            )}
          />
          <div data-gc="configuracoes.appearance-section.div--6" className="min-w-0 flex-1">
            <p data-gc="configuracoes.appearance-section.p--3" className="text-sm font-medium">
              {prefs.modoStreamer
                ? "Ligado — a tela está protegida"
                : "Desligado"}
            </p>
            <p data-gc="configuracoes.appearance-section.p--4" className="mt-0.5 text-xs text-ink-muted">
              Ligue antes de começar a transmitir. O que estiver marcado abaixo
              some da tela enquanto ele estiver de pé.
            </p>
          </div>
          <Switch data-gc="configuracoes.appearance-section.switch"
            checked={prefs.modoStreamer}
            onCheckedChange={(v) => prefs.definir({ modoStreamer: v })}
          />
        </div>

        <Opcao data-gc="configuracoes.appearance-section.opcao--5"
          titulo="Esconder meus dados"
          detalhe="E-mail e a forma de login, na tela de conta."
          ligado={prefs.streamerEscondeDados}
          onMudar={(v) => prefs.definir({ streamerEscondeDados: v })}
        />

        <Opcao data-gc="configuracoes.appearance-section.opcao--6"
          titulo="Esconder links de convite"
          detalhe="O código do convite fica tapado até você clicar para revelar."
          ligado={prefs.streamerEscondeConvites}
          onMudar={(v) => prefs.definir({ streamerEscondeConvites: v })}
        />

        <Opcao data-gc="configuracoes.appearance-section.opcao--7"
          titulo="Silenciar os sons"
          detalhe="Entrar e sair de chamada, mutar, mensagem nova."
          ligado={prefs.streamerSemSom}
          onMudar={(v) => prefs.definir({ streamerSemSom: v })}
        />

        <Opcao data-gc="configuracoes.appearance-section.opcao--8"
          titulo="Não mostrar avisos na tela"
          detalhe="A janelinha do sistema com o que chegou — que é o jeito mais rápido de vazar uma conversa numa live."
          ligado={prefs.streamerSemAvisos}
          onMudar={(v) => prefs.definir({ streamerSemAvisos: v })}
        />
      </Secao>

      <div data-gc="configuracoes.appearance-section.div--7" className="mt-10 border-t border-line pt-5">
        <Button data-gc="configuracoes.appearance-section.button.restaurar-padrao" variant="surface" size="sm" onClick={prefs.restaurarPadrao}>
          Voltar ao padrão
        </Button>
      </div>
    </div>
  );
};
