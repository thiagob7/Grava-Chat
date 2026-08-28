import React from "react";
import { Monitor, MonitorX } from "lucide-react";

import { Tooltip } from "~/components/ui/tooltip";
import { useVoiceStore } from "~/stores/voice-store";
import { cn } from "~/lib/utils";

/**
 * O que você está transmitindo, num cartão PRÓPRIO acima do bloco da chamada.
 *
 * Existe porque "estou compartilhando tela" e "estou compartilhando O QUÊ" são
 * informações diferentes, e só a primeira aparecia em algum lugar. Quem alterna
 * entre a janela do jogo e o navegador perde a conta de qual das duas foi
 * escolhida — e descobre pelo caminho ruim, quando alguém avisa que está vendo
 * a coisa errada.
 *
 * O ícone vem do `desktopCapturer` do Electron; no navegador não há ícone e o
 * quadradinho com o monitor faz o papel dele.
 */
export const CartaoDaTransmissao: React.FC<{ className?: string }> = ({ className }) => {
  const fonte = useVoiceStore((s) => s.fonteDaTela);
  const transmitindo = useVoiceStore((s) => s.screenEnabled);
  const encerrar = useVoiceStore((s) => s.toggleScreen);

  if (!transmitindo || !fonte) return null;

  return (
    <div
      className={cn(
        /*
          Cartão separado, e não uma faixa dentro do painel de voz: o que se
          transmite é uma coisa à parte de estar numa chamada — começa e termina
          sozinho, e some sem levar nada junto. Dentro do painel ele parecia
          mais um campo do bloco da chamada.
        */
        "relative z-30 flex items-center gap-2 rounded-lg bg-surface-2 px-2 py-1.5",
        "shadow-lg shadow-black/30 ring-1 ring-white/[0.04]",
        className,
      )}
    >
      {/*
        O ícone leva um selo de câmera no canto, como na referência. Ele é o que
        diz "isto está sendo transmitido" — sem o selo, o ícone do app parece
        apenas decoração ao lado de um nome.
      */}
      <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded bg-surface-4">
        {fonte.icone ? (
          <img src={fonte.icone} alt="" className="size-full object-contain" />
        ) : (
          <Monitor size={15} className="text-ink-muted" />
        )}

        <span className="absolute -bottom-px -right-px flex size-3.5 items-center justify-center rounded-sm bg-surface-3">
          <Videocam />
        </span>
      </span>

      <span className="min-w-0 flex-1 truncate text-xs font-semibold" title={fonte.nome}>
        {fonte.nome}
      </span>

      <Tooltip label="Parar de compartilhar">
        <button
          onClick={() => void encerrar()}
          aria-label="Parar de compartilhar"
          className="shrink-0 rounded p-1 text-ink-muted transition hover:bg-surface-4 hover:text-danger"
        >
          <MonitorX size={14} />
        </button>
      </Tooltip>
    </div>
  );
};

/// O selinho de câmera sobre o ícone do app — o mesmo desenho da referência,
/// pequeno demais pra valer um ícone da biblioteca.
const Videocam: React.FC = () => (
  <svg viewBox="0 0 16 16" className="size-2.5 fill-ink" aria-hidden>
    <path d="M1.5 4h7A1.5 1.5 0 0 1 10 5.5v5A1.5 1.5 0 0 1 8.5 12h-7A1.5 1.5 0 0 1 0 10.5v-5A1.5 1.5 0 0 1 1.5 4Zm10.2 2.1 2.6-1.5a.5.5 0 0 1 .7.44v5.92a.5.5 0 0 1-.7.44l-2.6-1.5a.5.5 0 0 1-.25-.44V6.54a.5.5 0 0 1 .25-.44Z" />
  </svg>
);
