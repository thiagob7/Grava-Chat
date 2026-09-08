import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Archive, Check, Flag, Inbox, RotateCcw, ShieldAlert } from "lucide-react";

import { useDarDesfecho, useDenuncias } from "~/@core/application/queries/admin/use-denuncias";
import type { DenunciaNaFila } from "~/@core/application/requests/admin/denuncias";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { cn } from "~/lib/utils";

const quando = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

/*
  A fila de denúncias da administração.

  Até aqui a denúncia só chegava como mensagem da conta do sistema, e uma
  conversa não é fila: a que você leu ontem e não resolveu já desceu. Esta
  tela existe para nenhuma sumir de vista.

  Dar desfecho NÃO age no conteúdo. Apagar mensagem, banir e tirar comunidade
  do Explorar continuam sendo decisões separadas, com as ferramentas de
  sempre — aqui só se registra que alguém olhou, e o que concluiu.
*/
export const DenunciasSection: React.FC = () => {
  const [pendentes, setPendentes] = useState(true);
  const fila = useDenuncias(pendentes, true);

  const itens = fila.data?.pages.flatMap((p) => p.itens) ?? [];

  return (
    <div data-gc="configuracoes.denuncias-section.div" className="max-w-2xl pb-10">
      <Secao data-gc="configuracoes.denuncias-section.secao" id="denuncias" titulo="Denúncias">
        <div data-gc="configuracoes.denuncias-section.div--2" className="mb-4 flex items-center gap-1">
          <Aba data-gc="configuracoes.denuncias-section.aba" ativa={pendentes} onEscolher={() => setPendentes(true)}>
            Na fila
          </Aba>
          <Aba data-gc="configuracoes.denuncias-section.aba--2" ativa={!pendentes} onEscolher={() => setPendentes(false)}>
            Todas
          </Aba>
        </div>

        {fila.isLoading ? (
          <div data-gc="configuracoes.denuncias-section.div--3" className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton data-gc="configuracoes.denuncias-section.skeleton" key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : itens.length === 0 ? (
          <div data-gc="configuracoes.denuncias-section.div--4" className="flex flex-col items-center gap-3 rounded-lg bg-surface-2 py-14 text-center">
            <Inbox data-gc="configuracoes.denuncias-section.inbox" size={32} className="text-ink-faint" />
            <div data-gc="configuracoes.denuncias-section.div--5">
              <p data-gc="configuracoes.denuncias-section.p" className="text-sm font-medium">
                {pendentes ? "Nada na fila" : "Nenhuma denúncia até agora"}
              </p>
              <p data-gc="configuracoes.denuncias-section.p--2" className="mt-1 text-xs text-ink-faint">
                {pendentes
                  ? "Tudo o que chegou já teve desfecho."
                  : "Quando alguém denunciar uma comunidade ou uma mensagem, aparece aqui."}
              </p>
            </div>
          </div>
        ) : (
          <div data-gc="configuracoes.denuncias-section.div--6" className="space-y-3">
            {itens.map((denuncia) => (
              <Cartao data-gc="configuracoes.denuncias-section.cartao" key={denuncia.id} denuncia={denuncia} />
            ))}

            {fila.hasNextPage && (
              <Button data-gc="configuracoes.denuncias-section.button"
                variant="surface"
                className="w-full"
                disabled={fila.isFetchingNextPage}
                onClick={() => void fila.fetchNextPage()}
              >
                {fila.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </Button>
            )}
          </div>
        )}
      </Secao>
    </div>
  );
};

const Aba: React.FC<{ ativa: boolean; onEscolher: () => void; children: React.ReactNode }> = ({
  ativa,
  onEscolher,
  children,
}) => (
  <button data-gc="configuracoes.denuncias-section.button.on-escolher"
    type="button"
    onClick={onEscolher}
    className={cn(
      "rounded px-3 py-1.5 text-sm font-medium transition",
      ativa ? "bg-selecionado text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
    )}
  >
    {children}
  </button>
);

const Cartao: React.FC<{ denuncia: DenunciaNaFila }> = ({ denuncia }) => {
  const navigate = useNavigate();
  const fecharConfiguracoes = useConfiguracoes((s) => s.fechar);
  const desfecho = useDarDesfecho();

  const ehDeMensagem = denuncia.tipo === "mensagem";
  const resolvida = Boolean(denuncia.resolvidaEm);

  const irParaMensagem = () => {
    const m = denuncia.mensagem;
    if (!m) return;

    fecharConfiguracoes();
    navigate(`/channels/${m.guildId ?? "@me"}/${m.channelId}/${m.id}`);
  };

  const decidir = (decisao: "procede" | "arquivada" | "reabrir") =>
    desfecho.mutate({ id: denuncia.id, decisao });

  return (
    <article data-gc="configuracoes.denuncias-section.article" className={cn("rounded-lg bg-surface-2 p-4", resolvida && "opacity-60")}>
      <header data-gc="configuracoes.denuncias-section.header" className="flex items-center gap-2">
        {ehDeMensagem ? (
          <Flag data-gc="configuracoes.denuncias-section.flag" size={14} className="shrink-0 text-danger" />
        ) : (
          <ShieldAlert data-gc="configuracoes.denuncias-section.shield-alert" size={14} className="shrink-0 text-danger" />
        )}

        <span data-gc="configuracoes.denuncias-section.span" className="text-sm font-semibold">
          {ehDeMensagem ? "Mensagem" : "Comunidade"} · {denuncia.motivoEscrito}
        </span>

        <span data-gc="configuracoes.denuncias-section.span--2" className="ml-auto shrink-0 text-xs text-ink-faint">
          {quando.format(new Date(denuncia.createdAt))}
        </span>
      </header>

      <p data-gc="configuracoes.denuncias-section.p--3" className="mt-1 text-xs text-ink-faint">
        Por {denuncia.autor ? `@${denuncia.autor.username}` : "conta apagada"}
        {denuncia.comunidade && ` · em ${denuncia.comunidade.nome}`}
      </p>

      {denuncia.mensagem && (
        <blockquote data-gc="configuracoes.denuncias-section.blockquote" className="mt-3 border-l-2 border-line pl-3">
          <p data-gc="configuracoes.denuncias-section.p--4" className="text-xs font-semibold text-ink-muted">
            {denuncia.mensagem.autor ? `@${denuncia.mensagem.autor.username}` : "conta apagada"}
          </p>
          <p data-gc="configuracoes.denuncias-section.p--5" className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink">
            {denuncia.mensagem.trecho || "(sem texto)"}
          </p>
        </blockquote>
      )}

      {denuncia.detalhes && (
        <p data-gc="configuracoes.denuncias-section.p--6" className="mt-3 whitespace-pre-wrap break-words text-sm text-ink-muted">
          {denuncia.detalhes}
        </p>
      )}

      <footer data-gc="configuracoes.denuncias-section.footer" className="mt-4 flex flex-wrap items-center gap-2">
        {denuncia.mensagem && (
          <Button data-gc="configuracoes.denuncias-section.button.ir-para-mensagem" variant="surface" size="sm" onClick={irParaMensagem}>
            Ir até a mensagem
          </Button>
        )}

        {resolvida ? (
          <>
            <span data-gc="configuracoes.denuncias-section.span--3" className="text-xs text-ink-faint">
              {denuncia.decisao === "procede" ? "Marcada como procedente" : "Arquivada"} em{" "}
              {quando.format(new Date(denuncia.resolvidaEm!))}
            </span>

            <Button data-gc="configuracoes.denuncias-section.button--2"
              variant="surface"
              size="sm"
              className="ml-auto"
              disabled={desfecho.isPending}
              onClick={() => decidir("reabrir")}
            >
              <RotateCcw data-gc="configuracoes.denuncias-section.rotate-ccw" size={14} /> Reabrir
            </Button>
          </>
        ) : (
          <div data-gc="configuracoes.denuncias-section.div--7" className="ml-auto flex gap-2">
            <Button data-gc="configuracoes.denuncias-section.button--3"
              variant="surface"
              size="sm"
              disabled={desfecho.isPending}
              onClick={() => decidir("arquivada")}
            >
              <Archive data-gc="configuracoes.denuncias-section.archive" size={14} /> Arquivar
            </Button>

            <Button data-gc="configuracoes.denuncias-section.button--4" size="sm" disabled={desfecho.isPending} onClick={() => decidir("procede")}>
              <Check data-gc="configuracoes.denuncias-section.check" size={14} /> Procede
            </Button>
          </div>
        )}
      </footer>
    </article>
  );
};
