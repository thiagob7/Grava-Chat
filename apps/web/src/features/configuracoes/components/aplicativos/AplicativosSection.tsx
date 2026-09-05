import React, { useState } from "react";
import { BookOpen, Plus } from "lucide-react";

import { useCreateBot, useFindBots } from "~/@core/application/queries/bot/use-bots";
import { Button } from "~/components/ui/button";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";
import { DetalheDoAplicativo } from "~/features/configuracoes/components/aplicativos/DetalheDoAplicativo";
import { ListaDeAplicativos } from "~/features/configuracoes/components/aplicativos/ListaDeAplicativos";
import { ModalDeCriacao } from "~/features/configuracoes/components/aplicativos/ModalDeCriacao";
import { ModalDeToken } from "~/features/configuracoes/components/aplicativos/ModalDeToken";

const DOCS =
  (import.meta.env.VITE_DOCS_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:4321/desenvolvedores" : undefined);

export const AplicativosSection: React.FC = () => {
  const { data: bots = [], isLoading, isError, refetch } = useFindBots(true);
  const criar = useCreateBot();

  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [tokenNovo, setTokenNovo] = useState<string | null>(null);

  const aberto = bots.find((bot) => bot.id === abertoId) ?? null;

  const criarBot = (nome: string) =>
    criar.mutate(nome, {
      onSuccess: (bot) => {
        setCriando(false);
        setAbertoId(bot.id);
        if (bot.token) setTokenNovo(bot.token);
      },
    });

  if (aberto)
    return (
      <>
        <DetalheDoAplicativo
          bot={aberto}
          onVoltar={() => setAbertoId(null)}
          onTokenNovo={setTokenNovo}
        />

        <ModalDeToken token={tokenNovo} onFechar={() => setTokenNovo(null)} />
      </>
    );

  return (
    <div className="max-w-2xl pb-10">
      <p className="text-sm text-ink-muted">
        Um aplicativo é um bot com token próprio. O código roda onde você quiser
        — exemplos prontos em{" "}
        <code className="rounded bg-surface-0 px-1 text-xs">exemplos/</code>.
      </p>

      <Secao
        id="seus-aplicativos"
        titulo="Seus aplicativos"
        detalhe="Cada um vem com um bot e um token próprios."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={() => setCriando(true)}>
            <Plus size={16} /> Criar aplicativo
          </Button>

          {DOCS && (
            <a
              href={DOCS}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline"
            >
              <BookOpen size={16} /> Leia a documentação
            </a>
          )}
        </div>

        <div className="mt-4">
          {isLoading && <p className="text-sm text-ink-faint">Carregando…</p>}

          {!isLoading && isError && (
            <div className="flex items-center gap-3">
              <p className="flex-1 text-sm text-ink-faint">
                Não deu pra carregar seus aplicativos.
              </p>

              <Button variant="surface" size="sm" onClick={() => void refetch()}>
                Tentar de novo
              </Button>
            </div>
          )}

          {!isLoading && !isError && !bots.length && (
            <p className="text-sm text-ink-faint">
              Nenhum aplicativo ainda. Crie o primeiro pra começar a usar a API
              do Gravaê.
            </p>
          )}

          {!isLoading && !isError && bots.length > 0 && (
            <ListaDeAplicativos bots={bots} onAbrir={setAbertoId} />
          )}
        </div>
      </Secao>

      <ModalDeCriacao
        aberto={criando}
        criando={criar.isPending}
        onFechar={() => setCriando(false)}
        onCriar={criarBot}
      />

      <ModalDeToken token={tokenNovo} onFechar={() => setTokenNovo(null)} />
    </div>
  );
};
