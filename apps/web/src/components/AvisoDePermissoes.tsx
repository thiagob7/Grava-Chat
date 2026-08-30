import React, { useEffect, useState } from "react";

import { PermissoesDoMac } from "~/components/PermissoesDoMac";
import { desktop } from "~/lib/desktop";

const CHAVE = "gravae:permissoes-vistas";

/*
  Mostra as permissões do macOS UMA vez, na primeira entrada em que falta
  alguma.

  Quem instala o app e entra numa chamada descobre que o microfone não
  funciona no pior momento possível: com gente do outro lado esperando. Melhor
  resolver antes, com calma.

  Uma vez só, e não a cada abertura: quem escolheu não conceder tem o direito de
  não ser perguntado de novo — a tela continua nas Configurações de voz pra
  quem mudar de ideia.
*/
export const AvisoDePermissoes: React.FC = () => {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const ponte = desktop();
    if (!ponte || ponte.plataforma !== "darwin") return;

    try {
      if (localStorage.getItem(CHAVE) === "1") return;
    } catch {
      return;
    }

    void Promise.all([
      ponte.midia.status("microphone"),
      ponte.midia.status("camera"),
      ponte.midia.status("screen"),
    ]).then((estados) => {
      if (estados.some((e) => e !== "granted")) setAberto(true);
    });
  }, []);

  const fechar = () => {
    setAberto(false);
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      /* sem armazenamento: volta na próxima abertura, e tudo bem */
    }
  };

  return <PermissoesDoMac aberto={aberto} onFechar={fechar} />;
};
