import React, { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import { desktop } from "~/lib/desktop";
import { UpdateApp } from "~/features/configuracoes/components/AtualizacaoDoApp";
import { Choice } from "~/features/configuracoes/components/campos-de-config";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";

export const DesktopSection: React.FC = () => {
  const bridge = desktop()?.system ?? null;
  const confirm = useConfirm();

  const [supported, setSupported] = useState(false);
  const [inLogin, setNoLogin] = useState(false);

  useEffect(() => {
    if (!bridge) return;

    void bridge.canOpenLogin().then(setSupported);
    void bridge.openLogin().then(setNoLogin);
  }, [bridge]);

  return (
    <div data-gc="configuracoes.desktop-section.div">
      <p data-gc="configuracoes.desktop-section.p" className="text-sm text-ink-muted">
        O que só faz sentido com o aplicativo instalado. Estas escolhas ficam
        neste computador, não na conta.
      </p>

      <Section data-gc="configuracoes.desktop-section.section"
        id="inicializacao"
        title="Inicialização"
        detail="Como o Gravaê se comporta quando o computador liga."
      >
        {!bridge ? (
          <p data-gc="configuracoes.desktop-section.p--2" className="text-sm text-ink-faint">
            Esta versão do aplicativo é mais antiga que esta tela. Atualize
            abaixo e a opção aparece.
          </p>
        ) : !supported ? (
          <p data-gc="configuracoes.desktop-section.p--3" className="text-sm text-ink-faint">
            O seu sistema não deixa o aplicativo se registrar para abrir no
            login.
          </p>
        ) : (
          <Choice data-gc="configuracoes.desktop-section.choice"
            title="Abrir junto com o computador"
            detail="O Gravaê sobe minimizado quando você entra na sua conta do sistema, já conectado."
            on={inLogin}
            onChange={(on) => {
              setNoLogin(on);
              void bridge.setOpenLogin(on).then(setNoLogin);
            }}
          />
        )}
      </Section>

      <UpdateApp data-gc="configuracoes.desktop-section.update-app" />

      <Section data-gc="configuracoes.desktop-section.section--2"
        id="reiniciar"
        title="Reiniciar"
        detail="Fecha e abre o aplicativo de novo, na mesma versão."
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
            disabled={!bridge}
            onClick={() =>
              void confirm({
                title: "Reiniciar o Gravaê?",
                description:
                  "O aplicativo fecha e abre de novo na hora. Se você estiver numa chamada, sai dela.",
                action: "Reiniciar",
              }).then(({ confirmed }) => confirmed && void bridge?.restart())
            }
          >
            <RotateCcw data-gc="configuracoes.desktop-section.rotate-ccw" size={16} /> Reiniciar
          </Button>
        </div>
      </Section>
    </div>
  );
};
