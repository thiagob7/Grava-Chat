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
    <div data-gc="configuracoes.desktop-section.div">
      <p data-gc="configuracoes.desktop-section.p" className="text-sm text-ink-muted">
        O que só faz sentido com o aplicativo instalado. Estas escolhas ficam
        neste computador, não na conta.
      </p>

      <Secao data-gc="configuracoes.desktop-section.secao"
        id="inicializacao"
        titulo="Inicialização"
        detalhe="Como o Gravaê se comporta quando o computador liga."
      >
        {!ponte ? (
          <p data-gc="configuracoes.desktop-section.p--2" className="text-sm text-ink-faint">
            Esta versão do aplicativo é mais antiga que esta tela. Atualize
            abaixo e a opção aparece.
          </p>
        ) : !suportado ? (
          <p data-gc="configuracoes.desktop-section.p--3" className="text-sm text-ink-faint">
            O seu sistema não deixa o aplicativo se registrar para abrir no
            login.
          </p>
        ) : (
          <Opcao data-gc="configuracoes.desktop-section.opcao"
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

      <AtualizacaoDoApp data-gc="configuracoes.desktop-section.atualizacao-do-app" />

      <Secao data-gc="configuracoes.desktop-section.secao--2"
        id="reiniciar"
        titulo="Reiniciar"
        detalhe="Fecha e abre o aplicativo de novo, na mesma versão."
      >
        <div data-gc="configuracoes.desktop-section.div--2" className="flex items-start gap-4">
          <div data-gc="configuracoes.desktop-section.div--3" className="min-w-0 flex-1">
            <p data-gc="configuracoes.desktop-section.p--4" className="text-sm font-medium">Reiniciar o aplicativo</p>
            <p data-gc="configuracoes.desktop-section.p--5" className="mt-0.5 text-xs text-ink-faint">
              Resolve travamento de janela e devolve o app a um estado limpo sem
              precisar reinstalar. Você sai da chamada se estiver em uma.
            </p>
          </div>

          <Button data-gc="configuracoes.desktop-section.button"
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
            <RotateCcw data-gc="configuracoes.desktop-section.rotate-ccw" size={16} /> Reiniciar
          </Button>
        </div>
      </Secao>
    </div>
  );
};
