import React, { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Copy,
  Download,
  ExternalLink,
  Link2,
  Maximize,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Tooltip } from "~/components/ui/tooltip";
import { baixarImagem, copiarImagem } from "~/lib/imagem";
import { copiarTexto } from "~/lib/copiar";
import { useLightbox } from "~/stores/lightbox";
import { cn } from "~/lib/utils";

const PASSOS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

function tamanhoLegivel(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/*
  A imagem em tela cheia, com a barra de baixo.

  O zoom anda por passos, e não por multiplicação livre: com passos a pessoa
  volta ao 100% sem caçar, e dois cliques em lados opostos sempre desfazem um
  ao outro. Girar é só transformação — o arquivo nunca muda.
*/
export const VisualizadorDeImagem: React.FC = () => {
  const { t } = useTranslation();
  const url = useLightbox((s) => s.url);
  const alt = useLightbox((s) => s.alt);
  const info = useLightbox((s) => s.info);
  const fechar = useLightbox((s) => s.fechar);

  const [passo, setPasso] = useState(3);
  const [giro, setGiro] = useState(0);
  const [medida, setMedida] = useState<{ largura: number; altura: number } | null>(null);
  const imagem = useRef<HTMLImageElement>(null);

  /// Cada imagem começa do zero: o zoom da anterior não é da próxima.
  useEffect(() => {
    setPasso(3);
    setGiro(0);
    setMedida(null);
  }, [url]);

  useEffect(() => {
    if (!url) return;

    const noTeclado = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") setPasso((p) => Math.min(PASSOS.length - 1, p + 1));
      if (e.key === "-") setPasso((p) => Math.max(0, p - 1));
      if (e.key === "0") setPasso(3);
    };

    window.addEventListener("keydown", noTeclado);
    return () => window.removeEventListener("keydown", noTeclado);
  }, [url]);

  if (!url) return null;

  const zoom = PASSOS[passo]!;
  const nome = info.nome || alt || "imagem";
  const tamanho = tamanhoLegivel(info.tamanho);

  const acoes = [
    { chave: "fechar", rotulo: t("comum.fechar"), icone: X, fazer: fechar },
    {
      chave: "abrir",
      rotulo: t("conversa.imagem.abrirLinkDaImagem"),
      icone: ExternalLink,
      fazer: () => window.open(url, "_blank", "noopener,noreferrer"),
    },
    {
      chave: "link",
      rotulo: t("conversa.imagem.copiarLinkDaImagem"),
      icone: Link2,
      fazer: () => void copiarTexto(url).then(() => toast.success(t("conversa.imagem.linkCopiado"))),
    },
    {
      chave: "copiar",
      rotulo: t("conversa.imagem.copiarImagem"),
      icone: Copy,
      fazer: () =>
        void copiarImagem(url).then((deu) =>
          deu ? toast.success(t("conversa.imagem.imagemCopiada")) : toast.error(t("conversa.imagem.naoDeuParaCopiar")),
        ),
    },
    { chave: "baixar", rotulo: t("conversa.imagem.baixarImagem"), icone: Download, fazer: () => void baixarImagem(url, nome) },
    { chave: "esquerda", rotulo: t("conversa.imagem.girarEsquerda"), icone: RotateCcw, fazer: () => setGiro((g) => g - 90) },
    { chave: "direita", rotulo: t("conversa.imagem.girarDireita"), icone: RotateCw, fazer: () => setGiro((g) => g + 90) },
    { chave: "ajustar", rotulo: t("conversa.imagem.ajustar"), icone: Maximize, fazer: () => { setPasso(3); setGiro(0); } },
    { chave: "mais", rotulo: t("conversa.imagem.ampliar"), icone: ZoomIn, fazer: () => setPasso((p) => Math.min(PASSOS.length - 1, p + 1)) },
    { chave: "menos", rotulo: t("conversa.imagem.reduzir"), icone: ZoomOut, fazer: () => setPasso((p) => Math.max(0, p - 1)) },
  ];

  return (
    <DialogPrimitive.Root data-gc="visualizador-de-imagem.dialog-primitiveroot" open onOpenChange={(aberto) => !aberto && fechar()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay data-gc="visualizador-de-imagem.dialog-primitiveoverlay" className="fixed inset-0 z-50 bg-veu" />

        <DialogPrimitive.Content data-gc="visualizador-de-imagem.dialog-primitivecontent"
          aria-describedby={undefined}
          className="regiao-sem-arrasto fixed inset-0 z-50 flex flex-col outline-none"
        >
          <DialogPrimitive.Title data-gc="visualizador-de-imagem.dialog-primitivetitle" className="sr-only">{nome}</DialogPrimitive.Title>

          <div data-gc="visualizador-de-imagem.div"
            className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6"
            onClick={(e) => e.target === e.currentTarget && fechar()}
          >
            <img data-gc="visualizador-de-imagem.img"
              ref={imagem}
              src={url}
              alt={alt}
              onLoad={(e) =>
                setMedida({ largura: e.currentTarget.naturalWidth, altura: e.currentTarget.naturalHeight })
              }
              className={cn(
                "rounded object-contain shadow-2xl transition-transform duration-150",
                zoom <= 1 && "max-h-[calc(100vh-8rem)] max-w-full",
              )}
              style={{ transform: `rotate(${giro}deg) scale(${zoom})` }}
            />
          </div>

          {/*
            A barra fica embaixo, longe da imagem: no topo ela cobriria
            justamente o canto que a pessoa costuma querer ver.
          */}
          <div data-gc="visualizador-de-imagem.div--2" className="flex shrink-0 items-center gap-1 border-t border-line bg-surface-1 px-3 py-2">
            {acoes.map((acao) => (
              <Tooltip data-gc="visualizador-de-imagem.tooltip" key={acao.chave} label={acao.rotulo} side="top">
                <button data-gc="visualizador-de-imagem.button.fazer"
                  type="button"
                  aria-label={acao.rotulo}
                  onClick={acao.fazer}
                  className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition hover:bg-surface-3 hover:text-ink"
                >
                  <acao.icone data-gc="visualizador-de-imagem.acaoicone" size={17} />
                </button>
              </Tooltip>
            ))}

            <p data-gc="visualizador-de-imagem.p" className="ml-auto flex min-w-0 items-center gap-3 pl-3 text-xs text-ink-faint">
              <span data-gc="visualizador-de-imagem.span" className="max-w-64 truncate text-ink-muted">{nome}</span>
              {medida && <span data-gc="visualizador-de-imagem.span--2">{medida.largura}×{medida.altura}</span>}
              {tamanho && <span data-gc="visualizador-de-imagem.span--3">{tamanho}</span>}
              <span data-gc="visualizador-de-imagem.span--4" className="tabular-nums">{Math.round(zoom * 100)}%</span>
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
