import React from "react";

import { CampoSelect } from "~/components/ui/select";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";
import { useAparencia } from "~/stores/aparencia";
import { formatTime } from "~/lib/format";

export const IdiomaSection: React.FC = () => {
  const prefs = useAparencia();

  /*
    Um exemplo com a hora de AGORA, e não uma hora inventada.

    "13:45" e "1:45 PM" explicam a diferença, mas uma hora que não é a sua faz
    a pessoa conferir duas vezes se entendeu. Com a hora atual, o exemplo é
    verificável de relance — basta olhar o relógio.
  */
  const agora = formatTime(new Date().toISOString());

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Secao
        id="formato-da-hora"
        titulo="Formato da hora"
        detalhe="Como o horário aparece nas mensagens e nos avisos."
      >
        {/*
          A caixa de largura fixa não é enfeite: o `SelectTrigger` é `w-full`,
          e solto numa linha flexível ele cresce por cima do texto à esquerda —
          foi o que escondeu o "Agora seriam..." atrás do seletor. É a mesma
          medida que as outras telas usam, pra tudo alinhar na mesma coluna.
        */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Relógio</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              Agora seriam {agora}.
            </p>
          </div>

          <div className="w-52 shrink-0">
            <CampoSelect
              valor={prefs.horaEm24h ? "24h" : "12h"}
              onEscolher={(v) => prefs.definir({ horaEm24h: v === "24h" })}
              opcoes={[
                { valor: "24h", rotulo: "24 horas" },
                { valor: "12h", rotulo: "12 horas (AM/PM)" },
              ]}
            />
          </div>
        </div>
      </Secao>
    </div>
  );
};
