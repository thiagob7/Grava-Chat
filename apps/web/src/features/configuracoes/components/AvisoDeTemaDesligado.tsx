import React from "react";
import { toast } from "react-toastify";

import { Button } from "~/components/ui/button";
import { temaDesligadoPelaUrl } from "~/features/configuracoes/lib/saida-de-emergencia";
import { useEstudio } from "~/features/configuracoes/stores/estudio";

/*
  A faixa que aparece quando o app abre com `?sem-tema`.

  Ela precisa ser imune ao próprio tema — se ficasse na mão dele, o tema
  quebrado esconderia a única saída. Por isso o estilo é inline e o z fica
  acima de tudo, em vez de vir das nossas classes.
*/
export const AvisoDeTemaDesligado: React.FC = () => {
  const ativoId = useEstudio((s) => s.ativoId);
  const alternarTema = useEstudio((s) => s.alternarTema);

  if (!temaDesligadoPelaUrl()) return null;

  const desligar = () => {
    if (ativoId) alternarTema(ativoId);

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

      {ativoId && (
        <Button data-gc="configuracoes.aviso-de-tema-desligado.button.desligar" size="sm" variant="surface" onClick={desligar}>
          Desligar de vez
        </Button>
      )}
    </div>
  );
};
