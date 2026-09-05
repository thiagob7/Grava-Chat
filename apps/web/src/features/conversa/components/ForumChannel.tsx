import React, { useState } from "react";
import { MessageSquare, MessagesSquare, Plus, Lock } from "lucide-react";

import { useCreatePost, useFindPosts } from "~/@core/application/queries/forum/use-forum";
import type { ForumPostModel } from "~/@core/application/requests/forum/forum";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input, Label, Textarea } from "~/components/ui/input";
import { formatTimestamp } from "~/lib/format";
import { useTranslation } from "~/traducao";

interface ForumChannelProps {
  channelId: string;
  channelName: string;
  podeEscrever: boolean;
  onAbrirPost: (post: ForumPostModel) => void;
}

export const ForumChannel: React.FC<ForumChannelProps> = ({
  channelId,
  channelName,
  podeEscrever,
  onAbrirPost,
}) => {
  const { t } = useTranslation();
  const { data, isLoading } = useFindPosts(channelId);
  const [criando, setCriando] = useState(false);

  return (
    <div data-gc="conversa.forum-channel.div" className="flex-1 overflow-y-auto p-6">
      <header data-gc="conversa.forum-channel.header" className="mb-5 flex items-start gap-4">
        <div data-gc="conversa.forum-channel.div--2" className="flex-1">
          <h2 data-gc="conversa.forum-channel.h2" className="flex items-center gap-2 text-xl font-semibold">
            <MessagesSquare data-gc="conversa.forum-channel.messages-square" size={22} className="text-ink-faint" /> {channelName}
          </h2>
          <p data-gc="conversa.forum-channel.p" className="mt-1 text-sm text-ink-muted">
            {t("conversa.forum.descricao")}
          </p>
        </div>

        {podeEscrever && (
          <Button data-gc="conversa.forum-channel.button" size="sm" onClick={() => setCriando(true)}>
            <Plus data-gc="conversa.forum-channel.plus" size={16} /> {t("conversa.forum.novoAssunto")}
          </Button>
        )}
      </header>

      {isLoading && <p data-gc="conversa.forum-channel.p--2" className="text-sm text-ink-faint">{t("comum.carregando")}</p>}

      {!isLoading && !data?.posts.length && (
        <div data-gc="conversa.forum-channel.div--3" className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
          <MessagesSquare data-gc="conversa.forum-channel.messages-square--2" size={28} className="mx-auto text-ink-faint" />
          <p data-gc="conversa.forum-channel.p--3" className="mt-3 text-sm text-ink-muted">
            {t("conversa.forum.vazio")}
          </p>
        </div>
      )}

      <div data-gc="conversa.forum-channel.div--4" className="space-y-2">
        {(data?.posts ?? []).map((post) => (
          <button data-gc="conversa.forum-channel.button--2"
            key={post.id}
            onClick={() => onAbrirPost(post)}
            className="flex w-full items-start gap-3 rounded-lg bg-surface-1 p-4 text-left transition hover:bg-surface-3"
          >
            <Avatar data-gc="conversa.forum-channel.avatar"
              id={post.author.id}
              name={post.author.displayName}
              url={post.author.avatarUrl}
              size={40}
            />

            <div data-gc="conversa.forum-channel.div--5" className="min-w-0 flex-1">
              <p data-gc="conversa.forum-channel.p--4" className="flex items-center gap-2">
                <span data-gc="conversa.forum-channel.span" className="truncate font-semibold">{post.title}</span>
                {post.closedAt && (
                  <span data-gc="conversa.forum-channel.span--2" className="flex shrink-0 items-center gap-1 rounded bg-surface-0 px-1.5 py-0.5 text-10 uppercase text-ink-faint">
                    <Lock data-gc="conversa.forum-channel.lock" size={10} /> fechado
                  </span>
                )}
              </p>

              <p data-gc="conversa.forum-channel.p--5" className="mt-1 flex items-center gap-3 text-xs text-ink-faint">
                <span data-gc="conversa.forum-channel.span--3">{post.author.displayName}</span>
                <span data-gc="conversa.forum-channel.span--4" className="flex items-center gap-1">
                  <MessageSquare data-gc="conversa.forum-channel.message-square" size={11} /> {post.messageCount}
                </span>
                <span data-gc="conversa.forum-channel.span--5">última atividade {formatTimestamp(post.lastMessageAt)}</span>
              </p>
            </div>
          </button>
        ))}
      </div>

      <CriarAssunto data-gc="conversa.forum-channel.criar-assunto.on-abrir-post" open={criando} channelId={channelId} onClose={() => setCriando(false)} onCriado={onAbrirPost} />
    </div>
  );
};

interface CriarAssuntoProps {
  open: boolean;
  channelId: string;
  onClose: () => void;
  onCriado: (post: ForumPostModel) => void;
}

const CriarAssunto: React.FC<CriarAssuntoProps> = ({ open, channelId, onClose, onCriado }) => {
  const { t } = useTranslation();
  const criar = useCreatePost(channelId);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");

  const enviar = async () => {
    const criado = await criar
      .mutateAsync({ channelId, title: titulo.trim(), content: conteudo.trim() })
      .catch(() => null);

    if (!criado) return;

    setTitulo("");
    setConteudo("");
    onClose();
    onCriado(criado.post);
  };

  return (
    <Dialog data-gc="conversa.forum-channel.dialog" open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent data-gc="conversa.forum-channel.dialog-content">
        <DialogHeader data-gc="conversa.forum-channel.dialog-header">
          <DialogTitle data-gc="conversa.forum-channel.dialog-title">{t("conversa.forum.novoAssunto")}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="conversa.forum-channel.dialog-body" className="space-y-4">
          <div data-gc="conversa.forum-channel.div--6">
            <Label data-gc="conversa.forum-channel.label" htmlFor="post-titulo">{t("conversa.forum.titulo")}</Label>
            <Input data-gc="conversa.forum-channel.input"
              id="post-titulo"
              autoFocus
              value={titulo}
              maxLength={100}
              placeholder={t("conversa.forum.doQueSeTrata")}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div data-gc="conversa.forum-channel.div--7">
            <Label data-gc="conversa.forum-channel.label--2" htmlFor="post-conteudo">{t("conversa.forum.primeiraMensagem")}</Label>
            <Textarea data-gc="conversa.forum-channel.textarea"
              id="post-conteudo"
              value={conteudo}
              rows={5}
              maxLength={4000}
              placeholder={t("conversa.forum.conteDoCaso")}
              onChange={(e) => setConteudo(e.target.value)}
            />
          </div>
        </DialogBody>

        <DialogFooter data-gc="conversa.forum-channel.dialog-footer">
          <Button data-gc="conversa.forum-channel.button.on-close" variant="ghost" onClick={onClose}>
            {t("comum.cancelar")}
          </Button>
          <Button data-gc="conversa.forum-channel.button--3"
            disabled={!titulo.trim() || !conteudo.trim() || criar.isPending}
            onClick={() => void enviar()}
          >
            {criar.isPending ? "Criando…" : "Criar assunto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
