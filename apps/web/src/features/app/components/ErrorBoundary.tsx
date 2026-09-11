import React from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { copyText } from "~/lib/copiar";
import { i18next } from "~/traducao";

interface Props {
  children: React.ReactNode;
  where?: string;
  compact?: boolean;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[gravae] quebrou em ${this.props.where ?? "algum lugar"}`, error, info);
  }

  private details() {
    const { error } = this.state;

    return [
      `Gravaê — ${this.props.where ?? "aplicação"}`,
      new Date().toISOString(),
      navigator.userAgent,
      "",
      error?.stack ?? String(error),
    ].join("\n");
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const actions = (
      <div data-gc="app.error-boundary.div" className="mt-4 flex flex-wrap items-center gap-2">
        <Button data-gc="app.error-boundary.button" variant="surface" size="sm" onClick={() => this.setState({ error: null })}>
          <RotateCcw data-gc="app.error-boundary.rotate-ccw" size={14} /> {i18next.t("comum.erro.tentarDeNovo")}
        </Button>

        <Button data-gc="app.error-boundary.button--2" variant="surface" size="sm" onClick={() => window.location.reload()}>
          {i18next.t("comum.erro.recarregar")}
        </Button>

        <button data-gc="app.error-boundary.button--3"
          type="button"
          onClick={() => void copyText(this.details())}
          className="text-xs text-ink-muted underline-offset-2 hover:underline"
        >
          {i18next.t("comum.erro.copiarDetalhes")}
        </button>
      </div>
    );

    if (this.props.compact)
      return (
        <div data-gc="app.error-boundary.div--2" className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <p data-gc="app.error-boundary.p" className="text-sm font-medium text-danger">{i18next.t("comum.erro.parteQuebrou")}</p>
          <p data-gc="app.error-boundary.p--2" className="mt-1 break-words text-xs text-ink-muted">{error.message}</p>
          {actions}
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

          <h1 data-gc="app.error-boundary.h1" className="mt-4 text-lg font-semibold">{i18next.t("comum.erro.titulo")}</h1>

          <p data-gc="app.error-boundary.p--3" className="mt-1 text-sm text-ink-muted">
            {i18next.t("comum.erro.detalhe")}
          </p>

          <p data-gc="app.error-boundary.p--4" className="mt-3 break-words rounded bg-surface-1 p-3 font-mono text-xs text-ink-muted">
            {error.message}
          </p>

          {actions}
        </div>
      </div>
    );
  }
}
