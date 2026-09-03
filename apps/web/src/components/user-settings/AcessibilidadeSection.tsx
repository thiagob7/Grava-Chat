import React from "react";

import { Switch } from "~/components/ui/switch";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";
import { useAparencia } from "~/stores/aparencia";

export const AcessibilidadeSection: React.FC = () => {
  const prefs = useAparencia();

  /*
    O que o SISTEMA já pede.

    Quem ligou "reduzir movimento" no macOS ou no Windows já vinha atendido
    pelo CSS, e dizer isso muda o que o interruptor significa: ele não está
    desligado, está redundante. Sem essa linha, a pessoa desliga aqui achando
    que voltou a ter animação, e nada muda.
  */
  const sistemaPede =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Secao
        id="movimento"
        titulo="Movimento"
        detalhe="Aberturas, deslizes e transições. Desligar não tira nada da tela: só faz o que ia se mover aparecer direto no lugar."
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Reduzir animação</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {sistemaPede
                ? "O seu sistema já pede movimento reduzido, e o Gravaê já obedece. Este botão é para quem quer o mesmo sem mexer no sistema inteiro."
                : "Corta as animações do app inteiro, inclusive as dos avisos e as do painel de chamada."}
            </p>
          </div>

          <Switch
            checked={prefs.reduzirAnimacao}
            onCheckedChange={(reduzirAnimacao) =>
              prefs.definir({ reduzirAnimacao })
            }
          />
        </div>
      </Secao>

      <Secao
        id="teclado"
        titulo="Teclado"
        detalhe="Como o app responde a quem navega sem o mouse."
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Mostrar sempre onde está o foco
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              O navegador esconde o anel de foco de quem clica com o mouse e só
              mostra para quem navega por Tab. Ligue isto para ver o anel sempre
              — é a diferença entre saber e adivinhar qual botão vai responder
              ao Enter.
            </p>
          </div>

          <Switch
            checked={prefs.focoSempreVisivel}
            onCheckedChange={(focoSempreVisivel) =>
              prefs.definir({ focoSempreVisivel })
            }
          />
        </div>

        {/*
          A lista dos atalhos existe porque eles não aparecem em lugar nenhum
          da tela. Um atalho que ninguém descobre é um atalho que não existe, e
          documentá-lo aqui custa menos que espalhar dica por toda a interface.
        */}
        <div className="mt-5 overflow-hidden rounded-lg border border-line">
          {ATALHOS.map((atalho) => (
            <div
              key={atalho.o_que}
              className="flex items-center justify-between gap-4 border-b border-divisor px-3 py-2 last:border-b-0"
            >
              <span className="min-w-0 truncate text-sm">{atalho.o_que}</span>
              <span className="shrink-0 font-mono text-11 text-ink-faint">
                {atalho.teclas}
              </span>
            </div>
          ))}
        </div>
      </Secao>
    </div>
  );
};

/// O que já responde ao teclado hoje. Cresce quando um atalho novo nascer —
/// e é aqui que se descobre que um atalho prometido nunca foi ligado.
const ATALHOS = [
  { o_que: "Enviar a mensagem", teclas: "Enter" },
  { o_que: "Quebrar linha sem enviar", teclas: "Shift + Enter" },
  { o_que: "Editar a última mensagem sua", teclas: "↑ na caixa vazia" },
  { o_que: "Fechar o que estiver aberto", teclas: "Esc" },
  { o_que: "Falar enquanto segura", teclas: "a tecla do push-to-talk" },
];
