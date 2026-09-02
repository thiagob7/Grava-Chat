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
import { tocarSom } from "~/lib/ui-sounds";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";
import { desktop } from "~/lib/desktop";

export const NotificationsSection: React.FC = () => {
  const prefs = useAvisos();
  const [permissao, setPermissao] = useState<PermissaoDeAviso>(() => permissaoDeAviso());

  /// A permissão pode mudar fora daqui (o cadeado da barra de endereço), e
  /// nada avisa a página. Reler ao voltar para a aba é o mais perto de um
  /// evento que existe.
  useEffect(() => {
    const reler = () => setPermissao(permissaoDeAviso());
    document.addEventListener("visibilitychange", reler);
    return () => document.removeEventListener("visibilitychange", reler);
  }, []);

  const ponte = desktop();

  return (
    <div className="max-w-xl">
      <p className="text-sm text-ink-muted">
        Vale para este aparelho. A mesma conta aberta no trabalho pode ficar quieta enquanto a de
        casa apita.
      </p>

      {permissao === "perguntar" && (
        <div className="mt-5 flex items-start gap-3 rounded bg-brand/10 p-3">
          <Bell size={18} className="mt-0.5 shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Falta o sistema deixar</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              O aviso na tela precisa de uma autorização do {ponte ? "sistema" : "navegador"}. Sem
              ela, o som e o contador no título continuam funcionando.
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

      <Secao id="o-que-te-interrompe" titulo="O que te interrompe">

        <Opcao
          titulo="Aviso na tela"
          detalhe="A janelinha do sistema quando chega mensagem com o Gravaê atrás de outra coisa. Com a janela na frente ele não aparece — você já está vendo."
          ligado={prefs.aviso}
          onMudar={(v) => prefs.definir({ aviso: v })}
        />

        <Opcao
          titulo="Só quando me chamarem"
          detalhe="Menção direta, cargo seu, @everyone e conversas privadas. O resto passa em silêncio."
          ligado={prefs.soMencoes}
          onMudar={(v) => prefs.definir({ soMencoes: v })}
        />

        <Opcao
          titulo="Som"
          detalhe="O aviso do Gravaê para mensagem e duas notas para menção. Não toca no canal que você está lendo."
          ligado={prefs.som}
          onMudar={(v) => {
            prefs.definir({ som: v });
            /// A prévia toca o de MENSAGEM: é o que a pessoa vai ouvir o dia
            /// inteiro. Mostrar a menção aqui anunciava o som mais raro.
            if (v) tocarSom("mensagem");
          }}
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
