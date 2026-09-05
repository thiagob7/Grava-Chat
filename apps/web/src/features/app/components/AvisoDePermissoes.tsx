import React, { useEffect, useState } from "react";

import { PermissoesDoMac } from "~/features/app/components/PermissoesDoMac";
import { desktop } from "~/lib/desktop";

const CHAVE = "gravae:permissoes-vistas";

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

  return <PermissoesDoMac data-gc="app.aviso-de-permissoes.permissoes-do-mac.fechar" aberto={aberto} onFechar={fechar} />;
};
