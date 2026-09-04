import React, { useState } from "react";
import { useNavigate } from "react-router";
import { At, Bell, BookmarkSimple, Confetti, Hash, Tray } from "@phosphor-icons/react";

import { useFindMentions } from "~/@core/application/queries/message/use-find-mentions";
import { useReadStatesLista } from "~/@core/application/queries/message/use-read-states";
import {
  useFavoriteMessages,
  useToggleFavoriteMessage,
} from "~/@core/application/queries/message/use-message-favorites";
import { Avatar } from "~/components/Avatar";
import { MessageContent } from "~/components/MessageContent";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { formatTimestamp } from "~/lib/format";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

type Aba = "nao-lidas" | "salvas" | "mencoes";

/// A lista guarda a CHAVE: constante de módulo não pode chamar `t()`, que ali
/// resolveria antes de o idioma existir e ficaria congelada.
const ABAS: { id: Aba; rotulo: string; icone: React.ReactNode }[] = [
  { id: "nao-lidas", rotulo: "conversa.entrada.naoLidas", icone: <Bell size={16} weight="fill" /> },
  { id: "salvas", rotulo: "conversa.entrada.salvas", icone: <BookmarkSimple size={16} weight="fill" /> },
  { id: "mencoes", rotulo: "conversa.entrada.mencoes", icone: <At size={16} weight="bold" /> },
];

/**
 * A caixa de entrada: o que chegou pra você, fora da conversa aberta.
 *
 * Três abas — o que não foi lido, o que você guardou e quem
 * te citou. As três moram no mesmo balão porque respondem à mesma pergunta
 * ("tem algo esperando por mim?"), e separá-las em três botões no cabeçalho
 * era o que a gente tinha antes: o marcador de favoritas sozinho, sem o
 * resto.
 *
 * Cada aba só busca quando é aberta.
 */
export const CaixaDeEntrada: React.FC = () => {
  const { t } = useTranslation();
  const [aberta, setAberta] = useState(false);
  const [aba, setAba] = useState<Aba>("nao-lidas");

  const { data: estados = [] } = useReadStatesLista(aberta);
  const naoLidas = estados.filter((estado) => estado.unreadCount > 0);

  return (
    <Popover open={aberta} onOpenChange={setAberta}>
      <PopoverTrigger asChild>
        <button aria-label={t("conversa.entrada.titulo")} className="relative text-ink-muted transition hover:text-ink">
          <Tooltip label={t("conversa.entrada.titulo")}>
            <Tray size={20} weight="fill" />
          </Tooltip>

          {/* a bolinha só existe quando há algo esperando */}
          {naoLidas.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-danger" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="flex h-[30rem] w-[26rem] gap-0 p-0">
        {/* O trilho das abas, à esquerda. */}
        <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-divisor py-2">
          {ABAS.map((item) => (
            <Tooltip key={item.id} label={item.rotulo} side="left">
              <button
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

        <div className="min-w-0 flex-1 overflow-y-auto">
          {aba === "nao-lidas" && <NaoLidas estados={naoLidas} onIr={() => setAberta(false)} />}
          {aba === "salvas" && <Salvas ativo={aberta} />}
          {aba === "mencoes" && <Mencoes ativo={aberta} onIr={() => setAberta(false)} />}
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
  <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
    <span className="text-ink-faint/60">{icone}</span>
    <p className="text-sm font-semibold">{titulo}</p>
    <p className="text-xs leading-relaxed text-ink-muted">{detalhe}</p>
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
      <Vazio
        icone={<Confetti size={40} />}
        titulo={t("conversa.entrada.fimTitulo")}
        detalhe={t("conversa.entrada.fimDetalhe")}
      />
    );
  }

  return (
    <div className="p-2">
      {estados.map((estado) => (
        <button
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
          <Hash size={16} weight="bold" className="shrink-0 text-ink-faint" />
          <span className="min-w-0 flex-1 truncate text-sm">
            {estado.channelName ?? "conversa"}
          </span>

          {estado.mentionCount > 0 && (
            <span className="shrink-0 rounded-full bg-danger px-1.5 text-xs font-semibold text-white">
              {estado.mentionCount}
            </span>
          )}
          <span className="shrink-0 text-xs text-ink-faint">{estado.unreadCount}</span>
        </button>
      ))}
    </div>
  );
};

const Salvas: React.FC<{ ativo: boolean }> = ({ ativo }) => {
  const { t } = useTranslation();
  const { data: favoritas = [], isLoading } = useFavoriteMessages(ativo);
  const alternar = useToggleFavoriteMessage();

  if (isLoading) return <p className="p-6 text-center text-sm text-ink-faint">{t("comum.carregando")}</p>;

  if (!favoritas.length) {
    return (
      <Vazio
        icone={<BookmarkSimple size={40} />}
        titulo={t("conversa.entrada.semSalvosTitulo")}
        detalhe={t("conversa.entrada.semSalvosDetalhe")}
      />
    );
  }

  return (
    <div>
      {favoritas.map((mensagem) => (
        <article key={mensagem.id} className="group flex gap-3 border-b border-divisor px-3 py-3">
          <Avatar
            id={mensagem.author.id}
            name={mensagem.author.displayName}
            url={mensagem.author.avatarUrl}
            size={32}
          />

          <div className="min-w-0 flex-1">
            <p className="flex items-baseline gap-2">
              <span className="truncate text-sm font-semibold">{mensagem.author.displayName}</span>
              <span className="shrink-0 text-xs text-ink-faint">
                {formatTimestamp(mensagem.createdAt)}
              </span>
            </p>

            <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted [&_img]:inline-block [&_img]:size-4 [&_img]:align-text-bottom">
              {mensagem.content ? (
                <MessageContent content={mensagem.content} emojis={[]} />
              ) : (
                "(anexo)"
              )}
            </p>
          </div>

          <button
            onClick={() => alternar.mutate({ messageId: mensagem.id, favorita: true })}
            aria-label={t("conversa.entrada.tirarDosSalvos")}
            className="h-fit rounded p-1 text-ink-faint opacity-0 transition hover:text-danger group-hover:opacity-100"
          >
            <BookmarkSimple size={16} weight="fill" className="text-danger" />
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

  if (isLoading) return <p className="p-6 text-center text-sm text-ink-faint">{t("comum.carregando")}</p>;

  if (!mencoes.length) {
    return (
      <Vazio
        icone={<At size={40} />}
        titulo={t("conversa.entrada.semMencoesTitulo")}
        detalhe={t("conversa.entrada.semMencoesDetalhe")}
      />
    );
  }

  return (
    <div>
      {mencoes.map((mencao) => (
        <button
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
          <Avatar
            id={mencao.author.id}
            name={mencao.author.displayName}
            url={mencao.author.avatarUrl}
            size={32}
          />

          <div className="min-w-0 flex-1">
            <p className="flex items-baseline gap-2">
              <span className="truncate text-sm font-semibold">{mencao.author.displayName}</span>
              <span className="shrink-0 text-xs text-ink-faint">
                {formatTimestamp(mencao.createdAt)}
              </span>
            </p>

            <p className="flex items-center gap-1 text-xs text-ink-faint">
              <Hash size={11} weight="bold" className="shrink-0" />
              {mencao.canal.nome}
            </p>

            <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted [&_img]:inline-block [&_img]:size-4 [&_img]:align-text-bottom">
              {mencao.content ? <MessageContent content={mencao.content} emojis={[]} /> : "(anexo)"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};
