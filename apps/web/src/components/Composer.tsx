import React, { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, FileUp, Plus, Send, Smile, X } from "lucide-react";
import { LIMITS, type FonteDeNome, type Sticker } from "@gravae/shared";

import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import type { MessagePageModel } from "~/@core/domain/models/message-model";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { mensagemParaEditar } from "~/lib/editar-com-a-seta";
import { useEdicaoStore } from "~/stores/edicao-store";
import { invocarComando, startTyping } from "~/@core/lib/websocket/emit-message-actions";
import { AttachmentTray } from "~/components/AttachmentTray";
import { CreatePollModal } from "~/components/CreatePollModal";
import { ExpressionPicker, type Aba } from "~/components/ExpressionPicker";
import { ComandoSugestoes, DicaDoComando } from "~/components/ComandoSugestoes";
import { MencaoSugestoes } from "~/components/MencaoSugestoes";
import {
  SeletorDeFonte,
  guardarFonte,
  lerFonteSalva,
} from "~/components/SeletorDeFonte";
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
import { detectarComando, useComandos } from "~/hooks/use-comandos";
import { detectarMencao, useMencoes, type Mencionavel } from "~/hooks/use-mencoes";
import { familiaDaFonte } from "~/lib/cosmeticos/fontes";
import { cn } from "~/lib/utils";
import { useReplyStore } from "~/stores/reply-store";
import { useAparencia } from "~/stores/aparencia";
import { converterEmoticons } from "~/lib/emoticons";
import { toast } from "react-toastify";

interface ComposerProps {
  channelId: string;
  channelName: string;
  guildId?: string;
  postId?: string;
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
  const respostaAberta = useReplyStore((s) => s.alvo);
  const mencionarAoResponder = useReplyStore((s) => s.mencionar);
  const alternarMencao = useReplyStore((s) => s.alternarMencao);
  const cancelarResposta = useReplyStore((s) => s.cancelar);

  /// A barra é do canal em que a resposta começou. Trocar de canal com uma
  /// resposta pendente não pode levar o alvo junto.
  const resposta = respostaAberta?.channelId === channelId ? respostaAberta : null;

  const [fonte, setFonte] = useState<FonteDeNome>(lerFonteSalva);
  const anexos = useAttachments();

  const [value, setValue] = useState("");

  const queryClient = useQueryClient();
  const pedirEdicao = useEdicaoStore((s) => s.pedir);

  /*
    A seta pra cima com o campo vazio abre a última mensagem SUA para editar.

    As mensagens saem direto do cache da consulta em vez de virarem props: a
    lista já as tem, e passá-las por aqui obrigaria o campo a redesenhar a cada
    mensagem nova que chegasse no canal — enquanto você digita.

    Quem decide QUAL mensagem é o `lib/editar-com-a-seta.ts`; aqui só se junta
    o material e se entrega o pedido.
  */
  const abrirUltimaParaEditar = () => {
    const chave = postId ? queryKeys.channel.postMessages(postId) : queryKeys.channel.messages(channelId);
    const cache = queryClient.getQueryData<{ pages: MessagePageModel[] }>(chave);
    const eu = queryClient.getQueryData<SelfUserModel>([queryKeys.auth.me]);

    /// as páginas vêm da mais recente para a mais antiga; a regra espera o contrário
    const mensagens = [...(cache?.pages ?? [])].reverse().flatMap((p) => p.messages);

    const alvo = mensagemParaEditar({ rascunho: value, euSou: eu?.id, mensagens });
    if (!alvo) return false;

    pedirEdicao(alvo);
    return true;
  };
  const [arrastando, setArrastando] = useState(false);
  const [seletor, setSeletor] = useState<Aba | null>(null);
  const [criandoEnquete, setCriandoEnquete] = useState(false);
  const [mencao, setMencao] = useState<{ termo: string; inicio: number } | null>(null);
  const [comando, setComando] = useState<{ termo: string } | null>(null);
  const [escolhido, setEscolhido] = useState(0);
  const lastTypingSent = useRef(0);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const { data: detail } = useFindGuild(guildId);
  const { canInChannel } = usePermissions(detail);

  const mostrarSugestoes = useAparencia((s) => s.sugestoes);
  const converterEmoticon = useAparencia((s) => s.emoticons);
  const mostrarBotaoDeEnviar = useAparencia((s) => s.botaoDeEnviar);

  const { filtrar } = useMencoes(guildId, canInChannel(channelId, "MENTION_EVERYONE"));
  const sugestoes = mostrarSugestoes && mencao ? filtrar(mencao.termo) : [];

  const { filtrar: filtrarComandos, analisar } = useComandos(guildId);
  const comandos = mostrarSugestoes && comando ? filtrarComandos(comando.termo) : [];

  /*
    Um anexo desliga o modo comando.

    Comando de barra não carrega arquivo — quem arrastou algo para a caixa
    está mandando uma mensagem, e a barra ali é texto. Melhor do que engolir o
    anexo calado na hora de invocar.
  */
  const invocacao = anexos.items.length ? null : analisar(value);

  const escolherComando = (item: (typeof comandos)[number]) => {
    const campo = textarea.current;
    const texto = `/${item.nome} `;

    setValue(texto);
    setComando(null);
    requestAnimationFrame(() => {
      campo?.focus();
      campo?.setSelectionRange(texto.length, texto.length);
    });
  };

  /// A detecção das duas listas anda junta: o que abre uma fecha a outra, e
  /// esquecer uma delas deixaria a lista velha na tela.
  const detectar = (texto: string, cursor: number) => {
    setMencao(detectarMencao(texto, cursor));
    setComando(detectarComando(texto, cursor));
  };

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
    podeEscrever &&
    (value.trim().length > 0 || anexos.prontos.length > 0) &&
    !anexos.subindo &&
    /// Comando pela metade não sai. A dica em cima já diz o que falta, e
    /// mandar assim só renderia um erro do servidor dizendo a mesma coisa.
    !invocacao?.faltando.length;

  const limparCaixa = () => {
    setValue("");
    setMencao(null);
    setComando(null);
    if (textarea.current) textarea.current.style.height = "auto";
  };

  const submit = () => {
    if (!podeEnviar) return;

    /*
      Comando não vira mensagem daqui.

      Quem escreve o rastro no canal é o servidor, junto de entregar ao bot —
      as duas coisas na mesma transação. Mandar o texto por fora deixaria a
      linha "/play ..." no canal mesmo quando o comando fosse recusado.
    */
    if (invocacao) {
      limparCaixa();
      cancelarResposta();

      void invocarComando({
        channelId,
        botId: invocacao.comando.botId,
        comando: invocacao.comando.nome,
        opcoes: invocacao.opcoes,
      }).catch((erro: Error) => toast.error(erro.message));

      return;
    }

    const escrito = value.trim();
    const content = converterEmoticon ? converterEmoticons(escrito) : escrito;

    limparCaixa();

    sendMessage.mutate({
      channelId,
      content:
        resposta && mencionarAoResponder ? `<@${resposta.autorId}> ${content}`.trim() : content,
      ...(fonte !== "padrao" ? { fonte } : {}),
      attachments: anexos.prontos,
      replyToId: resposta?.messageId ?? null,
      postId,
      nonce: crypto.randomUUID(),
    });

    anexos.clear();
    cancelarResposta();
  };

  const enviarFigurinha = (sticker: Sticker) => {
    sendMessage.mutate({ channelId, content: "", stickerId: sticker.id, postId, nonce: crypto.randomUUID() });
    setSeletor(null);
  };

  const enviarGif = (url: string) => {
    sendMessage.mutate({ channelId, content: url, postId, nonce: crypto.randomUUID() });
    setSeletor(null);
  };

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

  const notifyTyping = () => {
    const now = Date.now();
    if (now - lastTypingSent.current < 3000) return;

    lastTypingSent.current = now;
    void startTyping(channelId).catch(() => undefined);
  };

  const colar = (evento: React.ClipboardEvent) => {
    const arquivos = [...evento.clipboardData.files];
    if (!arquivos.length) return;

    evento.preventDefault();
    void anexos.add(arquivos);
  };

  return (
    /*
      Container próprio: a caixa de escrever não está dentro da lista, e é a
      largura DELA que decide o que cabe na fileira de botões.
    */
    <div className="@container px-2 pb-4 @sm:px-4 @sm:pb-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setArrastando(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          void anexos.add([...e.dataTransfer.files]);
        }}
        className={cn(
          "rounded-lg bg-surface-4 transition",
          arrastando && "ring-2 ring-brand ring-offset-2 ring-offset-surface-2",
        )}
      >
        {resposta && (
          <div className="flex items-center gap-2 rounded-t-lg bg-surface-3 px-3 py-1.5 text-sm @sm:px-4">
            <span className="min-w-0 flex-1 truncate text-ink-muted">
              Respondendo para <span className="font-semibold text-ink">{resposta.autor}</span>
            </span>

            <button
              type="button"
              onClick={alternarMencao}
              title={
                mencionarAoResponder
                  ? "A pessoa vai ser notificada"
                  : "A pessoa não vai ser notificada"
              }
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-xs font-bold uppercase transition",
                mencionarAoResponder
                  ? "text-brand hover:bg-surface-4"
                  : "text-ink-faint hover:bg-surface-4 hover:text-ink-muted",
              )}
            >
              @ {mencionarAoResponder ? "ligado" : "desligado"}
            </button>

            <button
              type="button"
              onClick={cancelarResposta}
              aria-label="Parar de responder"
              className="shrink-0 rounded-full p-0.5 text-ink-faint transition hover:bg-surface-4 hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <AttachmentTray
          items={anexos.items}
          onRemove={anexos.remove}
          onPatch={anexos.patchAttachment}
        />

        <div className="relative flex items-end gap-1.5 px-2 @sm:gap-3 @sm:px-4">
          <MencaoSugestoes
            itens={sugestoes}
            indice={escolhido}
            onEscolher={inserirMencao}
            onPassarMouse={setEscolhido}
          />

          <ComandoSugestoes
            itens={comandos}
            indice={escolhido}
            onEscolher={escolherComando}
            onPassarMouse={setEscolhido}
          />

          {/*
            A dica entra quando não há lista aberta.

            As três ocupam o mesmo lugar — `absolute bottom-full` — e a última
            desenhada tapa as outras. Sem esta condição, escolher uma pessoa
            para uma opção `usuario` seria escolher às cegas: a lista de
            menções existiria, embaixo da dica, invisível.
          */}
          {!comandos.length && !sugestoes.length && invocacao && (
            <DicaDoComando
              comando={invocacao.comando}
              preenchidas={invocacao.opcoes}
              faltando={invocacao.faltando}
            />
          )}

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
              e.target.value = "";
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
              detectar(e.target.value, e.target.selectionStart ?? 0);
              setEscolhido(0);
              notifyTyping();
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, window.innerHeight / 2)}px`;
            }}
            onClick={(e) => detectar(value, e.currentTarget.selectionStart ?? 0)}
            onBlur={() => {
              setMencao(null);
              setComando(null);
            }}
            onKeyDown={(e) => {
              /*
                Depois das listas de sugestão e antes de tudo o mais: com o
                menu de comandos ou de menções aberto, a seta é deles — ela
                escolhe item, e roubá-la ali quebraria a navegação.
              */
              if (e.key === "ArrowUp" && !sugestoes.length && !comandos.length) {
                if (abrirUltimaParaEditar()) {
                  e.preventDefault();
                  return;
                }
              }

              if (e.key === "Escape" && resposta && !sugestoes.length && !comandos.length) {
                e.preventDefault();
                cancelarResposta();
                return;
              }

              if (comandos.length) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const passo = e.key === "ArrowDown" ? 1 : -1;
                  setEscolhido((i) => (i + passo + comandos.length) % comandos.length);
                  return;
                }

                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  const item = comandos[escolhido];
                  if (item) escolherComando(item);
                  return;
                }

                if (e.key === "Escape") {
                  e.preventDefault();
                  setComando(null);
                  return;
                }
              }

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

              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                requestAnimationFrame(() =>
                  detectar(value, textarea.current?.selectionStart ?? 0),
                );
              }

              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            style={{ fontFamily: familiaDaFonte(fonte) ?? undefined }}
            /// `placeholder:truncate`: "Conversar em #tecnologia" quebrava em
            /// duas linhas e empurrava a caixa toda para cima; agora ele para
            /// nas reticências.
            className="max-h-[50vh] min-w-0 flex-1 resize-none bg-transparent py-3 text-ink outline-none placeholder:truncate placeholder:text-ink-faint disabled:cursor-not-allowed"
          />

          {/*
            Os botões têm 36px e a linha é `items-end`, então colariam no fundo
            da caixa — 6px abaixo do texto, que tem `py-3`. A margem devolve os
            três ao centro da linha escrita; com o textarea crescendo, a âncora
            continua certa, porque a última linha é que fica no fundo.
          */}
          <div className="mb-1.5 flex shrink-0 items-center gap-1 @sm:gap-3">
            {/*
              A fonte é a menos usada das três e a única que tem casa em outro
              lugar (ela fica guardada). Na coluna estreita ela sai para o
              texto caber.
            */}
            <span className="hidden @sm:flex">
            <SeletorDeFonte
              fonte={fonte}
              disabled={!podeEscrever}
              onEscolher={(nova) => {
                setFonte(nova);
                guardarFonte(nova);
                setTimeout(() => textarea.current?.focus(), 0);
              }}
            />
            </span>

            <Popover
              open={seletor !== null}
              onOpenChange={(aberto) => setSeletor(aberto ? (seletor ?? "emoji") : null)}
            >
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
                    onFechar={() => setSeletor(null)}
                    onEmoji={(texto) => inserirEmoji(texto)}
                    onSticker={enviarFigurinha}
                    onGif={(gif) => enviarGif(gif.url)}
                  />
                )}
              </PopoverContent>
            </Popover>

            {mostrarBotaoDeEnviar && (
              <Tooltip label={anexos.subindo ? "Aguardando o upload" : "Enviar"}>
                <button
                  onClick={submit}
                  disabled={!podeEnviar}
                  aria-label="Enviar"
                  className="flex size-9 shrink-0 items-center justify-center rounded text-ink-muted transition hover:text-brand disabled:opacity-30"
                >
                  <Send size={20} />
                </button>
              </Tooltip>
            )}
          </div>
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
        "flex size-9 shrink-0 items-center justify-center rounded transition",
        ativo ? "text-ink" : "text-ink-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  </Tooltip>
);
