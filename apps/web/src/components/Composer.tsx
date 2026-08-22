import React, { useRef, useState } from "react";
import { BarChart3, FileUp, Plus, Send, Smile } from "lucide-react";
import { LIMITS, type Sticker } from "@gravae/shared";

import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import { startTyping } from "~/@core/lib/websocket/emit-message-actions";
import { AttachmentTray } from "~/components/AttachmentTray";
import { CreatePollModal } from "~/components/CreatePollModal";
import { ExpressionPicker, type Aba } from "~/components/ExpressionPicker";
import { MencaoSugestoes } from "~/components/MencaoSugestoes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useAttachments } from "~/hooks/use-attachments";
import { usePermissions } from "~/hooks/use-permissions";
import { detectarMencao, useMencoes, type Mencionavel } from "~/hooks/use-mencoes";
import { cn } from "~/lib/utils";

interface ComposerProps {
  channelId: string;
  channelName: string;
  /** servidor do canal — o seletor precisa dele para as expressões */
  guildId?: string;
  /** responder dentro de um assunto do fórum */
  postId?: string;
  /** sem SEND_MESSAGES o campo aparece bloqueado, como no Discord */
  podeEscrever?: boolean;
  podeAnexar?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({
  channelId,
  channelName,
  guildId,
  postId,
  podeEscrever = true,
  podeAnexar = true,
}) => {
  const sendMessage = useSendMessage();
  const anexos = useAttachments();

  const [value, setValue] = useState("");
  const [arrastando, setArrastando] = useState(false);
  const [seletor, setSeletor] = useState<Aba | null>(null);
  const [criandoEnquete, setCriandoEnquete] = useState(false);
  const [mencao, setMencao] = useState<{ termo: string; inicio: number } | null>(null);
  const [escolhido, setEscolhido] = useState(0);
  const lastTypingSent = useRef(0);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

  /**
   * A permissão é resolvida AQUI e não recebida por prop: o composer aparece em
   * quatro lugares (canal, chat da chamada, assunto do fórum, DM) e três deles
   * teriam que repassar a mesma prop por duas ou três camadas só para chegar
   * aqui. O detalhe do servidor já está no cache; perguntar custa nada.
   */
  const { data: detail } = useFindGuild(guildId);
  const { canInChannel } = usePermissions(detail);

  const { filtrar } = useMencoes(guildId, canInChannel(channelId, "MENTION_EVERYONE"));
  const sugestoes = mencao ? filtrar(mencao.termo) : [];

  /**
   * Troca o `@termo` que está sendo digitado pelo formato que o servidor
   * entende — `<@id>`, `<@&id>` ou `@everyone`.
   *
   * O texto guardado é o id, nunca o nome: é o que faz a menção sobreviver a
   * uma troca de apelido, e o que impede alguém de escrever à mão uma menção
   * que parece ser de outra pessoa.
   */
  const inserirMencao = (item: Mencionavel) => {
    const campo = textarea.current;
    if (!mencao || !campo) return;

    const cursor = campo.selectionStart ?? value.length;
    const texto = `${item.texto} `;
    const proximo = value.slice(0, mencao.inicio) + texto + value.slice(cursor);
    const posicao = mencao.inicio + texto.length;

    setValue(proximo);
    setMencao(null);
    requestAnimationFrame(() => {
      campo.focus();
      campo.setSelectionRange(posicao, posicao);
    });
  };

  const podeEnviar =
    podeEscrever && (value.trim().length > 0 || anexos.prontos.length > 0) && !anexos.subindo;

  const submit = () => {
    if (!podeEnviar) return;

    const content = value.trim();

    setValue("");
    setMencao(null);
    if (textarea.current) textarea.current.style.height = "auto";

    sendMessage.mutate({
      channelId,
      content,
      attachments: anexos.prontos,
      postId,
      nonce: crypto.randomUUID(),
    });

    anexos.clear();
  };

  /** Figurinha e GIF saem na hora: são a mensagem inteira, não um complemento. */
  const enviarFigurinha = (sticker: Sticker) => {
    sendMessage.mutate({ channelId, content: "", stickerId: sticker.id, postId, nonce: crypto.randomUUID() });
    setSeletor(null);
  };

  const enviarGif = (url: string) => {
    sendMessage.mutate({ channelId, content: url, postId, nonce: crypto.randomUUID() });
    setSeletor(null);
  };

  /** Emoji entra no texto, na posição do cursor. */
  const inserirEmoji = (texto: string) => {
    const campo = textarea.current;

    if (!campo) {
      setValue((atual) => atual + texto);
      return;
    }

    const inicio = campo.selectionStart ?? value.length;
    const fim = campo.selectionEnd ?? value.length;

    setValue(value.slice(0, inicio) + texto + value.slice(fim));
    requestAnimationFrame(() => {
      campo.focus();
      campo.setSelectionRange(inicio + texto.length, inicio + texto.length);
    });
  };

  /**
   * "Está digitando" com throttle: o evento só sai a cada 3s. Emitir a cada
   * tecla mandaria dezenas de mensagens por frase, à toa.
   */
  const notifyTyping = () => {
    const now = Date.now();
    if (now - lastTypingSent.current < 3000) return;

    lastTypingSent.current = now;
    void startTyping(channelId).catch(() => undefined);
  };

  /** Colar print da tela direto no chat — o caminho mais usado no dia a dia. */
  const colar = (evento: React.ClipboardEvent) => {
    const arquivos = [...evento.clipboardData.files];
    if (!arquivos.length) return;

    evento.preventDefault();
    void anexos.add(arquivos);
  };

  return (
    <div className="px-4 pb-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={(e) => {
          // só desliga quando sai do contêiner inteiro, não ao passar por um filho
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setArrastando(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          void anexos.add([...e.dataTransfer.files]);
        }}
        className={cn(
          /**
           * O campo é `surface-4`, um tom acima do painel: no chat escuro ele
           * precisa parecer levantado, não um buraco. Estava em `surface-3`, que
           * quase encostava na cor do fundo — e aí a caixa de escrever sumia.
           */
          "rounded-lg bg-surface-4 transition",
          arrastando && "ring-2 ring-brand ring-offset-2 ring-offset-surface-2",
        )}
      >
        <AttachmentTray
          items={anexos.items}
          onRemove={anexos.remove}
          onPatch={anexos.patchAttachment}
        />

        <div className="relative flex items-end gap-3 px-4">
          <MencaoSugestoes
            itens={sugestoes}
            indice={escolhido}
            onEscolher={inserirMencao}
            onPassarMouse={setEscolhido}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={!podeEscrever}>
              <button
                aria-label="Mais"
                className="py-3 text-ink-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Plus size={22} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuItem disabled={!podeAnexar} onSelect={() => inputArquivo.current?.click()}>
                Enviar um arquivo <FileUp size={16} />
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCriandoEnquete(true)}>
                Criar enquete <BarChart3 size={16} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            ref={inputArquivo}
            type="file"
            multiple
            onChange={(e) => {
              void anexos.add([...(e.target.files ?? [])]);
              e.target.value = ""; // permite escolher o mesmo arquivo de novo
            }}
            className="hidden"
          />

          <textarea
            ref={textarea}
            value={value}
            rows={1}
            maxLength={LIMITS.messageLength}
            disabled={!podeEscrever}
            placeholder={
              !podeEscrever
                ? "Você não tem permissão para enviar mensagens neste canal"
                : arrastando
                  ? "Solte para anexar"
                  : `Conversar em ${channelName ? `#${channelName}` : ""}`
            }
            onPaste={colar}
            onChange={(e) => {
              setValue(e.target.value);
              setMencao(detectarMencao(e.target.value, e.target.selectionStart ?? 0));
              setEscolhido(0);
              notifyTyping();
              // auto-grow até metade da tela
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, window.innerHeight / 2)}px`;
            }}
            /* mover o cursor com o mouse ou as setas também muda o `@` em foco */
            onClick={(e) => setMencao(detectarMencao(value, e.currentTarget.selectionStart ?? 0))}
            onBlur={() => setMencao(null)}
            onKeyDown={(e) => {
              /**
               * Com a lista aberta, as teclas são DELA. Enter escolhendo alguém
               * não pode mandar a mensagem no meio da frase — é o erro que faz
               * a pessoa desistir do autocomplete e digitar o nome na mão.
               */
              if (sugestoes.length) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const passo = e.key === "ArrowDown" ? 1 : -1;
                  setEscolhido((i) => (i + passo + sugestoes.length) % sugestoes.length);
                  return;
                }

                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  const item = sugestoes[escolhido];
                  if (item) inserirMencao(item);
                  return;
                }

                if (e.key === "Escape") {
                  e.preventDefault();
                  setMencao(null);
                  return;
                }
              }

              // seta com a lista fechada só anda o cursor: reavalia o `@` em foco
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                requestAnimationFrame(() =>
                  setMencao(detectarMencao(value, textarea.current?.selectionStart ?? 0)),
                );
              }

              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="max-h-[50vh] flex-1 resize-none bg-transparent py-3 text-ink outline-none placeholder:text-ink-faint disabled:cursor-not-allowed"
          />

          <Popover
            open={seletor !== null}
            onOpenChange={(aberto) => setSeletor(aberto ? (seletor ?? "emoji") : null)}
          >
            {/*
              Um botão só, como no Discord. GIF e figurinha continuam a um
              clique de distância — são abas do próprio seletor, e três gatilhos
              lado a lado para o mesmo painel só ocupavam a barra.
            */}
            <PopoverTrigger asChild>
              <span className="flex items-center">
                <BotaoDeExpressao
                  label="Emoji, GIF e figurinhas"
                  ativo={seletor !== null}
                  onClick={() => setSeletor(seletor ? null : "emoji")}
                >
                  <Smile size={20} />
                </BotaoDeExpressao>
              </span>
            </PopoverTrigger>

            <PopoverContent side="top" align="end" className="w-auto border-0 bg-transparent p-0">
              {seletor && (
                <ExpressionPicker
                  guildId={guildId}
                  abaInicial={seletor}
                  onEmoji={(texto) => inserirEmoji(texto)}
                  onSticker={enviarFigurinha}
                  onGif={(gif) => enviarGif(gif.url)}
                />
              )}
            </PopoverContent>
          </Popover>

          <Tooltip label={anexos.subindo ? "Aguardando o upload" : "Enviar"}>
            <button
              onClick={submit}
              disabled={!podeEnviar}
              aria-label="Enviar"
              className="py-3 text-ink-muted transition hover:text-brand disabled:opacity-30"
            >
              <Send size={20} />
            </button>
          </Tooltip>
        </div>
      </div>

      <CreatePollModal
        open={criandoEnquete}
        onClose={() => setCriandoEnquete(false)}
        onCriar={(poll) => {
          sendMessage.mutate({ channelId, content: "", poll, postId, nonce: crypto.randomUUID() });
          setCriandoEnquete(false);
        }}
      />
    </div>
  );
};

interface BotaoDeExpressaoProps {
  label: string;
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const BotaoDeExpressao: React.FC<BotaoDeExpressaoProps> = ({ label, ativo, onClick, children }) => (
  <Tooltip label={label}>
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-9 w-8 items-center justify-center rounded transition",
        ativo ? "text-ink" : "text-ink-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  </Tooltip>
);
