import React, { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";

import { Switch } from "~/components/ui/switch";
import { Button } from "~/components/ui/button";
import { CampoSelect } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import {
  calar,
  daPraFalar,
  falar,
  vozesDisponiveis,
  type ModoDeLeitura,
} from "~/lib/voz";
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
        id="texto-em-voz"
        titulo="Texto em voz"
        detalhe="A mensagem que chega, lida em voz alta pela voz que o seu sistema já tem instalada — a mesma do VoiceOver e do Narrador. Nada sai daqui: nenhuma chave, nenhum servidor, nenhum áudio enviado."
      >
        <TextoEmVoz />
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

/*
  A leitura em voz alta, e as três perguntas que ela faz.

  Modo primeiro porque é o que decide se o resto importa: com "nunca", voz e
  velocidade são enfeite. Por isso os dois só aparecem depois que alguém liga.
*/
const TextoEmVoz: React.FC = () => {
  const prefs = useAparencia();
  const [vozes, setVozes] = useState<SpeechSynthesisVoice[]>([]);

  /*
    A lista de vozes chega DEPOIS.

    O Chrome devolve `[]` na primeira chamada e só preenche quando termina de
    carregar as vozes do sistema, avisando por `voiceschanged`. Ler uma vez na
    montagem dá uma caixa de seleção vazia em metade das aberturas — e o bug
    parece "não tenho voz instalada", que é outra coisa.
  */
  useEffect(() => {
    if (!daPraFalar()) return;

    const atualizar = () => setVozes(vozesDisponiveis());

    atualizar();
    window.speechSynthesis.addEventListener("voiceschanged", atualizar);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", atualizar);
      /// Sair da tela com a voz falando deixaria o teste ecoando pelo app.
      calar();
    };
  }, []);

  if (!daPraFalar()) {
    return (
      <p className="text-sm text-ink-muted">
        Este navegador não tem síntese de voz. No aplicativo de desktop e nos
        navegadores atuais ela existe — aqui, não há o que ligar.
      </p>
    );
  }

  const ligado = prefs.lerEmVozAlta !== "nunca";

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Quando ler
        </p>

        <div className="space-y-2">
          {MODOS.map((modo) => (
            <button
              key={modo.valor}
              type="button"
              onClick={() => {
                calar();
                prefs.definir({ lerEmVozAlta: modo.valor });
              }}
              aria-pressed={prefs.lerEmVozAlta === modo.valor}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
                prefs.lerEmVozAlta === modo.valor
                  ? "border-brand bg-brand/5"
                  : "border-line hover:bg-surface-3",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{modo.titulo}</span>
                <span className="mt-0.5 block text-xs text-ink-faint">
                  {modo.detalhe}
                </span>
              </span>

              <span
                aria-hidden
                className={cn(
                  "relative mt-px size-4 shrink-0 rounded-full border transition",
                  prefs.lerEmVozAlta === modo.valor
                    ? "border-brand"
                    : "border-surface-4",
                )}
              >
                {prefs.lerEmVozAlta === modo.valor && (
                  <span className="absolute inset-[3px] rounded-full bg-brand" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {ligado && (
        <>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Voz
            </span>
            <CampoSelect
              valor={prefs.vozDaLeitura ?? ""}
              onEscolher={(valor) =>
                prefs.definir({ vozDaLeitura: valor || null })
              }
              opcoes={[
                { valor: "", rotulo: "A que o sistema escolher" },
                ...vozes.map((voz) => ({
                  valor: voz.name,
                  rotulo: `${voz.name} (${voz.lang})`,
                })),
              ]}
            />
            {!vozes.length && (
              <span className="mt-1.5 block text-xs text-ink-faint">
                Procurando as vozes do sistema…
              </span>
            )}
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Velocidade
              </span>
              <span className="font-mono text-11 text-ink-faint">
                {prefs.velocidadeDaLeitura.toFixed(1)}×
              </span>
            </div>

            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={prefs.velocidadeDaLeitura}
              onChange={(e) =>
                prefs.definir({ velocidadeDaLeitura: Number(e.target.value) })
              }
              aria-label="Velocidade da leitura"
              className="w-full accent-brand"
            />
          </div>

          {/*
            O botão de teste não é conforto: voz e velocidade só se julgam
            ouvindo, e sem ele a única forma de conferir é esperar alguém
            mandar mensagem.
          */}
          <Button
            variant="surface"
            size="sm"
            onClick={() =>
              falar("Ana diz: é assim que as mensagens vão soar.", {
                voz: prefs.vozDaLeitura,
                velocidade: prefs.velocidadeDaLeitura,
              })
            }
          >
            <Volume2 size={14} /> Ouvir uma prova
          </Button>
        </>
      )}
    </div>
  );
};

const MODOS: { valor: ModoDeLeitura; titulo: string; detalhe: string }[] = [
  { valor: "nunca", titulo: "Nunca", detalhe: "Nada é lido em voz alta." },
  {
    valor: "canal-aberto",
    titulo: "Só o canal aberto",
    detalhe:
      "Lê o que chega na conversa que você está vendo. É o modo que serve pro dia a dia.",
  },
  {
    valor: "todos",
    titulo: "Todos os canais",
    detalhe:
      "Lê tudo o que chega, de qualquer servidor. Numa conta movimentada, é uma voz que não para.",
  },
];
