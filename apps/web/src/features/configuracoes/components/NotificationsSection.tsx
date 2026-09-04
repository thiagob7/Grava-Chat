import React, { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import {
  pedirPermissaoDeAviso,
  permissaoDeAviso,
  type PermissaoDeAviso,
} from "~/lib/notificacoes";
import { useAvisos } from "~/stores/notificacoes";
import { GRUPOS_DE_SONS, tocarSom } from "~/lib/ui-sounds";
import { Play } from "lucide-react";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";
import { desktop } from "~/lib/desktop";

export const NotificationsSection: React.FC = () => {
  const prefs = useAvisos();
  const [permissao, setPermissao] = useState<PermissaoDeAviso>(() =>
    permissaoDeAviso(),
  );

  useEffect(() => {
    const reler = () => setPermissao(permissaoDeAviso());
    document.addEventListener("visibilitychange", reler);
    return () => document.removeEventListener("visibilitychange", reler);
  }, []);

  const ponte = desktop();

  return (
    <div className="max-w-xl">
      <p className="text-sm text-ink-muted">
        Vale para este aparelho. A mesma conta aberta no trabalho pode ficar
        quieta enquanto a de casa apita.
      </p>

      {permissao === "perguntar" && (
        <div className="mt-5 flex items-start gap-3 rounded bg-brand/10 p-3">
          <Bell size={18} className="mt-0.5 shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Falta o sistema deixar</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              O aviso na tela precisa de uma autorização do{" "}
              {ponte ? "sistema" : "navegador"}. Sem ela, o som e o contador no
              título continuam funcionando.
            </p>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => void pedirPermissaoDeAviso().then(setPermissao)}
            >
              Permitir avisos
            </Button>
          </div>
        </div>
      )}

      {permissao === "negada" && (
        <div className="mt-5 flex items-start gap-3 rounded bg-idle/10 p-3">
          <BellOff size={18} className="mt-0.5 shrink-0 text-idle" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Os avisos estão bloqueados</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {ponte
                ? "Libere o Gravaê em Ajustes do Sistema → Notificações."
                : "O navegador guardou um “bloquear” para este endereço — o botão de pedir não aparece mais. Libere no cadeado ao lado da barra de endereço."}{" "}
              O som e o contador no título não dependem disso.
            </p>
          </div>
        </div>
      )}

      <Secao
        id="geral"
        titulo="Geral"
        detalhe="O que te interrompe enquanto o Gravaê está atrás de outra coisa."
      >
        <Opcao
          titulo="Aviso na tela"
          detalhe="A janelinha do sistema quando chega mensagem com o Gravaê atrás de outra coisa. Com a janela na frente ele não aparece — você já está vendo."
          ligado={prefs.aviso}
          onMudar={(v) => prefs.definir({ aviso: v })}
        />

        <Opcao
          titulo="Contador no título"
          detalhe={
            ponte
              ? "O número de menções na aba e no ícone do app — o balãozinho do Dock."
              : "O número de menções no título da aba, para achar o Gravaê no meio de vinte abas."
          }
          ligado={prefs.contador}
          onMudar={(v) => prefs.definir({ contador: v })}
        />
      </Secao>

      <Secao
        id="preferencia-de-mencao"
        titulo="Preferência de menção"
        detalhe="O que conta como te chamar — e o que passa em silêncio."
      >
        <Opcao
          titulo="Só quando me chamarem"
          detalhe="Menção direta, cargo seu, @everyone e conversas privadas. O resto passa em silêncio."
          ligado={prefs.soMencoes}
          onMudar={(v) => prefs.definir({ soMencoes: v })}
        />
      </Secao>

      <Secao
        id="sons"
        titulo="Sons"
        detalhe="O interruptor de cima cala todos. Abaixo dele, cada um por vez — clique no nome para ouvir."
      >
        <Opcao
          titulo="Som"
          detalhe="O aviso do Gravaê para mensagem e duas notas para menção. Não toca no canal que você está lendo."
          ligado={prefs.som}
          onMudar={(v) => {
            prefs.definir({ som: v });
            if (v) tocarSom("mensagem");
          }}
        />
        <ListaDeSons />
      </Secao>
    </div>
  );
};

const Opcao: React.FC<{
  titulo: string;
  detalhe: string;
  ligado: boolean;
  onMudar: (valor: boolean) => void;
}> = ({ titulo, detalhe, ligado, onMudar }) => (
  <div className="mt-4 flex items-start gap-4">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{titulo}</p>
      <p className="mt-0.5 text-xs text-ink-faint">{detalhe}</p>
    </div>
    <Switch checked={ligado} onCheckedChange={onMudar} />
  </div>
);

const ListaDeSons: React.FC = () => {
  const sonsDesligados = useAvisos((s) => s.sonsDesligados);
  const definirSom = useAvisos((s) => s.definirSom);
  const somGeral = useAvisos((s) => s.som);

  return (
    <div className={somGeral ? "" : "pointer-events-none opacity-50"}>
      {GRUPOS_DE_SONS.map((grupo) => (
        <div key={grupo.titulo} className="mt-6 first:mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {grupo.titulo}
          </p>

          <div className="mt-2 overflow-hidden rounded-lg border border-line">
            {grupo.sons.map((som) => {
              const ligado = !sonsDesligados[som.nome];

              return (
                <div
                  key={som.nome}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => tocarSom(som.nome)}
                    aria-label={`Ouvir ${som.rotulo}`}
                    className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-ink-faint transition hover:border-ink-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                  >
                    <Play size={12} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{som.rotulo}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {som.quando}
                    </p>
                  </div>

                  <Switch
                    checked={ligado}
                    onCheckedChange={(v) => definirSom(som.nome, v)}
                    aria-label={`Tocar ${som.rotulo}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
