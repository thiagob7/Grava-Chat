import React, { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Search, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { campoNu, grupoDeCampo } from "~/components/ui/input";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";
import {
  AREAS,
  ATALHOS,
  type Atalho,
  type Combo,
  combinam,
  comboDoEvento,
  escreverCombo,
} from "~/features/configuracoes/lib/atalhos";
import { useAtalhos } from "~/features/configuracoes/stores/atalhos";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { cn } from "~/lib/utils";

export const AtalhosSection: React.FC = () => {
  const trocados = useAtalhos((s) => s.trocados);
  const desligados = useAtalhos((s) => s.desligados);
  const restaurarTudo = useAtalhos((s) => s.restaurarTudo);
  const abrir = useConfiguracoes((s) => s.abrir);

  const [busca, setBusca] = useState("");
  const [capturando, setCapturando] = useState<string | null>(null);

  const termo = busca.toLowerCase().trim();

  const mexido = Object.keys(trocados).length > 0 || desligados.length > 0;

  const porArea = useMemo(
    () =>
      AREAS.map((area) => ({
        ...area,
        atalhos: ATALHOS.filter(
          (atalho) =>
            atalho.area === area.id &&
            (!termo ||
              atalho.nome.toLowerCase().includes(termo) ||
              atalho.detalhe.toLowerCase().includes(termo) ||
              escreverCombo(trocados[atalho.id] ?? atalho.padrao)
                .toLowerCase()
                .includes(termo)),
        ),
      })),
    [termo, trocados],
  );

  return (
    <div data-gc="configuracoes.atalhos-section.div" className="max-w-2xl pb-10">
      <p data-gc="configuracoes.atalhos-section.p" className="text-sm text-ink-muted">
        Os atalhos que o Gravaê entende hoje. Os que têm tecla trocável valem em
        qualquer lugar do app; os fixos são do próprio campo de texto e não dá
        pra mexer.
      </p>

      <div data-gc="configuracoes.atalhos-section.div--2" className={cn(grupoDeCampo, "mt-5")}>
        <Search data-gc="configuracoes.atalhos-section.search" size={14} className="shrink-0 text-ink-faint" />
        <input data-gc="configuracoes.atalhos-section.input"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Procurar atalho"
          aria-label="Procurar atalho"
          className={campoNu}
        />
        {busca && (
          <button data-gc="configuracoes.atalhos-section.button"
            type="button"
            onClick={() => setBusca("")}
            aria-label="Limpar a busca"
            className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
          >
            <X data-gc="configuracoes.atalhos-section.x" size={14} />
          </button>
        )}
      </div>

      {porArea.map((area) =>
        area.atalhos.length ? (
          <Secao data-gc="configuracoes.atalhos-section.secao"
            key={area.id}
            id={`atalhos-${area.id}`}
            titulo={area.nome}
            detalhe={area.detalhe}
          >
            <div data-gc="configuracoes.atalhos-section.div--3" className="overflow-hidden rounded-lg border border-line">
              {area.atalhos.map((atalho) => (
                <LinhaDeAtalho data-gc="configuracoes.atalhos-section.linha-de-atalho"
                  key={atalho.id}
                  atalho={atalho}
                  combo={trocados[atalho.id] ?? atalho.padrao}
                  trocado={Boolean(trocados[atalho.id])}
                  ligado={!desligados.includes(atalho.id)}
                  capturando={capturando === atalho.id}
                  onCapturar={() => setCapturando(atalho.id)}
                  onDesistir={() => setCapturando(null)}
                />
              ))}
            </div>

            {area.id === "voz" && (
              <Button data-gc="configuracoes.atalhos-section.button--2"
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => abrir("voz", "modo-de-entrada")}
              >
                Ir para o push-to-talk
              </Button>
            )}
          </Secao>
        ) : null,
      )}

      {!porArea.some((area) => area.atalhos.length) && (
        <p data-gc="configuracoes.atalhos-section.p--2" className="mt-6 text-sm text-ink-faint">Nenhum atalho com esse nome.</p>
      )}

      <Secao data-gc="configuracoes.atalhos-section.secao--2"
        id="voltar-ao-padrao"
        titulo="Voltar ao padrão"
        detalhe="Devolve todas as teclas de fábrica e religa o que você desligou."
      >
        <div data-gc="configuracoes.atalhos-section.div--4" className="flex items-start gap-4">
          <div data-gc="configuracoes.atalhos-section.div--5" className="min-w-0 flex-1">
            <p data-gc="configuracoes.atalhos-section.p--3" className="text-sm font-medium">Restaurar todos os atalhos</p>
            <p data-gc="configuracoes.atalhos-section.p--4" className="mt-0.5 text-xs text-ink-faint">
              {mexido
                ? "Você mexeu em pelo menos um atalho."
                : "Está tudo como veio de fábrica."}
            </p>
          </div>

          <Button data-gc="configuracoes.atalhos-section.button.restaurar-tudo" variant="surface" disabled={!mexido} onClick={restaurarTudo}>
            <RotateCcw data-gc="configuracoes.atalhos-section.rotate-ccw" size={16} /> Restaurar
          </Button>
        </div>
      </Secao>
    </div>
  );
};

const LinhaDeAtalho: React.FC<{
  atalho: Atalho;
  combo: Combo;
  trocado: boolean;
  ligado: boolean;
  capturando: boolean;
  onCapturar: () => void;
  onDesistir: () => void;
}> = ({ atalho, combo, trocado, ligado, capturando, onCapturar, onDesistir }) => {
  const trocar = useAtalhos((s) => s.trocar);
  const devolverPadrao = useAtalhos((s) => s.devolverPadrao);
  const alternar = useAtalhos((s) => s.alternar);

  const botao = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!capturando) return;

    botao.current?.focus();

    const aoTeclar = (evento: KeyboardEvent) => {
      evento.preventDefault();
      evento.stopPropagation();

      if (evento.key === "Escape") return onDesistir();

      const novo = comboDoEvento(evento);
      if (!novo) return;

      const conflito = ATALHOS.find(
        (outro) => outro.id !== atalho.id && combinam(outro.padrao, novo),
      );

      if (conflito) return;

      trocar(atalho.id, novo);
      onDesistir();
    };

    window.addEventListener("keydown", aoTeclar, { capture: true });
    return () => window.removeEventListener("keydown", aoTeclar, { capture: true });
  }, [capturando, atalho.id, trocar, onDesistir]);

  return (
    <div data-gc="configuracoes.atalhos-section.div--6" className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0">
      <div data-gc="configuracoes.atalhos-section.div--7" className="min-w-0 flex-1">
        <p data-gc="configuracoes.atalhos-section.p--5" className={cn("text-sm font-medium", !ligado && "text-ink-faint")}>
          {atalho.nome}
        </p>
        <p data-gc="configuracoes.atalhos-section.p--6" className="mt-0.5 text-xs text-ink-faint">{atalho.detalhe}</p>
      </div>

      {atalho.fixo ? (
        <kbd data-gc="configuracoes.atalhos-section.kbd" className="shrink-0 rounded border border-line bg-surface-0 px-2 py-1 font-mono text-xs text-ink-muted">
          {escreverCombo(combo)}
        </kbd>
      ) : (
        <>
          {trocado && (
            <button data-gc="configuracoes.atalhos-section.button--3"
              type="button"
              onClick={() => devolverPadrao(atalho.id)}
              aria-label={`Voltar ${atalho.nome} ao padrão`}
              title={`Padrão: ${escreverCombo(atalho.padrao)}`}
              className="shrink-0 rounded p-1 text-ink-faint transition hover:text-ink"
            >
              <RotateCcw data-gc="configuracoes.atalhos-section.rotate-ccw--2" size={14} />
            </button>
          )}

          <button data-gc="configuracoes.atalhos-section.button.on-desistir"
            ref={botao}
            type="button"
            onClick={capturando ? onDesistir : onCapturar}
            onBlur={onDesistir}
            disabled={!ligado}
            className={cn(
              "shrink-0 rounded border px-2 py-1 font-mono text-xs transition",
              capturando
                ? "border-brand bg-brand/10 text-ink"
                : "border-line bg-surface-0 text-ink-muted hover:border-ink-faint hover:text-ink",
              !ligado && "opacity-40",
            )}
          >
            {capturando ? "Aperte a tecla…" : escreverCombo(combo)}
          </button>

          <Switch data-gc="configuracoes.atalhos-section.switch"
            checked={ligado}
            onCheckedChange={(valor) => alternar(atalho.id, valor)}
            aria-label={`Ligar ou desligar ${atalho.nome}`}
          />
        </>
      )}
    </div>
  );
};
