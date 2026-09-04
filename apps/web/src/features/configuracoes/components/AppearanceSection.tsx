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
              <span className="relative flex h-14" aria-hidden>
                {tema.amostra.map((cor) => (
                  <span
                    key={cor}
                    className="flex-1"
                    style={{ backgroundColor: cor }}
                  />
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

        <div className="mt-4">
          <Button variant="surface" onClick={() => setEstudioAberto(true)}>
            <Palette size={16} /> Abrir estúdio de temas…
          </Button>
          <p className="mt-1.5 text-xs text-ink-faint">
            Muda cor por cor em cima do tema base, escreve CSS e guarda o
            resultado. Vale só neste aparelho.
          </p>
        </div>

        <EstudioDeTemas
          open={estudioAberto}
          onClose={() => setEstudioAberto(false)}
        />
      </Secao>

      <Secao
        id="cor-de-destaque"
        titulo="Cor de destaque"
        detalhe="A cor dos botões, dos links e de tudo o que o app quer que você veja primeiro."
      >
        <div className="flex flex-wrap items-center gap-2">
          {CORES_DE_DESTAQUE.map((cor, indice) => {
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
                  escolhida &&
                    "ring-2 ring-ink ring-offset-2 ring-offset-surface-2",
                )}
              >
                {escolhida && <Check size={14} />}
              </button>
            );
          })}
        </div>
      </Secao>

      <Secao
        id="zoom-do-app"
        titulo="Nível de zoom do app"
        detalhe="Cresce a interface inteira — texto, ícones, avatares e espaçamentos, na mesma proporção."
      >
        <ControleDeEscala
          valor={prefs.zoomDoApp}
          onMudar={(zoomDoApp) => prefs.definir({ zoomDoApp })}
          min={50}
          max={200}
          passo={5}
          marcas={[50, 75, 100, 125, 150, 200]}
        />
      </Secao>

      <Secao
        id="escala-da-fonte"
        titulo="Escala da fonte do chat"
        detalhe="Cresce só o texto das mensagens. Os menus e a lista de canais ficam como estão."
      >
        <ControleDeEscala
          valor={prefs.escalaDoChat}
          onMudar={(escalaDoChat) => prefs.definir({ escalaDoChat })}
          min={80}
          max={180}
          passo={5}
          marcas={[80, 100, 120, 150, 180]}
        />
      </Secao>

      <Secao
        id="interface"
        titulo="Interface"
        detalhe="O contorno da janela e as colunas que ficam em volta da conversa."
      >
        {ehDesktop() && (
          <Opcao
            titulo="Cantos arredondados"
            detalhe="A curva no alto à esquerda do miolo, onde ele encontra a faixa de título."
            ligado={prefs.cantosArredondados}
            onMudar={(cantosArredondados) =>
              prefs.definir({ cantosArredondados })
            }
          />
        )}

        <Opcao
          titulo="Lista de membros"
          detalhe="A coluna da direita com quem está no servidor. Ela já some sozinha em tela estreita; isto é para quem tem tela larga e prefere a conversa ocupando tudo."
          ligado={prefs.listaDeMembros}
          onMudar={(listaDeMembros) => prefs.definir({ listaDeMembros })}
        />
      </Secao>

      <Secao
        id="lista-de-canais"
        titulo="Lista de canais"
        detalhe="A coluna da esquerda, dentro de um servidor."
      >
        <Opcao
          titulo="Faixa do servidor"
          detalhe="A imagem larga no alto da lista, quando o servidor tem uma. O nome continua logo abaixo de qualquer jeito."
          ligado={prefs.faixaDoServidor}
          onMudar={(faixaDoServidor) => prefs.definir({ faixaDoServidor })}
        />

        <Opcao
          titulo="Lembrar categorias fechadas"
          detalhe="Fechar uma categoria passa a valer na próxima vez que você abrir o app. Desligado, tudo volta aberto a cada recarga."
          ligado={prefs.lembrarCategoriasFechadas}
          onMudar={(lembrarCategoriasFechadas) =>
            prefs.definir({ lembrarCategoriasFechadas })
          }
        />
      </Secao>

      <Secao
        id="modo-streamer"
        titulo="Privacidade de transmissão"
        detalhe="Para quando a sua tela está sendo vista por gente que não está na conversa."
      >
        <div className="mb-3 flex items-start gap-3 rounded bg-surface-2 p-3">
          <Video
            size={18}
            className={cn(
              "mt-0.5 shrink-0",
              prefs.modoStreamer ? "text-brand" : "text-ink-faint",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {prefs.modoStreamer
                ? "Ligado — a tela está protegida"
                : "Desligado"}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Ligue antes de começar a transmitir. O que estiver marcado abaixo
              some da tela enquanto ele estiver de pé.
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
