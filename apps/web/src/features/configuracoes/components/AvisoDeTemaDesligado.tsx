import React from "react";
import { toast } from "react-toastify";

import { Button } from "~/components/ui/button";
import { themeOffByUrl } from "~/features/configuracoes/lib/saida-de-emergencia";
import { useStudio } from "~/features/configuracoes/stores/estudio";

export const ThemeOffNotice: React.FC = () => {
  const activeId = useStudio((s) => s.activeId);
  const toggleTheme = useStudio((s) => s.toggleTheme);

  if (!themeOffByUrl()) return null;

  const turnoff = () => {
    if (activeId) toggleTheme(activeId);

    toast.success("Tema desligado. Pode tirar o ?sem-tema do endereço.");
  };

  return (
    <div data-gc="configuracoes.aviso-de-tema-desligado.div"
      style={{
        position: "fixed",
        insetInline: 0,
        top: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "10px 16px",
        background: "#1e1d23",
        borderBottom: "1px solid #3a3742",
        color: "#f4f4f6",
        font: "500 13px/1.4 system-ui, sans-serif",
      }}
    >
      <span data-gc="configuracoes.aviso-de-tema-desligado.span">
        O tema está desligado só nesta aba. Se o app tinha sumido, foi ele.
      </span>

      {activeId && (
        <Button data-gc="configuracoes.aviso-de-tema-desligado.button.turnoff" size="sm" variant="surface" onClick={turnoff}>
          Desligar de vez
        </Button>
      )}
    </div>
  );
};
