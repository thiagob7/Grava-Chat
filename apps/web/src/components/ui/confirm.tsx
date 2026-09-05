import React, { createContext, useCallback, useContext, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input, Label } from "~/components/ui/input";

export interface PedidoDeConfirmacao {
  titulo: string;
  descricao: React.ReactNode;
  acao?: string;
  destrutivo?: boolean;
  campo?: { rotulo: string; placeholder?: string; obrigatorio?: boolean };
  dicaDoShift?: boolean;
}

type Resposta = { confirmado: boolean; texto: string };

const ConfirmContext = createContext<((pedido: PedidoDeConfirmacao) => Promise<Resposta>) | null>(
  null,
);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pedido, setPedido] = useState<PedidoDeConfirmacao | null>(null);
  const [texto, setTexto] = useState("");

  const pendente = useRef<((r: Resposta) => void) | null>(null);

  const confirmar = useCallback((novo: PedidoDeConfirmacao) => {
    setPedido(novo);
    setTexto("");

    return new Promise<Resposta>((resolve) => {
      pendente.current = resolve;
    });
  }, []);

  const responder = (confirmado: boolean) => {
    pendente.current?.({ confirmado, texto: texto.trim() });
    pendente.current = null;
    setPedido(null);
  };

  const faltaCampo = Boolean(pedido?.campo?.obrigatorio) && !texto.trim();

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}

      <Dialog data-gc="ui.confirm.dialog"
        open={Boolean(pedido)}
        onOpenChange={(aberto) => !aberto && responder(false)}
      >
        <DialogContent data-gc="ui.confirm.dialog-content" className="max-w-md">
          <DialogHeader data-gc="ui.confirm.dialog-header">
            <DialogTitle data-gc="ui.confirm.dialog-title">{pedido?.titulo}</DialogTitle>
            <DialogDescription data-gc="ui.confirm.dialog-description">{pedido?.descricao}</DialogDescription>

            {pedido?.dicaDoShift && (
              <p data-gc="ui.confirm.p" className="mt-2 text-sm text-ink-muted">
                <span data-gc="ui.confirm.span" className="font-semibold text-online">Dica:</span> segure Shift ao clicar
                para pular esta confirmação.
              </p>
            )}
          </DialogHeader>

          {pedido?.campo && (
            <DialogBody data-gc="ui.confirm.dialog-body">
              <Label data-gc="ui.confirm.label" htmlFor="confirm-campo">{pedido.campo.rotulo}</Label>
              <Input data-gc="ui.confirm.input"
                id="confirm-campo"
                autoFocus
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={pedido.campo.placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !faltaCampo) responder(true);
                }}
              />
            </DialogBody>
          )}

          <DialogFooter data-gc="ui.confirm.dialog-footer" className={pedido?.campo ? undefined : "pt-5"}>
            <Button data-gc="ui.confirm.button" variant="surface" onClick={() => responder(false)}>
              Cancelar
            </Button>
            <Button data-gc="ui.confirm.button--2"
              variant={pedido?.destrutivo === false ? "primary" : "danger"}
              disabled={faltaCampo}
              onClick={() => responder(true)}
            >
              {pedido?.acao ?? "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

export function useConfirmar() {
  const contexto = useContext(ConfirmContext);
  if (!contexto) throw new Error("useConfirmar precisa do <ConfirmProvider>");

  return contexto;
}
