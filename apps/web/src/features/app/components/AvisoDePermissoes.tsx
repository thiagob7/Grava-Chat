import React, { useEffect, useState } from "react";

import { MacPermissions } from "~/features/app/components/PermissoesDoMac";
import { desktop } from "~/lib/desktop";

const KEY = "gravae:permissoes-vistas";

export const PermissionsNotice: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const bridge = desktop();
    if (!bridge || bridge.platform !== "darwin") return;

    try {
      if (localStorage.getItem(KEY) === "1") return;
    } catch {
      return;
    }

    void Promise.all([
      bridge.media.status("microphone"),
      bridge.media.status("camera"),
      bridge.media.status("screen"),
    ]).then((states) => {
      if (states.some((e) => e !== "granted")) setIsOpen(true);
    });
  }, []);

  const close = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
    }
  };

  return <MacPermissions data-gc="app.aviso-de-permissoes.mac-permissions.close" isOpen={isOpen} onClose={close} />;
};
