import React, { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";

import { Switch } from "~/components/ui/switch";
import { Button } from "~/components/ui/button";
import { SelectField } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import {
  silence,
  fromForSpeak,
  speak,
  availableVoices,
  type ReadingMode,
} from "~/lib/voz";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";

export const AccessibilitySection: React.FC = () => {
  const prefs = useAppearance();

  const systemAsks =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div data-gc="configuracoes.acessibilidade-section.div">
      <p data-gc="configuracoes.acessibilidade-section.p" className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Section data-gc="configuracoes.acessibilidade-section.section"
        id="movimento"
        title="Movimento"
        detail="Aberturas, deslizes e transições. Desligar não tira nada da tela: só faz o que ia se mover aparecer direto no lugar."
      >
        <div data-gc="configuracoes.acessibilidade-section.div--2" className="flex items-start gap-4">
          <div data-gc="configuracoes.acessibilidade-section.div--3" className="min-w-0 flex-1">
            <p data-gc="configuracoes.acessibilidade-section.p--2" className="text-sm font-medium">Reduzir animação</p>
            <p data-gc="configuracoes.acessibilidade-section.p--3" className="mt-0.5 text-xs text-ink-faint">
              {systemAsks
                ? "O seu sistema já pede movimento reduzido, e o Gravaê já obedece. Este botão é para quem quer o mesmo sem mexer no sistema inteiro."
                : "Corta as animações do app inteiro, inclusive as dos avisos e as do painel de chamada."}
            </p>
          </div>

          <Switch data-gc="configuracoes.acessibilidade-section.switch"
            checked={prefs.reduceAnimation}
            onCheckedChange={(reduceAnimation) =>
              prefs.set({ reduceAnimation })
            }
          />
        </div>
      </Section>

      <Section data-gc="configuracoes.acessibilidade-section.section--2"
        id="texto-em-voz"
        title="Texto em voz"
        detail="A mensagem que chega, lida em voz alta pela voz que o seu sistema já tem instalada — a mesma do VoiceOver e do Narrador. Nada sai daqui: nenhuma chave, nenhum servidor, nenhum áudio enviado."
      >
        <TextVoice data-gc="configuracoes.acessibilidade-section.text-voice" />
      </Section>

      <Section data-gc="configuracoes.acessibilidade-section.section--3"
        id="teclado"
        title="Teclado"
        detail="Como o app responde a quem navega sem o mouse."
      >
        <div data-gc="configuracoes.acessibilidade-section.div--4" className="flex items-start gap-4">
          <div data-gc="configuracoes.acessibilidade-section.div--5" className="min-w-0 flex-1">
            <p data-gc="configuracoes.acessibilidade-section.p--4" className="text-sm font-medium">
              Mostrar sempre onde está o foco
            </p>
            <p data-gc="configuracoes.acessibilidade-section.p--5" className="mt-0.5 text-xs text-ink-faint">
              O navegador esconde o anel de foco de quem clica com o mouse e só
              mostra para quem navega por Tab. Ligue isto para ver o anel sempre
              — é a diferença entre saber e adivinhar qual botão vai responder
              ao Enter.
            </p>
          </div>

          <Switch data-gc="configuracoes.acessibilidade-section.switch--2"
            checked={prefs.visibleFocusAlways}
            onCheckedChange={(visibleFocusAlways) =>
              prefs.set({ visibleFocusAlways })
            }
          />
        </div>

        <div data-gc="configuracoes.acessibilidade-section.div--6" className="mt-5 overflow-hidden rounded-lg border border-line">
          {SHORTCUTS.map((shortcut) => (
            <div data-gc="configuracoes.acessibilidade-section.div--7"
              key={shortcut.o_que}
              className="flex items-center justify-between gap-4 border-b border-divisor px-3 py-2 last:border-b-0"
            >
              <span data-gc="configuracoes.acessibilidade-section.span" className="min-w-0 truncate text-sm">{shortcut.o_que}</span>
              <span data-gc="configuracoes.acessibilidade-section.span--2" className="shrink-0 font-mono text-11 text-ink-faint">
                {shortcut.keys}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

const SHORTCUTS = [
  { o_que: "Enviar a mensagem", keys: "Enter" },
  { o_que: "Quebrar linha sem enviar", keys: "Shift + Enter" },
  { o_que: "Editar a última mensagem sua", keys: "↑ na caixa vazia" },
  { o_que: "Fechar o que estiver aberto", keys: "Esc" },
  { o_que: "Falar enquanto segura", keys: "a tecla do push-to-talk" },
];

const TextVoice: React.FC = () => {
  const prefs = useAppearance();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!fromForSpeak()) return;

    const update = () => setVoices(availableVoices());

    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", update);
      silence();
    };
  }, []);

  if (!fromForSpeak()) {
    return (
      <p data-gc="configuracoes.acessibilidade-section.p--6" className="text-sm text-ink-muted">
        Este navegador não tem síntese de voz. No aplicativo de desktop e nos
        navegadores atuais ela existe — aqui, não há o que ligar.
      </p>
    );
  }

  const on = prefs.readVoiceHigh !== "nunca";

  return (
    <div data-gc="configuracoes.acessibilidade-section.div--8" className="space-y-5">
      <div data-gc="configuracoes.acessibilidade-section.div--9">
        <p data-gc="configuracoes.acessibilidade-section.p--7" className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Quando ler
        </p>

        <div data-gc="configuracoes.acessibilidade-section.div--10" className="space-y-2">
          {MODES.map((mode) => (
            <button data-gc="configuracoes.acessibilidade-section.button"
              key={mode.value}
              type="button"
              onClick={() => {
                silence();
                prefs.set({ readVoiceHigh: mode.value });
              }}
              aria-pressed={prefs.readVoiceHigh === mode.value}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
                prefs.readVoiceHigh === mode.value
                  ? "border-brand bg-brand/5"
                  : "border-line hover:bg-surface-3",
              )}
            >
              <span data-gc="configuracoes.acessibilidade-section.span--3" className="min-w-0 flex-1">
                <span data-gc="configuracoes.acessibilidade-section.span--4" className="block text-sm font-medium">{mode.title}</span>
                <span data-gc="configuracoes.acessibilidade-section.span--5" className="mt-0.5 block text-xs text-ink-faint">
                  {mode.detail}
                </span>
              </span>

              <span data-gc="configuracoes.acessibilidade-section.span--6"
                aria-hidden
                className={cn(
                  "relative mt-px size-4 shrink-0 rounded-full border transition",
                  prefs.readVoiceHigh === mode.value
                    ? "border-brand"
                    : "border-surface-4",
                )}
              >
                {prefs.readVoiceHigh === mode.value && (
                  <span data-gc="configuracoes.acessibilidade-section.span--7" className="absolute inset-[3px] rounded-full bg-brand" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {on && (
        <>
          <label data-gc="configuracoes.acessibilidade-section.label" className="block">
            <span data-gc="configuracoes.acessibilidade-section.span--8" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Voz
            </span>
            <SelectField data-gc="configuracoes.acessibilidade-section.select-field"
              value={prefs.readingVoice ?? ""}
              onSelect={(value) =>
                prefs.set({ readingVoice: value || null })
              }
              options={[
                { value: "", label: "A que o sistema escolher" },
                ...voices.map((voice) => ({
                  value: voice.name,
                  label: `${voice.name} (${voice.lang})`,
                })),
              ]}
            />
            {!voices.length && (
              <span data-gc="configuracoes.acessibilidade-section.span--9" className="mt-1.5 block text-xs text-ink-faint">
                Procurando as vozes do sistema…
              </span>
            )}
          </label>

          <div data-gc="configuracoes.acessibilidade-section.div--11">
            <div data-gc="configuracoes.acessibilidade-section.div--12" className="mb-2 flex items-center justify-between">
              <span data-gc="configuracoes.acessibilidade-section.span--10" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Velocidade
              </span>
              <span data-gc="configuracoes.acessibilidade-section.span--11" className="font-mono text-11 text-ink-faint">
                {prefs.readingSpeed.toFixed(1)}×
              </span>
            </div>

            <input data-gc="configuracoes.acessibilidade-section.input"
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={prefs.readingSpeed}
              onChange={(e) =>
                prefs.set({ readingSpeed: Number(e.target.value) })
              }
              aria-label="Velocidade da leitura"
              className="w-full accent-brand"
            />
          </div>

          <Button data-gc="configuracoes.acessibilidade-section.button--2"
            variant="surface"
            size="sm"
            onClick={() =>
              speak("Ana diz: é assim que as mensagens vão soar.", {
                voice: prefs.readingVoice,
                speed: prefs.readingSpeed,
              })
            }
          >
            <Volume2 data-gc="configuracoes.acessibilidade-section.volume2" size={14} /> Ouvir uma prova
          </Button>
        </>
      )}
    </div>
  );
};

const MODES: { value: ReadingMode; title: string; detail: string }[] = [
  { value: "nunca", title: "Nunca", detail: "Nada é lido em voz alta." },
  {
    value: "canal-aberto",
    title: "Só o canal aberto",
    detail:
      "Lê o que chega na conversa que você está vendo. É o modo que serve pro dia a dia.",
  },
  {
    value: "todos",
    title: "Todos os canais",
    detail:
      "Lê tudo o que chega, de qualquer servidor. Numa conta movimentada, é uma voz que não para.",
  },
];
