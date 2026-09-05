import React, { useState } from "react";
import { useNavigate } from "react-router";
import { At, Bell, BookmarkSimple, Confetti, Hash, Tray } from "@phosphor-icons/react";

import { useFindMentions } from "~/@core/application/queries/message/use-find-mentions";
import { useReadStatesLista } from "~/@core/application/queries/message/use-read-states";
import {
  useFavoriteMessages,
  useToggleFavoriteMessage,
} from "~/@core/application/queries/message/use-message-favorites";
import { Avatar } from "~/features/perfil/components/Avatar";
import { MessageContent } from "~/features/conversa/components/MessageContent";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { formatTimestamp } from "~/lib/format";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

type Aba = "nao-lidas" | "salvas" | "mencoes";

const ABAS: { id: Aba; rotulo: string; icone: React.ReactNode }[] = [
  { id: "nao-lidas", rotulo: "conversa.entrada.naoLidas", icone: <Bell data-gc="conversa.caixa-de-entrada.bell" size={16} weight="fill" /> },
  { id: "salvas", rotulo: "conversa.entrada.salvas", icone: <BookmarkSimple data-gc="conversa.caixa-de-entrada.bookmark-simple" size={16} weight="fill" /> },
  { id: "mencoes", rotulo: "conversa.entrada.mencoes", icone: <At data-gc="conversa.caixa-de-entrada.at" size={16} weight="bold" /> },
];

export const CaixaDeEntrada: React.FC = () => {
  const { t } = useTranslation();
  const [aberta, setAberta] = useState(false);
  const [aba, setAba] = useState<Aba>("nao-lidas");

  const { data: estados = [] } = useReadStatesLista(aberta);
  const naoLidas = estados.filter((estado) => estado.unreadCount > 0);

  return (
    <Popover data-gc="conversa.caixa-de-entrada.popover.set-aberta" open={aberta} onOpenChange={setAberta}>
      <PopoverTrigger data-gc="conversa.caixa-de-entrada.popover-trigger" asChild>
        <button data-gc="conversa.caixa-de-entrada.button" aria-label={t("conversa.entrada.titulo")} className="relative text-ink-muted transition hover:text-ink">
          <Tooltip data-gc="conversa.caixa-de-entrada.tooltip" label={t("conversa.entrada.titulo")}>
            <Tray data-gc="conversa.caixa-de-entrada.tray" size={20} weight="fill" />
          </Tooltip>

          {naoLidas.length > 0 && (
            <span data-gc="conversa.caixa-de-entrada.span" className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-danger" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent data-gc="conversa.caixa-de-entrada.popover-content" align="end" className="flex h-[30rem] w-[26rem] gap-0 p-0">
        <nav data-gc="conversa.caixa-de-entrada.nav" className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-divisor py-2">
          {ABAS.map((item) => (
            <Tooltip data-gc="conversa.caixa-de-entrada.tooltip--2" key={item.id} label={item.rotulo} side="left">
              <button data-gc="conversa.caixa-de-entrada.button--2"
                onClick={() => setAba(item.id)}
                aria-label={item.rotulo}
                aria-current={aba === item.id}
                className={cn(
                  "rounded-lg p-2 transition",
                  aba === item.id
                    ? "bg-selecionado text-ink"
                    : "text-ink-faint hover:bg-hover hover:text-ink",
                )}
              >
                {item.icone}
              </button>
            </Tooltip>
          ))}
        </nav>

        <div data-gc="conversa.caixa-de-entrada.div" className="min-w-0 flex-1 overflow-y-auto">
          {aba === "nao-lidas" && <NaoLidas data-gc="conversa.caixa-de-entrada.nao-lidas" estados={naoLidas} onIr={() => setAberta(false)} />}
          {aba === "salvas" && <Salvas data-gc="conversa.caixa-de-entrada.salvas" ativo={aberta} />}
          {aba === "mencoes" && <Mencoes data-gc="conversa.caixa-de-entrada.mencoes" ativo={aberta} onIr={() => setAberta(false)} />}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Vazio: React.FC<{ icone: React.ReactNode; titulo: string; detalhe: string }> = ({
  icone,
  titulo,
  detalhe,
}) => (
  <div data-gc="conversa.caixa-de-entrada.div--2" className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
    <span data-gc="conversa.caixa-de-entrada.span--2" className="text-ink-faint/60">{icone}</span>
    <p data-gc="conversa.caixa-de-entrada.p" className="text-sm font-semibold">{titulo}</p>
    <p data-gc="conversa.caixa-de-entrada.p--2" className="text-xs leading-relaxed text-ink-muted">{detalhe}</p>
  </div>
);

const NaoLidas: React.FC<{
  estados: { channelId: string; guildId: string | null; channelName?: string | null; unreadCount: number; mentionCount: number }[];
  onIr: () => void;
}> = ({ estados, onIr }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!estados.length) {
    return (
      <Vazio data-gc="conversa.caixa-de-entrada.vazio"
        icone={<Confetti data-gc="conversa.caixa-de-entrada.confetti" size={40} />}
        titulo={t("conversa.entrada.fimTitulo")}
        detalhe={t("conversa.entrada.fimDetalhe")}
      />
    );
  }

  return (
    <div data-gc="conversa.caixa-de-entrada.div--3" className="p-2">
      {estados.map((estado) => (
        <button data-gc="conversa.caixa-de-entrada.button--3"
          key={estado.channelId}
          onClick={() => {
            navigate(
              estado.guildId
                ? `/channels/${estado.guildId}/${estado.channelId}`
                : `/dm/${estado.channelId}`,
            );
            onIr();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-hover"
        >
          <Hash data-gc="conversa.caixa-de-entrada.hash" size={16} weight="bold" className="shrink-0 text-ink-faint" />
          <span data-gc="conversa.caixa-de-entrada.span--3" className="min-w-0 flex-1 truncate text-sm">
            {estado.channelName ?? "conversa"}
          </span>

          {estado.mentionCount > 0 && (
            <span data-gc="conversa.caixa-de-entrada.span--4" className="shrink-0 rounded-full bg-danger px-1.5 text-xs font-semibold text-white">
              {estado.mentionCount}
            </span>
          )}
          <span data-gc="conversa.caixa-de-entrada.span--5" className="shrink-0 text-xs text-ink-faint">{estado.unreadCount}</span>
        </button>
      ))}
    </div>
  );
};

const Salvas: React.FC<{ ativo: boolean }> = ({ ativo }) => {
  const { t } = useTranslation();
  const { data: favoritas = [], isLoading } = useFavoriteMessages(ativo);
  const alternar = useToggleFavoriteMessage();

  if (isLoading) return <p data-gc="conversa.caixa-de-entrada.p--3" className="p-6 text-center text-sm text-ink-faint">{t("comum.carregando")}</p>;

  if (!favoritas.length) {
    return (
      <Vazio data-gc="conversa.caixa-de-entrada.vazio--2"
        icone={<BookmarkSimple data-gc="conversa.caixa-de-entrada.bookmark-simple--2" size={40} />}
        titulo={t("conversa.entrada.semSalvosTitulo")}
        detalhe={t("conversa.entrada.semSalvosDetalhe")}
      />
    );
  }

  return (
    <div data-gc="conversa.caixa-de-entrada.div--4">
      {favoritas.map((mensagem) => (
        <article data-gc="conversa.caixa-de-entrada.article" key={mensagem.id} className="group flex gap-3 border-b border-divisor px-3 py-3">
          <Avatar data-gc="conversa.caixa-de-entrada.avatar"
            id={mensagem.author.id}
            name={mensagem.author.displayName}
            url={mensagem.author.avatarUrl}
            size={32}
          />

          <div data-gc="conversa.caixa-de-entrada.div--5" className="min-w-0 flex-1">
            <p data-gc="conversa.caixa-de-entrada.p--4" className="flex items-baseline gap-2">
              <span data-gc="conversa.caixa-de-entrada.span--6" className="truncate text-sm font-semibold">{mensagem.author.displayName}</span>
              <span data-gc="conversa.caixa-de-entrada.span--7" className="shrink-0 text-xs text-ink-faint">
                {formatTimestamp(mensagem.createdAt)}
              </span>
            </p>

            <p data-gc="conversa.caixa-de-entrada.p--5" className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted [&_img]:inline-block [&_img]:size-4 [&_img]:align-text-bottom">
              {mensagem.content ? (
                <MessageContent data-gc="conversa.caixa-de-entrada.message-content" content={mensagem.content} emojis={[]} />
              ) : (
                "(anexo)"
              )}
            </p>
          </div>

          <button data-gc="conversa.caixa-de-entrada.button--4"
            onClick={() => alternar.mutate({ messageId: mensagem.id, favorita: true })}
            aria-label={t("conversa.entrada.tirarDosSalvos")}
            className="h-fit rounded p-1 text-ink-faint opacity-0 transition hover:text-danger group-hover:opacity-100"
          >
            <BookmarkSimple data-gc="conversa.caixa-de-entrada.bookmark-simple--3" size={16} weight="fill" className="text-danger" />
          </button>
        </article>
      ))}
    </div>
  );
};

const Mencoes: React.FC<{ ativo: boolean; onIr: () => void }> = ({ ativo, onIr }) => {
  const { t } = useTranslation();
  const { data: mencoes = [], isLoading } = useFindMentions(ativo);
  const navigate = useNavigate();

  if (isLoading) return <p data-gc="conversa.caixa-de-entrada.p--6" className="p-6 text-center text-sm text-ink-faint">{t("comum.carregando")}</p>;

  if (!mencoes.length) {
    return (
      <Vazio data-gc="conversa.caixa-de-entrada.vazio--3"
        icone={<At data-gc="conversa.caixa-de-entrada.at--2" size={40} />}
        titulo={t("conversa.entrada.semMencoesTitulo")}
        detalhe={t("conversa.entrada.semMencoesDetalhe")}
      />
    );
  }

  return (
    <div data-gc="conversa.caixa-de-entrada.div--6">
      {mencoes.map((mencao) => (
        <button data-gc="conversa.caixa-de-entrada.button--5"
          key={mencao.id}
          onClick={() => {
            navigate(
              mencao.canal.guildId
                ? `/channels/${mencao.canal.guildId}/${mencao.canal.id}`
                : `/dm/${mencao.canal.id}`,
            );
            onIr();
          }}
          className="flex w-full gap-3 border-b border-divisor px-3 py-3 text-left transition hover:bg-hover"
        >
          <Avatar data-gc="conversa.caixa-de-entrada.avatar--2"
            id={mencao.author.id}
            name={mencao.author.displayName}
            url={mencao.author.avatarUrl}
            size={32}
          />

          <div data-gc="conversa.caixa-de-entrada.div--7" className="min-w-0 flex-1">
            <p data-gc="conversa.caixa-de-entrada.p--7" className="flex items-baseline gap-2">
              <span data-gc="conversa.caixa-de-entrada.span--8" className="truncate text-sm font-semibold">{mencao.author.displayName}</span>
              <span data-gc="conversa.caixa-de-entrada.span--9" className="shrink-0 text-xs text-ink-faint">
                {formatTimestamp(mencao.createdAt)}
              </span>
            </p>

            <p data-gc="conversa.caixa-de-entrada.p--8" className="flex items-center gap-1 text-xs text-ink-faint">
              <Hash data-gc="conversa.caixa-de-entrada.hash--2" size={11} weight="bold" className="shrink-0" />
              {mencao.canal.nome}
            </p>

            <p data-gc="conversa.caixa-de-entrada.p--9" className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted [&_img]:inline-block [&_img]:size-4 [&_img]:align-text-bottom">
              {mencao.content ? <MessageContent data-gc="conversa.caixa-de-entrada.message-content--2" content={mencao.content} emojis={[]} /> : "(anexo)"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};
