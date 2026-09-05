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
    <div data-gc="configuracoes.notifications-section.div" className="max-w-xl">
      <p data-gc="configuracoes.notifications-section.p" className="text-sm text-ink-muted">
        Vale para este aparelho. A mesma conta aberta no trabalho pode ficar
        quieta enquanto a de casa apita.
      </p>

      {permissao === "perguntar" && (
        <div data-gc="configuracoes.notifications-section.div--2" className="mt-5 flex items-start gap-3 rounded bg-brand/10 p-3">
          <Bell data-gc="configuracoes.notifications-section.bell" size={18} className="mt-0.5 shrink-0 text-brand" />
          <div data-gc="configuracoes.notifications-section.div--3" className="min-w-0 flex-1">
            <p data-gc="configuracoes.notifications-section.p--2" className="text-sm font-medium">Falta o sistema deixar</p>
            <p data-gc="configuracoes.notifications-section.p--3" className="mt-0.5 text-xs text-ink-muted">
              O aviso na tela precisa de uma autorização do{" "}
              {ponte ? "sistema" : "navegador"}. Sem ela, o som e o contador no
              título continuam funcionando.
            </p>
            <Button data-gc="configuracoes.notifications-section.button"
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
        <div data-gc="configuracoes.notifications-section.div--4" className="mt-5 flex items-start gap-3 rounded bg-idle/10 p-3">
          <BellOff data-gc="configuracoes.notifications-section.bell-off" size={18} className="mt-0.5 shrink-0 text-idle" />
          <div data-gc="configuracoes.notifications-section.div--5" className="min-w-0 flex-1">
            <p data-gc="configuracoes.notifications-section.p--4" className="text-sm font-medium">Os avisos estão bloqueados</p>
            <p data-gc="configuracoes.notifications-section.p--5" className="mt-0.5 text-xs text-ink-muted">
              {ponte
                ? "Libere o Gravaê em Ajustes do Sistema → Notificações."
                : "O navegador guardou um “bloquear” para este endereço — o botão de pedir não aparece mais. Libere no cadeado ao lado da barra de endereço."}{" "}
              O som e o contador no título não dependem disso.
            </p>
          </div>
        </div>
      )}

      <Secao data-gc="configuracoes.notifications-section.secao"
        id="geral"
        titulo="Geral"
        detalhe="O que te interrompe enquanto o Gravaê está atrás de outra coisa."
      >
        <Opcao data-gc="configuracoes.notifications-section.opcao"
          titulo="Aviso na tela"
          detalhe="A janelinha do sistema quando chega mensagem com o Gravaê atrás de outra coisa. Com a janela na frente ele não aparece — você já está vendo."
          ligado={prefs.aviso}
          onMudar={(v) => prefs.definir({ aviso: v })}
        />

        <Opcao data-gc="configuracoes.notifications-section.opcao--2"
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

      <Secao data-gc="configuracoes.notifications-section.secao--2"
        id="preferencia-de-mencao"
        titulo="Preferência de menção"
        detalhe="O que conta como te chamar — e o que passa em silêncio."
      >
        <Opcao data-gc="configuracoes.notifications-section.opcao--3"
          titulo="Só quando me chamarem"
          detalhe="Menção direta, cargo seu, @everyone e conversas privadas. O resto passa em silêncio."
          ligado={prefs.soMencoes}
          onMudar={(v) => prefs.definir({ soMencoes: v })}
        />
      </Secao>

      <Secao data-gc="configuracoes.notifications-section.secao--3"
        id="sons"
        titulo="Sons"
        detalhe="O interruptor de cima cala todos. Abaixo dele, cada um por vez — clique no nome para ouvir."
      >
        <Opcao data-gc="configuracoes.notifications-section.opcao--4"
          titulo="Som"
          detalhe="O aviso do Gravaê para mensagem e duas notas para menção. Não toca no canal que você está lendo."
          ligado={prefs.som}
          onMudar={(v) => {
            prefs.definir({ som: v });
            if (v) tocarSom("mensagem");
          }}
        />
        <ListaDeSons data-gc="configuracoes.notifications-section.lista-de-sons" />
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
  <div data-gc="configuracoes.notifications-section.div--6" className="mt-4 flex items-start gap-4">
    <div data-gc="configuracoes.notifications-section.div--7" className="min-w-0 flex-1">
      <p data-gc="configuracoes.notifications-section.p--6" className="text-sm font-medium">{titulo}</p>
      <p data-gc="configuracoes.notifications-section.p--7" className="mt-0.5 text-xs text-ink-faint">{detalhe}</p>
    </div>
    <Switch data-gc="configuracoes.notifications-section.switch.on-mudar" checked={ligado} onCheckedChange={onMudar} />
  </div>
);

const ListaDeSons: React.FC = () => {
  const sonsDesligados = useAvisos((s) => s.sonsDesligados);
  const definirSom = useAvisos((s) => s.definirSom);
  const somGeral = useAvisos((s) => s.som);

  return (
    <div data-gc="configuracoes.notifications-section.div--8" className={somGeral ? "" : "pointer-events-none opacity-50"}>
      {GRUPOS_DE_SONS.map((grupo) => (
        <div data-gc="configuracoes.notifications-section.div--9" key={grupo.titulo} className="mt-6 first:mt-4">
          <p data-gc="configuracoes.notifications-section.p--8" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {grupo.titulo}
          </p>

          <div data-gc="configuracoes.notifications-section.div--10" className="mt-2 overflow-hidden rounded-lg border border-line">
            {grupo.sons.map((som) => {
              const ligado = !sonsDesligados[som.nome];

              return (
                <div data-gc="configuracoes.notifications-section.div--11"
                  key={som.nome}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <button data-gc="configuracoes.notifications-section.button--2"
                    type="button"
                    onClick={() => tocarSom(som.nome)}
                    aria-label={`Ouvir ${som.rotulo}`}
                    className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-ink-faint transition hover:border-ink-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                  >
                    <Play data-gc="configuracoes.notifications-section.play" size={12} />
                  </button>

                  <div data-gc="configuracoes.notifications-section.div--12" className="min-w-0 flex-1">
                    <p data-gc="configuracoes.notifications-section.p--9" className="text-sm font-medium">{som.rotulo}</p>
                    <p data-gc="configuracoes.notifications-section.p--10" className="mt-0.5 text-xs text-ink-faint">
                      {som.quando}
                    </p>
                  </div>

                  <Switch data-gc="configuracoes.notifications-section.switch"
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
