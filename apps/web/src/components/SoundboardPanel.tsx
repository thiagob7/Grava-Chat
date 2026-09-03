import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { LIMITS } from "@gravae/shared";
import { Music2, Search, Volume2, VolumeX } from "lucide-react";

import { useFindExpressions } from "~/@core/application/queries/expression/use-expressions";
import { playSound } from "~/@core/lib/websocket/emit-voice";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import { Tooltip } from "~/components/ui/tooltip";
import { useVoicePrefs } from "~/stores/voice-prefs";
import { useVoiceStore } from "~/stores/voice-store";
import { cn } from "~/lib/utils";

interface SoundboardPanelProps {
  guildId: string | undefined;
  podeUsar: boolean;
}

export const SoundboardPanel: React.FC<SoundboardPanelProps> = ({ guildId, podeUsar }) => {
  const { data } = useFindExpressions(guildId);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);

  /// Ensurdecido é ensurdecido: quem desligou os dois não vai tocar som pra
  /// chamada sem ouvir o que mandou. O Discord apaga o botão nessa hora, e é
  /// o que faz sentido — sem isso dá pra soltar áudio às cegas.
  const surdo = useVoiceStore((s) => s.deafened);
  const somDoPainel = useVoicePrefs((s) => s.somDoPainel);
  const volumeDoPainel = useVoicePrefs((s) => s.volumeDoPainel);
  const definir = useVoicePrefs((s) => s.definir);

  const [volumeAberto, setVolumeAberto] = useState(false);

  /*
    O balão do volume fecha com carência.

    Entre o ícone e o balão existe um vão — e no instante em que o mouse entra
    nele não está mais em cima de nenhum dos dois. Sem a carência, o balão
    sumia bem no meio do caminho e não dava pra chegar na faixa.
  */
  const saindo = useRef<ReturnType<typeof setTimeout>>(undefined);

  const mostrarVolume = () => {
    clearTimeout(saindo.current);
    setVolumeAberto(true);
  };

  const esconderVolume = () => {
    clearTimeout(saindo.current);
    saindo.current = setTimeout(() => setVolumeAberto(false), 220);
  };

  /*
    Enquanto a espera corre, os botões ficam apagados. Sem isso, quem aperta
    depressa levava um aviso de erro na tela a cada clique — a trava do
    servidor recusa o segundo som, e a recusa virava toast.
  */
  const [esperando, setEsperando] = useState(false);
  const relogio = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(relogio.current);
      clearTimeout(saindo.current);
    },
    [],
  );

  const tocar = (id: string) => {
    if (esperando) return;

    setEsperando(true);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setEsperando(false), LIMITS.somEsperaMs);

    void playSound(id).catch((e: Error) => toast.error(e.message));
  };

  const sons = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return data.sounds;

    return data.sounds.filter((som) => som.name.toLowerCase().includes(termo));
  }, [data.sounds, busca]);

  const porcento = Math.round(volumeDoPainel * 100);

  /// Ensurdecer com o painel aberto fecha o painel: senão dava pra continuar
  /// apertando som pra chamada inteira sem ouvir nada do que saiu.
  useEffect(() => {
    if (surdo) setAberto(false);
  }, [surdo]);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        {/*
          `aria-disabled` no lugar de `disabled`: botão desabilitado de
          verdade não recebe evento de mouse — nem o filho —, e aí o balão que
          explica POR QUE ele está apagado nunca apareceria. O clique morre no
          `preventDefault`, que o Radix respeita e não abre o painel.
        */}
        <button
          aria-label="Efeitos sonoros"
          aria-disabled={surdo}
          onClick={(e) => surdo && e.preventDefault()}
          className={cn(
            "flex items-center justify-center rounded-lg bg-hover py-2 text-ink-muted transition",
            surdo ? "cursor-not-allowed opacity-40" : "hover:bg-surface-4 hover:text-ink",
          )}
        >
          <Tooltip
            label={surdo ? "Ative o áudio pra usar os efeitos sonoros" : "Abrir efeitos sonoros"}
          >
            <Music2 size={18} />
          </Tooltip>
        </button>
      </PopoverTrigger>

      {/*
        `collisionPadding`: o gatilho fica na barra de baixo, coladinho na
        esquerda da janela, e sem folga o balão nascia grudado na borda —
        parecia cortado pela tela.
      */}
      <PopoverContent side="top" align="center" collisionPadding={12} className="w-[21rem] p-0">
        <div className="flex items-center gap-2 border-b border-divisor p-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            {/*
              Foco neutro. O padrão do app acende a borda e um anel na cor da
              marca — que é vermelha, e num campo de busca dentro de um balão
              escuro lia como erro de formulário, não como "estou aqui".
            */}
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Encontre o som perfeito"
              className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-white/15 focus-visible:ring-0"
            />
          </div>

          {/*
            Só o ícone, como no Discord: o clique cala os sons, e o mouse
            parado em cima abre o volume. Antes era um ícone dentro de uma
            caixinha cinza que virava vermelha — chamava mais atenção que os
            próprios sons, e a faixa de volume ocupava um rodapé inteiro do
            cartão.

            O `<div>` em volta é o que segura o balão aberto: como o conteúdo
            nasce aqui dentro (`portal={false}`), atravessar o vão entre o
            ícone e o balão não conta como sair.
          */}
          <div
            className="shrink-0"
            onMouseEnter={mostrarVolume}
            onMouseLeave={esconderVolume}
          >
            <Popover open={volumeAberto} onOpenChange={setVolumeAberto}>
              <PopoverAnchor asChild>
                <button
                  type="button"
                  aria-pressed={!somDoPainel}
                  aria-label={somDoPainel ? "Desativar os sons" : "Ativar os sons"}
                  onClick={() => definir({ somDoPainel: !somDoPainel })}
                  className={cn(
                    "p-1 transition",
                    somDoPainel ? "text-ink-muted hover:text-ink" : "text-danger hover:text-danger/80",
                  )}
                >
                  {somDoPainel ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
              </PopoverAnchor>

              <PopoverContent
                side="right"
                align="center"
                sideOffset={6}
                onMouseEnter={mostrarVolume}
                onMouseLeave={esconderVolume}
                portal={false}
                collisionPadding={12}
                /// o foco é da busca; roubá-lo ao passar o mouse fecharia o teclado
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="w-60 p-3"
              >
                <PopoverArrow />

                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-ink-muted">Volume dos efeitos sonoros</span>
                  <span className="shrink-0 tabular-nums text-ink-faint">
                    {somDoPainel ? `${porcento}%` : "mudo"}
                  </span>
                </div>

                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={volumeDoPainel}
                  preenchido={somDoPainel ? volumeDoPainel : 0}
                  disabled={!somDoPainel}
                  aria-label="Volume dos efeitos sonoros"
                  onChange={(e) => definir({ volumeDoPainel: Number(e.target.value) })}
                  className={somDoPainel ? undefined : "opacity-50"}
                />

                <p className="mt-2.5 text-11 leading-snug text-ink-faint">
                  {somDoPainel
                    ? "Vale só pra você. Clique no alto-falante pra desativar os sons."
                    : "Os sons estão desativados. Clique no alto-falante pra ouvir de novo."}
                </p>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Sons do servidor
          </h3>

          {!data.sounds.length && (
            <p className="py-6 text-center text-sm text-ink-muted">
              Nenhum som ainda. Quem gerencia expressões pode subir até 8 em Configurações do
              servidor.
            </p>
          )}

          {data.sounds.length > 0 && !sons.length && (
            <p className="py-6 text-center text-sm text-ink-muted">Nenhum som com esse nome.</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {sons.map((som) => (
              <button
                key={som.id}
                disabled={!podeUsar || esperando || surdo}
                onClick={() => tocar(som.id)}
                title={som.name}
                className="flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-2 text-left transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {/*
                  `||`, não `??`: som sem emoji vem com string vazia, e o `??`
                  deixava o botão com um buraco no lugar do ícone.
                */}
                <span className="shrink-0 text-base leading-none">{som.emoji || "🔊"}</span>
                <span className="min-w-0 flex-1 truncate text-xs">{som.name}</span>
              </button>
            ))}
          </div>

          {!podeUsar && data.sounds.length > 0 && (
            <p className="mt-3 text-xs text-ink-faint">
              Você não tem a permissão “Usar efeitos sonoros” neste servidor.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
