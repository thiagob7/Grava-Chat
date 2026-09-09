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

export interface ConfirmRequest {
  title: string;
  description: React.ReactNode;
  action?: string;
  destructive?: boolean;
  field?: { label: string; placeholder?: string; required?: boolean };
  shiftHint?: boolean;
}

type ConfirmAnswer = { confirmed: boolean; text: string };

const ConfirmContext = createContext<((request: ConfirmRequest) => Promise<ConfirmAnswer>) | null>(
  null,
);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [text, setTexto] = useState("");

  const pending = useRef<((r: ConfirmAnswer) => void) | null>(null);

  const confirm = useCallback((next: ConfirmRequest) => {
    setRequest(next);
    setTexto("");

    return new Promise<ConfirmAnswer>((resolve) => {
      pending.current = resolve;
    });
  }, []);

  const answer = (confirmed: boolean) => {
    pending.current?.({ confirmed, text: text.trim() });
    pending.current = null;
    setRequest(null);
  };

  const missingField = Boolean(request?.field?.required) && !text.trim();

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Dialog data-gc="ui.confirm.dialog"
        open={Boolean(request)}
        onOpenChange={(open) => !open && answer(false)}
      >
        <DialogContent data-gc="ui.confirm.dialog-content" className="max-w-md">
          <DialogHeader data-gc="ui.confirm.dialog-header">
            <DialogTitle data-gc="ui.confirm.dialog-title">{request?.title}</DialogTitle>
            <DialogDescription data-gc="ui.confirm.dialog-description">{request?.description}</DialogDescription>

            {request?.shiftHint && (
              <p data-gc="ui.confirm.p" className="mt-2 text-sm text-ink-muted">
                <span data-gc="ui.confirm.span" className="font-semibold text-online">Dica:</span> segure Shift ao clicar
                para pular esta confirmação.
              </p>
            )}
          </DialogHeader>

          {request?.field && (
            <DialogBody data-gc="ui.confirm.dialog-body">
              <Label data-gc="ui.confirm.label" htmlFor="confirm-campo">{request.field.label}</Label>
              <Input data-gc="ui.confirm.input"
                id="confirm-campo"
                autoFocus
                value={text}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={request.field.placeholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !missingField) answer(true);
                }}
              />
            </DialogBody>
          )}

          <DialogFooter data-gc="ui.confirm.dialog-footer" className={request?.field ? undefined : "pt-5"}>
            <Button data-gc="ui.confirm.button" variant="surface" onClick={() => answer(false)}>
              Cancelar
            </Button>
            <Button data-gc="ui.confirm.button--2"
              variant={request?.destructive === false ? "primary" : "danger"}
              disabled={missingField}
              onClick={() => answer(true)}
            >
              {request?.action ?? "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm precisa do <ConfirmProvider>");

  return context;
}
