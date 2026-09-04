import React from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { copiarTexto } from "~/lib/copiar";

interface Props {
  children: React.ReactNode;
  onde?: string;
  compacto?: boolean;
}

interface State {
  erro: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: React.ErrorInfo) {
    console.error(`[gravae] quebrou em ${this.props.onde ?? "algum lugar"}`, erro, info);
  }

  private detalhes() {
    const { erro } = this.state;

    return [
      `Gravaê — ${this.props.onde ?? "aplicação"}`,
      new Date().toISOString(),
      navigator.userAgent,
      "",
      erro?.stack ?? String(erro),
    ].join("\n");
  }

  render() {
    const { erro } = this.state;
    if (!erro) return this.props.children;

    const acoes = (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="surface" size="sm" onClick={() => this.setState({ erro: null })}>
          <RotateCcw size={14} /> Tentar de novo
        </Button>

        <Button variant="surface" size="sm" onClick={() => window.location.reload()}>
          Recarregar
        </Button>

        <button
          type="button"
          onClick={() => void copiarTexto(this.detalhes())}
          className="text-xs text-ink-muted underline-offset-2 hover:underline"
        >
          Copiar detalhes
        </button>
      </div>
    );

    if (this.props.compacto)
      return (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm font-medium text-danger">Esta parte da tela quebrou.</p>
          <p className="mt-1 break-words text-xs text-ink-muted">{erro.message}</p>
          {acoes}
        </div>
      );

    return (
      <div className="flex h-full min-h-full items-center justify-center bg-surface-2 p-6">
        <div className="max-w-md">
          <img
            src="/brand/logo g branco.svg"
            alt=""
            className="h-10 w-auto select-none opacity-40"
            draggable={false}
          />

          <h1 className="mt-4 text-lg font-semibold">O Gravaê tropeçou.</h1>

          <p className="mt-1 text-sm text-ink-muted">
            Alguma coisa quebrou no meio do caminho e a tela não conseguiu se
            desenhar. Sua conversa não se perdeu — está tudo no servidor.
          </p>

          <p className="mt-3 break-words rounded bg-surface-1 p-3 font-mono text-xs text-ink-muted">
            {erro.message}
          </p>

          {acoes}
        </div>
      </div>
    );
  }
}
