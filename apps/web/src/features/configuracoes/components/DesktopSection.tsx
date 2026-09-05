import React, { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useConfirmar } from "~/components/ui/confirm";
import { desktop } from "~/lib/desktop";
import { AtualizacaoDoApp } from "~/features/configuracoes/components/AtualizacaoDoApp";
import { Opcao } from "~/features/configuracoes/components/campos-de-config";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";

export const DesktopSection: React.FC = () => {
  const ponte = desktop()?.sistema ?? null;
  const confirmar = useConfirmar();

  const [suportado, setSuportado] = useState(false);
  const [noLogin, setNoLogin] = useState(false);

  useEffect(() => {
    if (!ponte) return;

    void ponte.podeAbrirNoLogin().then(setSuportado);
    void ponte.abrirNoLogin().then(setNoLogin);
  }, [ponte]);

  return (
    <div>
      <p className="text-sm text-ink-muted">
        O que só faz sentido com o aplicativo instalado. Estas escolhas ficam
        neste computador, não na conta.
      </p>

      <Secao
        id="inicializacao"
        titulo="Inicialização"
        detalhe="Como o Gravaê se comporta quando o computador liga."
      >
        {!ponte ? (
          <p className="text-sm text-ink-faint">
            Esta versão do aplicativo é mais antiga que esta tela. Atualize
            abaixo e a opção aparece.
          </p>
        ) : !suportado ? (
          <p className="text-sm text-ink-faint">
            O seu sistema não deixa o aplicativo se registrar para abrir no
            login.
          </p>
        ) : (
          <Opcao
            titulo="Abrir junto com o computador"
            detalhe="O Gravaê sobe minimizado quando você entra na sua conta do sistema, já conectado."
            ligado={noLogin}
            onMudar={(ligado) => {
              setNoLogin(ligado);
              void ponte.definirAbrirNoLogin(ligado).then(setNoLogin);
            }}
          />
        )}
      </Secao>

      <AtualizacaoDoApp />

      <Secao
        id="reiniciar"
        titulo="Reiniciar"
        detalhe="Fecha e abre o aplicativo de novo, na mesma versão."
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Reiniciar o aplicativo</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              Resolve travamento de janela e devolve o app a um estado limpo sem
              precisar reinstalar. Você sai da chamada se estiver em uma.
            </p>
          </div>

          <Button
            variant="surface"
            disabled={!ponte}
            onClick={() =>
              void confirmar({
                titulo: "Reiniciar o Gravaê?",
                descricao:
                  "O aplicativo fecha e abre de novo na hora. Se você estiver numa chamada, sai dela.",
                acao: "Reiniciar",
              }).then(({ confirmado }) => confirmado && void ponte?.reiniciar())
            }
          >
            <RotateCcw size={16} /> Reiniciar
          </Button>
        </div>
      </Secao>
    </div>
  );
};
