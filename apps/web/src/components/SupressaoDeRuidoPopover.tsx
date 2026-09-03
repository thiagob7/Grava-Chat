import React, { useState } from "react";
import { AudioLines, Loader2, SlidersHorizontal } from "lucide-react";

import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { useVoiceMeter } from "~/hooks/use-voice-meter";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface Props {
  children: React.ReactNode;
  ligada: boolean;
  disponivel: boolean;
  ocupada: boolean;
  onAlternar: () => void;
  onAbrirAjustes: () => void;
}

/*
  O que abre ao clicar no ícone de supressão, na barra da chamada.

  Antes o clique LIGAVA e DESLIGAVA direto, e a única explicação do que estava
  acontecendo era um tooltip que sumia. Duas coisas erradas nisso: ninguém sabia
  o que a supressão faz sem experimentar no meio de uma conversa, e não havia
  como conferir o resultado sem pedir "tá me ouvindo bem?" pra alguém.

  Popover, e não janela: isto se usa DURANTE a chamada, e uma janela que tapa a
  tela pra mexer no microfone é justamente o que atrapalha. O medidor ao vivo é
  o coração — bater palma e ver a barra não subir vale mais que qualquer texto.
*/
export const SupressaoDeRuidoPopover: React.FC<Props> = ({
  children,
  ligada,
  disponivel,
  ocupada,
  onAlternar,
  onAbrirAjustes,
}) => {
  const { t } = useTranslation();
  const [aberto, setAberto] = useState(false);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent side="top" align="end" className="w-80 p-4">
        {/*
          O gatilho é um ícone no meio de uma fileira de ícones, e o balão sai
          alinhado pela ponta direita: sem a seta, ele é um cartão que aparece
          perto de quatro botões e não diz de qual deles saiu.
        */}
        <PopoverArrow />

        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <AudioLines size={16} className={ligada && disponivel ? "text-online" : undefined} />
            {t("chamada.ruido.titulo")}
          </h3>

          <Switch
            checked={ligada && disponivel}
            disabled={!disponivel || ocupada}
            onCheckedChange={onAlternar}
          />
        </div>

        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          {disponivel
            ? t("chamada.ruido.explicacao")
            : t("chamada.ruido.semSuporte")}
        </p>

        {ocupada && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
            <Loader2 size={12} className="animate-spin" /> {t("chamada.ruido.aplicando")}
          </p>
        )}

        <TesteDoMicrofone aberto={aberto} />

        <div className="mt-4 flex items-center justify-between border-t border-divisor pt-3">
          <span className="text-xs text-ink-faint">
            {t("chamada.ruido.feitoCom")} <span className="text-ink-muted">RNNoise</span>{t("chamada.ruido.aquiNoAparelho")}
          </span>

          <button
            onClick={() => {
              setAberto(false);
              onAbrirAjustes();
            }}
            className="flex shrink-0 items-center gap-1.5 rounded p-1.5 text-xs text-ink-muted transition hover:bg-surface-3 hover:text-ink"
          >
            <SlidersHorizontal size={13} /> {t("chamada.ruido.ajustes")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/*
  O medidor só liga quando o popover está aberto.

  Ele abre um segundo caminho de áudio do microfone; mantê-lo vivo o tempo todo
  gastaria CPU e deixaria a luzinha da câmera/mic acesa sem motivo, o que
  assusta com razão.
*/
const TesteDoMicrofone: React.FC<{ aberto: boolean }> = ({ aberto }) => {
  const { t } = useTranslation();
  const { nivel, aberto: passando, erro } = useVoiceMeter(aberto);

  if (erro)
    return <p className="mt-3 text-xs text-danger">Não consegui ouvir o microfone: {erro}</p>;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-ink-muted">{t("chamada.ruido.faleParaTestar")}</p>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-0">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-75",
            passando ? "bg-online" : "bg-surface-4",
          )}
          style={{ width: `${Math.min(100, nivel * 100)}%` }}
        />
      </div>

      <p className="mt-1.5 text-11 text-ink-faint">
        {t(passando ? "chamada.ruido.teOuvindo" : "chamada.ruido.verdeQuandoPassa")}
      </p>
    </div>
  );
};
