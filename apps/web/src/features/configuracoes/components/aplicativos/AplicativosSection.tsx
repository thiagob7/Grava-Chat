import React, { useState } from "react";
import { BookOpen, Plus } from "lucide-react";

import { useCreateBot, useFindBots } from "~/@core/application/queries/bot/use-bots";
import { Button } from "~/components/ui/button";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { AppDetail } from "~/features/configuracoes/components/aplicativos/DetalheDoAplicativo";
import { ListApps } from "~/features/configuracoes/components/aplicativos/ListaDeAplicativos";
import { CreationModal } from "~/features/configuracoes/components/aplicativos/ModalDeCriacao";
import { ModalDeToken } from "~/features/configuracoes/components/aplicativos/ModalDeToken";

const DOCS =
  (import.meta.env.VITE_DOCS_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:4321/desenvolvedores" : undefined);

export const AppsSection: React.FC = () => {
  const { data: bots = [], isLoading, isError, refetch } = useFindBots(true);
  const create = useCreateBot();

  const [isOpenId, setIsOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tokenNew, setTokenNew] = useState<string | null>(null);

  const isOpen = bots.find((bot) => bot.id === isOpenId) ?? null;

  const createBot = (name: string) =>
    create.mutate(name, {
      onSuccess: (bot) => {
        setCreating(false);
        setIsOpenId(bot.id);
        if (bot.token) setTokenNew(bot.token);
      },
    });

  if (isOpen)
    return (
      <>
        <AppDetail data-gc="configuracoes.aplicativos.aplicativos-section.app-detail.set-token-new"
          bot={isOpen}
          onBack={() => setIsOpenId(null)}
          onTokenNew={setTokenNew}
        />

        <ModalDeToken data-gc="configuracoes.aplicativos.aplicativos-section.modal-de-token" token={tokenNew} onClose={() => setTokenNew(null)} />
      </>
    );

  return (
    <div data-gc="configuracoes.aplicativos.aplicativos-section.div" className="max-w-2xl pb-10">
      <p data-gc="configuracoes.aplicativos.aplicativos-section.p" className="text-sm text-ink-muted">
        Um aplicativo é um bot com token próprio. O código roda onde você quiser
        — exemplos prontos em{" "}
        <code data-gc="configuracoes.aplicativos.aplicativos-section.code" className="rounded bg-surface-0 px-1 text-xs">exemplos/</code>.
      </p>

      <Section data-gc="configuracoes.aplicativos.aplicativos-section.section"
        id="seus-aplicativos"
        title="Seus aplicativos"
        detail="Cada um vem com um bot e um token próprios."
      >
        <div data-gc="configuracoes.aplicativos.aplicativos-section.div--2" className="flex flex-wrap items-center gap-4">
          <Button data-gc="configuracoes.aplicativos.aplicativos-section.button" onClick={() => setCreating(true)}>
            <Plus data-gc="configuracoes.aplicativos.aplicativos-section.plus" size={16} /> Criar aplicativo
          </Button>

          {DOCS && (
            <a data-gc="configuracoes.aplicativos.aplicativos-section.a"
              href={DOCS}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline"
            >
              <BookOpen data-gc="configuracoes.aplicativos.aplicativos-section.book-open" size={16} /> Leia a documentação
            </a>
          )}
        </div>

        <div data-gc="configuracoes.aplicativos.aplicativos-section.div--3" className="mt-4">
          {isLoading && <p data-gc="configuracoes.aplicativos.aplicativos-section.p--2" className="text-sm text-ink-faint">Carregando…</p>}

          {!isLoading && isError && (
            <div data-gc="configuracoes.aplicativos.aplicativos-section.div--4" className="flex items-center gap-3">
              <p data-gc="configuracoes.aplicativos.aplicativos-section.p--3" className="flex-1 text-sm text-ink-faint">
                Não deu pra carregar seus aplicativos.
              </p>

              <Button data-gc="configuracoes.aplicativos.aplicativos-section.button--2" variant="surface" size="sm" onClick={() => void refetch()}>
                Tentar de novo
              </Button>
            </div>
          )}

          {!isLoading && !isError && !bots.length && (
            <p data-gc="configuracoes.aplicativos.aplicativos-section.p--4" className="text-sm text-ink-faint">
              Nenhum aplicativo ainda. Crie o primeiro pra começar a usar a API
              do Gravaê.
            </p>
          )}

          {!isLoading && !isError && bots.length > 0 && (
            <ListApps data-gc="configuracoes.aplicativos.aplicativos-section.list-apps.set-is-open-id" bots={bots} onOpen={setIsOpenId} />
          )}
        </div>
      </Section>

      <CreationModal data-gc="configuracoes.aplicativos.aplicativos-section.creation-modal.create-bot"
        isOpen={creating}
        creating={create.isPending}
        onClose={() => setCreating(false)}
        onCreate={createBot}
      />

      <ModalDeToken data-gc="configuracoes.aplicativos.aplicativos-section.modal-de-token--2" token={tokenNew} onClose={() => setTokenNew(null)} />
    </div>
  );
};
