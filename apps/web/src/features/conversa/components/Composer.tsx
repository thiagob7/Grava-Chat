import React, { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, FileUp, Paperclip, Plus, Send, Timer, X } from "lucide-react";
import { LIMITS, type FonteDeNome, type Sticker } from "@gravae/shared";

import { EspelhoDoCompositor } from "~/features/conversa/components/EspelhoDoCompositor";

import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import type { MessagePageModel } from "~/@core/domain/models/message-model";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { mensagemParaEditar } from "~/features/conversa/lib/editar-com-a-seta";
import { useEdicaoStore } from "~/features/conversa/stores/edicao-store";
import { invocarComando, startTyping } from "~/@core/lib/websocket/emit-message-actions";
import { AttachmentTray } from "~/features/conversa/components/AttachmentTray";
import { CreatePollModal } from "~/features/conversa/components/CreatePollModal";
import { ExpressionPicker, type Aba } from "~/features/expressao/components/ExpressionPicker";
import { useAtalhoGlobal } from "~/features/app/hooks/use-atalho-global";
import { AcoesDaCaixa } from "~/features/conversa/components/AcoesDaCaixa";
import { ComandoSugestoes, DicaDoComando } from "~/features/conversa/components/ComandoSugestoes";
import { MencaoSugestoes } from "~/features/conversa/components/MencaoSugestoes";
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
import { useAttachments } from "~/features/conversa/hooks/use-attachments";
import { usePermissions } from "~/hooks/use-permissions";
import { detectarComando, useComandos } from "~/features/conversa/hooks/use-comandos";
import { detectarMencao, useMencoes, type Mencionavel } from "~/features/conversa/hooks/use-mencoes";
import { familiaDaFonte } from "~/features/perfil/lib/fontes";
import { cn } from "~/lib/utils";
import { useReplyStore } from "~/features/conversa/stores/reply-store";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { Button } from "~/components/ui/button";
import { ModalIlustrado } from "~/components/ui/modal-ilustrado";
import {
  ArteDeArquivoGrande,
  ArteDeTextoLongo,
} from "~/features/conversa/components/artes/ArteDeLimite";
import { cercarCodigo, pareceCodigo, textoParaArquivo } from "~/features/conversa/lib/codigo";

import { converterEmoticons } from "~/features/conversa/lib/emoticons";
import { useTranslation } from "~/traducao";
import { toast } from "react-toastify";
import { flx, flxAttr } from "~/lib/compat-fluxer";

interface ComposerProps {
  channelId: string;
  channelName: string;
  guildId?: string;
  postId?: string;
  podeEscrever?: boolean;
  podeAnexar?: boolean;
  modoLento?: number;
}

export const Composer: React.FC<ComposerProps> = ({
  channelId,
  channelName,
  guildId,
  postId,
  podeEscrever = true,
  podeAnexar = true,
  modoLento = 0,
}) => {
  const { t } = useTranslation();
  const sendMessage = useSendMessage();
  const respostaAberta = useReplyStore((s) => s.alvo);
  const mencionarAoResponder = useReplyStore((s) => s.mencionar);
  const alternarMencao = useReplyStore((s) => s.alternarMencao);
  const cancelarResposta = useReplyStore((s) => s.cancelar);

  const resposta = respostaAberta?.channelId === channelId ? respostaAberta : null;

  const [fonte, setFonte] = useState<FonteDeNome>(lerFonteSalva);
  const anexos = useAttachments();

  const [value, setValue] = useState("");
  const [textoLongo, setTextoLongo] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const pedirEdicao = useEdicaoStore((s) => s.pedir);

  const abrirUltimaParaEditar = () => {
    const chave = postId ? queryKeys.channel.postMessages(postId) : queryKeys.channel.messages(channelId);
    const cache = queryClient.getQueryData<{ pages: MessagePageModel[] }>(chave);
    const eu = queryClient.getQueryData<SelfUserModel>([queryKeys.auth.me]);

    const mensagens = [...(cache?.pages ?? [])].reverse().flatMap((p) => p.messages);

    const alvo = mensagemParaEditar({ rascunho: value, euSou: eu?.id, mensagens });
    if (!alvo) return false;

    pedirEdicao(alvo);
    return true;
  };
  const [arrastando, setArrastando] = useState(false);
  const [seletor, setSeletor] = useState<Aba | null>(null);

  useAtalhoGlobal("expressoes", () => {
    if (podeEscrever) setSeletor((atual) => (atual ? null : "emoji"));
  });
  const [criandoEnquete, setCriandoEnquete] = useState(false);
  const [mencao, setMencao] = useState<{ termo: string; inicio: number } | null>(null);
  const [comando, setComando] = useState<{ termo: string } | null>(null);
  const [escolhido, setEscolhido] = useState(0);
  const lastTypingSent = useRef(0);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const espelho = useRef<HTMLDivElement>(null);
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
    !invocacao?.faltando.length;

  const limparCaixa = () => {
    setValue("");
    setMencao(null);
    setComando(null);
    if (textarea.current) textarea.current.style.height = "auto";
  };

  const [esperaAte, setEsperaAte] = useState(0);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (esperaAte <= agora) return;

    const relogio = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(relogio);
  }, [esperaAte, agora]);

  useEffect(() => setEsperaAte(0), [channelId]);

  const faltam = Math.max(0, Math.ceil((esperaAte - agora) / 1000));

  const marcarEspera = () => {
    if (modoLento > 0) setEsperaAte(Date.now() + modoLento * 1000);
  };

  const submit = () => {
    if (!podeEnviar) return;

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
      content,
      mencionarAutor: Boolean(resposta && mencionarAoResponder),
      ...(fonte !== "padrao" ? { fonte } : {}),
      attachments: anexos.prontos,
      replyToId: resposta?.messageId ?? null,
      postId,
      nonce: crypto.randomUUID(),
    });

    anexos.clear();
    cancelarResposta();
    marcarEspera();
  };

  const enviarFigurinha = (sticker: Sticker) => {
    sendMessage.mutate({ channelId, content: "", stickerId: sticker.id, postId, nonce: crypto.randomUUID() });
    marcarEspera();
    setSeletor(null);
  };

  const enviarGif = (url: string) => {
    sendMessage.mutate({ channelId, content: url, postId, nonce: crypto.randomUUID() });
    marcarEspera();
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

    if (arquivos.length) {
      evento.preventDefault();
      void anexos.add(arquivos);
      return;
    }

    const texto = evento.clipboardData.getData("text");
    if (!texto) return;

    const campoDeTexto = textarea.current;
    const jaTem =
      value.length -
      ((campoDeTexto?.selectionEnd ?? 0) - (campoDeTexto?.selectionStart ?? 0));

    /*
      Colar mais do que cabe: em vez de truncar em silêncio, oferecemos mandar
      como arquivo. É o caso de quem cola um arquivo inteiro na conversa.
    */
    if (jaTem + texto.length > LIMITS.messageLength) {
      evento.preventDefault();
      setTextoLongo(texto);
      return;
    }

    if (!pareceCodigo(texto)) return;

    const cercado = cercarCodigo(texto);
    const campo = textarea.current;
    const inicio = campo?.selectionStart ?? value.length;
    const fim = campo?.selectionEnd ?? value.length;
    const proximo = value.slice(0, inicio) + cercado + value.slice(fim);

    evento.preventDefault();
    setValue(proximo);

    requestAnimationFrame(() => {
      if (!campo) return;

      const cursor = inicio + cercado.length;
      campo.focus();
      campo.setSelectionRange(cursor, cursor);

      campo.style.height = "auto";
      campo.style.height = `${Math.min(campo.scrollHeight, window.innerHeight / 2)}px`;
    });
  };

  /// Vira anexo com a extensão que o próprio texto denuncia, e não um .txt
  /// genérico: assim a prévia já abre com o realce certo do outro lado.
  const virarArquivo = (texto: string) => {
    const { nome, conteudo } = textoParaArquivo(texto);

    void anexos.add([new File([conteudo], nome, { type: "text/plain;charset=utf-8" })]);
  };

  /*
    Vai TUDO no mesmo arquivo: o que já estava escrito mais o que foi colado.
    Mandar só o pedaço que estourou deixava o resto como texto solto na caixa,
    e a mensagem saía partida entre blocos e anexo.
  */
  const mandarComoArquivo = () => {
    if (!textoLongo) return;

    /*
      O que já estava na caixa vem cercado (o colar de código cerca na hora),
      mas o texto novo costuma chegar cru. Emendar os dois assim daria
      "bloco + texto solto", e o arquivo cairia para .txt em vez de .js.

      Só que quem cola um markdown inteiro já traz as cercas — e cercar de
      novo aninhava uma na outra, que é o que fazia o arquivo sair .txt com
      ``` no meio.
    */
    const jaVemCercado = textoLongo.includes("```");
    const novo =
      !jaVemCercado && pareceCodigo(textoLongo)
        ? cercarCodigo(textoLongo)
        : textoLongo.trim();

    virarArquivo([value.trim(), novo].filter(Boolean).join("\n\n"));
    limparCaixa();
    setTextoLongo(null);
  };

  return (
    <div data-gc="conversa.composer.div" {...flx("caixaDeEscrever", "caixa-de-escrever @container bg-composer px-2 pb-3 @sm:px-3")}>
      <ModalIlustrado data-gc="conversa.composer.modal-ilustrado"
        aberto={Boolean(textoLongo)}
        onFechar={() => setTextoLongo(null)}
        arte={<ArteDeTextoLongo data-gc="conversa.composer.arte-de-texto-longo" />}
        titulo={t("conversa.caixa.longaTitulo")}
        descricao={t("conversa.caixa.longaDescricao", { limite: LIMITS.messageLength })}
      >
        <Button data-gc="conversa.composer.button.mandar-como-arquivo" onClick={mandarComoArquivo}>
          <Paperclip data-gc="conversa.composer.paperclip" size={16} /> {t("conversa.caixa.enviarComoArquivo")}
        </Button>

        <Button data-gc="conversa.composer.button" variant="ghost" onClick={() => setTextoLongo(null)}>
          {t("comum.cancelar")}
        </Button>
      </ModalIlustrado>

      <ModalIlustrado data-gc="conversa.composer.modal-ilustrado.esquecer-grande-demais"
        aberto={Boolean(anexos.grandeDemais)}
        onFechar={anexos.esquecerGrandeDemais}
        arte={<ArteDeArquivoGrande data-gc="conversa.composer.arte-de-arquivo-grande" />}
        titulo={t("conversa.caixa.arquivoGrandeTitulo")}
        descricao={t("conversa.caixa.arquivoGrandeDescricao", {
          arquivo: anexos.grandeDemais ?? "",
          limite: Math.round(LIMITS.attachmentBytes / (1024 * 1024)),
        })}
      >
        <Button data-gc="conversa.composer.button.esquecer-grande-demais" onClick={anexos.esquecerGrandeDemais}>{t("comum.fechar")}</Button>
      </ModalIlustrado>
      {faltam > 0 && (
        <Tooltip data-gc="conversa.composer.tooltip" label={t("conversa.caixa.modoLentoDica", { segundos: modoLento })}>
          <p data-gc="conversa.composer.p" className="mb-1 flex items-center justify-end gap-1 text-right text-xs font-medium text-danger">
            {t("conversa.caixa.modoLento", {
              tempo: `${String(Math.floor(faltam / 60)).padStart(2, "0")}:${String(faltam % 60).padStart(2, "0")}`,
            })}
            <Timer data-gc="conversa.composer.timer" size={13} />
          </p>
        </Tooltip>
      )}

      <div data-gc="conversa.composer.div--2"
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
        {...flxAttr("campoDeEscrever")}
        className={cn(
          "rounded bg-campo transition",
          arrastando && "ring-2 ring-brand ring-offset-2 ring-offset-surface-2",
        )}
      >
        {resposta && (
          <div data-gc="conversa.composer.div--3" className="flex items-center gap-2 rounded-t bg-surface-3 px-2.5 py-1.5 text-sm">
            <span data-gc="conversa.composer.span" className="min-w-0 flex-1 truncate text-ink-muted">
              {t("conversa.caixa.respondendoPara")}{" "}
              <span data-gc="conversa.composer.span--2" className="font-semibold text-ink">{resposta.autor}</span>
            </span>

            <button data-gc="conversa.composer.button.alternar-mencao"
              type="button"
              onClick={alternarMencao}
              title={t(
                mencionarAoResponder
                  ? "conversa.caixa.vaiNotificar"
                  : "conversa.caixa.naoVaiNotificar",
              )}
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-xs font-bold uppercase transition",
                mencionarAoResponder
                  ? "text-brand hover:bg-surface-4"
                  : "text-ink-faint hover:bg-surface-4 hover:text-ink-muted",
              )}
            >
              @ {t(mencionarAoResponder ? "conversa.caixa.ligado" : "conversa.caixa.desligado")}
            </button>

            <button data-gc="conversa.composer.button.cancelar-resposta"
              type="button"
              onClick={cancelarResposta}
              aria-label={t("conversa.caixa.pararDeResponder")}
              className="shrink-0 rounded-full p-0.5 text-ink-faint transition hover:bg-surface-4 hover:text-ink"
            >
              <X data-gc="conversa.composer.x" size={14} />
            </button>
          </div>
        )}

        <AttachmentTray data-gc="conversa.composer.attachment-tray.remove"
          items={anexos.items}
          onRemove={anexos.remove}
          onPatch={anexos.patchAttachment}
        />

        <div data-gc="conversa.composer.div--4" className="relative flex items-end gap-1 px-1.5 @sm:gap-1.5 @sm:px-2">
          <MencaoSugestoes data-gc="conversa.composer.mencao-sugestoes.inserir-mencao"
            itens={sugestoes}
            indice={escolhido}
            onEscolher={inserirMencao}
            onPassarMouse={setEscolhido}
          />

          <ComandoSugestoes data-gc="conversa.composer.comando-sugestoes.escolher-comando"
            itens={comandos}
            indice={escolhido}
            onEscolher={escolherComando}
            onPassarMouse={setEscolhido}
          />

          {!comandos.length && !sugestoes.length && invocacao && (
            <DicaDoComando data-gc="conversa.composer.dica-do-comando"
              comando={invocacao.comando}
              preenchidas={invocacao.opcoes}
              faltando={invocacao.faltando}
            />
          )}

          <DropdownMenu data-gc="conversa.composer.dropdown-menu">
            <DropdownMenuTrigger data-gc="conversa.composer.dropdown-menu-trigger" asChild disabled={!podeEscrever}>
              <button data-gc="conversa.composer.button--2"
                aria-label={t("conversa.caixa.mais")}
                className="py-3 text-ink-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Plus data-gc="conversa.composer.plus" size={22} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent data-gc="conversa.composer.dropdown-menu-content" align="start" side="top" className="w-56">
              <DropdownMenuItem data-gc="conversa.composer.dropdown-menu-item" disabled={!podeAnexar} onSelect={() => inputArquivo.current?.click()}>
                {t("conversa.caixa.enviarArquivo")} <FileUp data-gc="conversa.composer.file-up" size={16} />
              </DropdownMenuItem>
              <DropdownMenuItem data-gc="conversa.composer.dropdown-menu-item--2"
                disabled={!podeAnexar || !value.trim()}
                onSelect={() => {
                  const texto = value;
                  limparCaixa();
                  virarArquivo(texto);
                }}
              >
                {t("conversa.caixa.textoComoArquivo")} <Paperclip data-gc="conversa.composer.paperclip--2" size={16} />
              </DropdownMenuItem>

              <DropdownMenuItem data-gc="conversa.composer.dropdown-menu-item--3" onSelect={() => setCriandoEnquete(true)}>
                {t("conversa.caixa.criarEnquete")} <BarChart3 data-gc="conversa.composer.bar-chart3" size={16} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input data-gc="conversa.composer.input"
            ref={inputArquivo}
            type="file"
            multiple
            onChange={(e) => {
              void anexos.add([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
            className="hidden"
          />

          <div data-gc="conversa.composer.div--5" className="relative min-w-0 flex-1">
          <EspelhoDoCompositor data-gc="conversa.composer.espelho-do-compositor"
            ref={espelho}
            texto={value}
            fontFamily={familiaDaFonte(fonte) ?? undefined}
            className="py-3"
          />

          <textarea data-gc="conversa.composer.textarea.colar"
            ref={textarea}
            value={value}
            rows={1}
            maxLength={LIMITS.messageLength}
            disabled={!podeEscrever}
            placeholder={
              !podeEscrever
                ? t("conversa.caixa.semPermissao")
                : arrastando
                  ? t("conversa.caixa.solteParaAnexar")
                  : channelName
                    ? t("conversa.caixa.escrever", { canal: channelName })
                    : t("conversa.caixa.escreverSemCanal")
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
            onScroll={(e) => {
              if (espelho.current) espelho.current.scrollTop = e.currentTarget.scrollTop;
            }}
            style={{ fontFamily: familiaDaFonte(fonte) ?? undefined }}
            className="relative block max-h-[50vh] w-full resize-none bg-transparent py-3 text-transparent caret-ink outline-none selection:bg-brand/40 placeholder:truncate placeholder:text-ink-faint disabled:cursor-not-allowed"
          />
          </div>

          <div data-gc="conversa.composer.div--6" className="mb-1.5 flex shrink-0 items-center gap-0.5">
            <span data-gc="conversa.composer.span--3" className="hidden @sm:flex">
            <SeletorDeFonte data-gc="conversa.composer.seletor-de-fonte"
              fonte={fonte}
              disabled={!podeEscrever}
              onEscolher={(nova) => {
                setFonte(nova);
                guardarFonte(nova);
                setTimeout(() => textarea.current?.focus(), 0);
              }}
            />
            </span>

            <Popover data-gc="conversa.composer.popover"
              open={seletor !== null}
              onOpenChange={(aberto) => setSeletor(aberto ? (seletor ?? "emoji") : null)}
            >
              <PopoverTrigger data-gc="conversa.composer.popover-trigger" asChild>
                <span data-gc="conversa.composer.span--4" className="flex items-center gap-0.5">
                  <AcoesDaCaixa data-gc="conversa.composer.acoes-da-caixa"
                    podeAnexar={podeAnexar}
                    aberto={seletor}
                    onAbrir={(aba) => setSeletor(seletor === aba ? null : aba)}
                    onAnexar={() => inputArquivo.current?.click()}
                  />
                </span>
              </PopoverTrigger>

              <PopoverContent data-gc="conversa.composer.popover-content" side="top" align="end" className="w-auto border-0 bg-transparent p-0">
                {seletor && (
                  <ExpressionPicker data-gc="conversa.composer.expression-picker.enviar-figurinha"
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
              <Tooltip data-gc="conversa.composer.tooltip--2"
                label={t(
                  anexos.subindo ? "conversa.caixa.aguardandoEnvio" : "conversa.caixa.enviar",
                )}
              >
                <button data-gc="conversa.composer.button.submit"
                  onClick={submit}
                  disabled={!podeEnviar}
                  aria-label={t("conversa.caixa.enviar")}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition hover:bg-hover hover:text-brand disabled:opacity-30"
                >
                  <Send data-gc="conversa.composer.send" size={20} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <CreatePollModal data-gc="conversa.composer.create-poll-modal"
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

