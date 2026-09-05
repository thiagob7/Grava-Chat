import React, { useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";

import { Switch } from "~/components/ui/switch";
import { campoNu, grupoDeCampo } from "~/components/ui/input";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";
import {
  AJUSTES,
  CATEGORIAS,
  type Ajuste,
  ajustesDosAtalhos,
} from "~/features/configuracoes/lib/ajustes";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { useAtalhos } from "~/features/configuracoes/stores/atalhos";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { useAvisos } from "~/stores/notificacoes";
import { cn } from "~/lib/utils";

export const AvancadoSection: React.FC = () => {
  const abrir = useConfiguracoes((s) => s.abrir);

  useAparencia();
  useAvisos();
  useAtalhos();

  const [busca, setBusca] = useState("");

  const termo = busca.toLowerCase().trim();

  const todos = [...AJUSTES, ...ajustesDosAtalhos()];

  const porCategoria = CATEGORIAS.map((categoria) => ({
    ...categoria,
    ajustes: todos.filter(
      (ajuste) =>
        ajuste.categoria === categoria.id &&
        (!termo ||
          ajuste.rotulo.toLowerCase().includes(termo) ||
          ajuste.detalhe.toLowerCase().includes(termo)),
    ),
  })).filter((categoria) => categoria.ajustes.length);

  return (
    <div data-gc="configuracoes.avancado-section.div" className="max-w-2xl pb-10">
      <p data-gc="configuracoes.avancado-section.p" className="text-sm text-ink-muted">
        Tudo que está espalhado pelas outras telas, numa lista só. Os
        interruptores valem daqui mesmo; o resto leva você até onde ele mora.
      </p>

      <div data-gc="configuracoes.avancado-section.div--2" className={cn(grupoDeCampo, "mt-5")}>
        <Search data-gc="configuracoes.avancado-section.search" size={14} className="shrink-0 text-ink-faint" />
        <input data-gc="configuracoes.avancado-section.input"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Procurar em todas as configurações"
          aria-label="Procurar configuração"
          className={campoNu}
        />
        {busca && (
          <button data-gc="configuracoes.avancado-section.button"
            type="button"
            onClick={() => setBusca("")}
            aria-label="Limpar a busca"
            className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
          >
            <X data-gc="configuracoes.avancado-section.x" size={14} />
          </button>
        )}
      </div>

      {porCategoria.map((categoria) => (
        <Secao data-gc="configuracoes.avancado-section.secao" key={categoria.id} id={`avancado-${categoria.id}`} titulo={categoria.nome}>
          <div data-gc="configuracoes.avancado-section.div--3" className="overflow-hidden rounded-lg border border-line">
            {categoria.ajustes.map((ajuste) => (
              <LinhaDeAjuste data-gc="configuracoes.avancado-section.linha-de-ajuste"
                key={ajuste.id}
                ajuste={ajuste}
                onIr={() => abrir(ajuste.tela, ajuste.sub)}
              />
            ))}
          </div>
        </Secao>
      ))}

      {!porCategoria.length && (
        <p data-gc="configuracoes.avancado-section.p--2" className="mt-6 text-sm text-ink-faint">Nenhuma configuração com esse nome.</p>
      )}
    </div>
  );
};

const LinhaDeAjuste: React.FC<{ ajuste: Ajuste; onIr: () => void }> = ({ ajuste, onIr }) => (
  <div data-gc="configuracoes.avancado-section.div--4" className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0">
    <div data-gc="configuracoes.avancado-section.div--5" className="min-w-0 flex-1">
      <p data-gc="configuracoes.avancado-section.p--3" className="text-sm font-medium">{ajuste.rotulo}</p>
      <p data-gc="configuracoes.avancado-section.p--4" className="mt-0.5 text-xs text-ink-faint">{ajuste.detalhe}</p>
    </div>

    {ajuste.tipo === "interruptor" ? (
      <>
        <button data-gc="configuracoes.avancado-section.button.on-ir"
          type="button"
          onClick={onIr}
          aria-label={`Ir para ${ajuste.rotulo}`}
          title="Ir para onde este ajuste mora"
          className="shrink-0 rounded p-1 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
        >
          <ChevronRight data-gc="configuracoes.avancado-section.chevron-right" size={16} />
        </button>

        <Switch data-gc="configuracoes.avancado-section.switch.escrever"
          checked={ajuste.ler()}
          onCheckedChange={ajuste.escrever}
          aria-label={ajuste.rotulo}
        />
      </>
    ) : (
      <button data-gc="configuracoes.avancado-section.button.on-ir--2"
        type="button"
        onClick={onIr}
        className="flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-xs text-ink-muted transition hover:bg-surface-3 hover:text-ink"
      >
        {ajuste.ler()}
        <ChevronRight data-gc="configuracoes.avancado-section.chevron-right--2" size={14} className="text-ink-faint" />
      </button>
    )}
  </div>
);
