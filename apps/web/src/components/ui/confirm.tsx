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

/**
 * Confirmação para ação irreversível.
 *
 * A API é imperativa (`await confirmar({...})`) e não um componente que envolve
 * o botão, porque a maioria dessas ações mora dentro de menu suspenso: abrir um
 * diálogo a partir de um item de menu fecha o menu e desmonta o gatilho no meio
 * do caminho. Com uma promessa, quem chama só espera a resposta.
 *
 * Também substitui `window.confirm` e `window.prompt` — que além de feios
 * **não funcionam no aplicativo de desktop**: o Electron não implementa
 * `prompt`, então o pedido de motivo do banimento devolvia `null` e o
 * banimento silenciosamente nunca acontecia.
 */

export interface PedidoDeConfirmacao {
  titulo: string;
  descricao: React.ReactNode;
  /** texto do botão que confirma; o padrão serve pra exclusão */
  acao?: string;
  /** vermelho (padrão) ou neutro, para o que não destrói nada */
  destrutivo?: boolean;
  /**
   * Pede um texto junto — usado no motivo do banimento. Devolve a string no
   * lugar de `true`; vazio continua valendo como confirmado.
   */
  campo?: { rotulo: string; placeholder?: string; obrigatorio?: boolean };
}

type Resposta = { confirmado: boolean; texto: string };

const ConfirmContext = createContext<((pedido: PedidoDeConfirmacao) => Promise<Resposta>) | null>(
  null,
);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pedido, setPedido] = useState<PedidoDeConfirmacao | null>(null);
  const [texto, setTexto] = useState("");

  /** Quem está esperando a resposta. Fica em ref: trocar não deve re-renderizar. */
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
        // fechar pelo Esc, pelo X ou clicando fora conta como cancelar — nunca
        // pode deixar quem chamou esperando pra sempre
        onOpenChange={(aberto) => !aberto && responder(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{pedido?.titulo}</DialogTitle>
            <DialogDescription>{pedido?.descricao}</DialogDescription>
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

/**
 * `const confirmar = useConfirmar()` e depois
 * `if (!(await confirmar({...})).confirmado) return;`
 */
export function useConfirmar() {
  const contexto = useContext(ConfirmContext);
  if (!contexto) throw new Error("useConfirmar precisa do <ConfirmProvider>");

  return contexto;
}
