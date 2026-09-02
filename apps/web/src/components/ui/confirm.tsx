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
  /**
   * Mostra a dica de que dá pra pular esta confirmação segurando Shift.
   *
   * Só faça isso quando o gesto REALMENTE existir do outro lado: prometer um
   * atalho que não funciona é pior do que não ter atalho nenhum.
   */
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

      <Dialog
        open={Boolean(pedido)}
        onOpenChange={(aberto) => !aberto && responder(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{pedido?.titulo}</DialogTitle>
            <DialogDescription>{pedido?.descricao}</DialogDescription>

            {pedido?.dicaDoShift && (
              <p className="mt-2 text-sm text-ink-muted">
                <span className="font-semibold text-online">Dica:</span> segure Shift ao clicar
                para pular esta confirmação.
              </p>
            )}
          </DialogHeader>

          {pedido?.campo && (
            <DialogBody>
              <Label htmlFor="confirm-campo">{pedido.campo.rotulo}</Label>
              <Input
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

          <DialogFooter>
            <Button variant="surface" onClick={() => responder(false)}>
              Cancelar
            </Button>
            <Button
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
