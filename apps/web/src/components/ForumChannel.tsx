import React, { useState } from "react";
import { MessageSquare, MessagesSquare, Plus, Lock } from "lucide-react";

import { useCreatePost, useFindPosts } from "~/@core/application/queries/forum/use-forum";
import type { ForumPostModel } from "~/@core/application/requests/forum/forum";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input, Label, campoBase } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { formatTimestamp } from "~/lib/format";

interface ForumChannelProps {
  channelId: string;
  channelName: string;
  podeEscrever: boolean;
  onAbrirPost: (post: ForumPostModel) => void;
}

/**
 * A lista de assuntos do fórum. Cada assunto tem conversa própria — clicar
 * abre a thread, como no Discord.
 */
export const ForumChannel: React.FC<ForumChannelProps> = ({
  channelId,
  channelName,
  podeEscrever,
  onAbrirPost,
}) => {
  const { data, isLoading } = useFindPosts(channelId);
  const [criando, setCriando] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <header className="mb-5 flex items-start gap-4">
        <div className="flex-1">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <MessagesSquare size={22} className="text-ink-faint" /> {channelName}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Cada assunto vira uma conversa separada — bom pra dúvida que não pode se perder no meio
            do papo.
          </p>
        </div>

        {podeEscrever && (
          <Button size="sm" onClick={() => setCriando(true)}>
            <Plus size={16} /> Novo assunto
          </Button>
        )}
      </header>

      {isLoading && <p className="text-sm text-ink-faint">Carregando…</p>}

      {!isLoading && !data?.posts.length && (
        <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
          <MessagesSquare size={28} className="mx-auto text-ink-faint" />
          <p className="mt-3 text-sm text-ink-muted">
            Nenhum assunto ainda. Comece o primeiro e a conversa fica organizada desde o início.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {(data?.posts ?? []).map((post) => (
          <button
            key={post.id}
            onClick={() => onAbrirPost(post)}
            className="flex w-full items-start gap-3 rounded-lg bg-surface-1 p-4 text-left transition hover:bg-surface-3"
          >
            <Avatar
              id={post.author.id}
              name={post.author.displayName}
              url={post.author.avatarUrl}
              size={40}
            />

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2">
                <span className="truncate font-semibold">{post.title}</span>
                {post.closedAt && (
                  <span className="flex shrink-0 items-center gap-1 rounded bg-surface-0 px-1.5 py-0.5 text-[10px] uppercase text-ink-faint">
                    <Lock size={10} /> fechado
                  </span>
                )}
              </p>

              <p className="mt-1 flex items-center gap-3 text-xs text-ink-faint">
                <span>{post.author.displayName}</span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={11} /> {post.messageCount}
                </span>
                <span>última atividade {formatTimestamp(post.lastMessageAt)}</span>
              </p>
            </div>
          </button>
        ))}
      </div>

      <CriarAssunto open={criando} channelId={channelId} onClose={() => setCriando(false)} onCriado={onAbrirPost} />
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
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo assunto</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="post-titulo">Título</Label>
            <Input
              id="post-titulo"
              autoFocus
              value={titulo}
              maxLength={100}
              placeholder="Do que se trata?"
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="post-conteudo">Primeira mensagem</Label>
            <textarea
              id="post-conteudo"
              value={conteudo}
              rows={5}
              maxLength={4000}
              placeholder="Conte o caso"
              onChange={(e) => setConteudo(e.target.value)}
              className={cn(campoBase, "resize-none")}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
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
