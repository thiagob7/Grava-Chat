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
      <div data-gc="app.error-boundary.div" className="mt-4 flex flex-wrap items-center gap-2">
        <Button data-gc="app.error-boundary.button" variant="surface" size="sm" onClick={() => this.setState({ erro: null })}>
          <RotateCcw data-gc="app.error-boundary.rotate-ccw" size={14} /> Tentar de novo
        </Button>

        <Button data-gc="app.error-boundary.button--2" variant="surface" size="sm" onClick={() => window.location.reload()}>
          Recarregar
        </Button>

        <button data-gc="app.error-boundary.button--3"
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
        <div data-gc="app.error-boundary.div--2" className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <p data-gc="app.error-boundary.p" className="text-sm font-medium text-danger">Esta parte da tela quebrou.</p>
          <p data-gc="app.error-boundary.p--2" className="mt-1 break-words text-xs text-ink-muted">{erro.message}</p>
          {acoes}
        </div>
      );

    return (
      <div data-gc="app.error-boundary.div--3" className="flex h-full min-h-full items-center justify-center bg-surface-2 p-6">
        <div data-gc="app.error-boundary.div--4" className="max-w-md">
          <img data-gc="app.error-boundary.img"
            src="/brand/logo g branco.svg"
            alt=""
            className="h-10 w-auto select-none opacity-40"
            draggable={false}
          />

          <h1 data-gc="app.error-boundary.h1" className="mt-4 text-lg font-semibold">O Gravaê tropeçou.</h1>

          <p data-gc="app.error-boundary.p--3" className="mt-1 text-sm text-ink-muted">
            Alguma coisa quebrou no meio do caminho e a tela não conseguiu se
            desenhar. Sua conversa não se perdeu — está tudo no servidor.
          </p>

          <p data-gc="app.error-boundary.p--4" className="mt-3 break-words rounded bg-surface-1 p-3 font-mono text-xs text-ink-muted">
            {erro.message}
          </p>

          {acoes}
        </div>
      </div>
    );
  }
}
