import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "~/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    {/*
      Véu de 35% com desfoque leve, e não um preto de 60%.

      O preto pesado apagava o app inteiro atrás do diálogo; o desfoque tira a
      leitura sem tirar o lugar — você continua vendo de onde veio. Os 3px são
      NOSSOS: a referência usa 8px (`blur(.5rem)`), que aqui embaçava demais e
      transformava o fundo numa mancha. O bastante pra desfocar, pouco o
      bastante pra ainda se reconhecer o que está atrás.
    */}
    <DialogPrimitive.Overlay className="regiao-sem-arrasto fixed inset-0 z-50 bg-black/35 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      className={cn(
        /*
          A superfície do diálogo é `surface-1`, não `surface-3`.

          Na referência o corpo do modal é `--background-secondary` (#1A181E),
          o MESMO token do trilho e das barras laterais — e o nosso
          `--color-surface-1` já é exatamente essa cor. Estava em `surface-3`,
          claro demais, e o efeito colateral aparecia nos botões: um botão
          `surface` (que é `surface-3`) ficava da cor do fundo e sumia.

          Borda de 1px e as três sombras também são de lá: uma linha de contato
          rente, uma sombra curta e uma longa. Só `shadow-2xl` deixava a caixa
          boiando sem recorte contra um fundo escuro.
        */
        /*
          Centralizado por `inset-0 m-auto`, e NÃO por `translate` — junto com
          o `regiao-sem-arrasto`, é o que faz o diálogo obedecer ao clique.

          O `-webkit-app-region` do Electron IGNORA transformações: a região de
          "não arrastar" é recortada pela caixa de LAYOUT do elemento. Com
          `left-1/2 top-1/2 -translate-1/2`, o layout põe a caixa começando no
          centro da janela e o `translate` só desloca a PINTURA — o recorte
          ficava meia caixa fora de lugar, e a parte de cima do diálogo continuava
          sendo barra de título para o sistema. Sintoma: duplo clique no
          cabeçalho maximizava a janela e o "X" não respondia.

          `inset-0 m-auto` centraliza pelo próprio layout, então a caixa está
          onde parece estar.

          E o `regiao-sem-arrasto` continua necessário: o diálogo mora num
          portal e passa por cima do cabeçalho do servidor (que com faixa chega
          a 30vh), do cabeçalho da conversa e da barra de título.
        */
        "regiao-sem-arrasto fixed inset-0 z-50 m-auto h-fit max-h-[92vh] w-full max-w-md outline-none",
        "rounded-xl border border-line bg-surface-1",
        /*
          Sombra rasa. A da referência (0.25 e 0.2 de preto, espalhando 1.5rem
          e 3rem) pesava demais sobre o nosso fundo, que já é quase preto: a
          caixa ganhava um halo escuro em volta em vez de descolar do fundo.
          Metade da opacidade e metade do alcance chegam no mesmo lugar.
        */
        "shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_0.25rem_0.75rem_-0.25rem_rgba(0,0,0,0.14),0_0.75rem_2rem_-0.75rem_rgba(0,0,0,0.12)]",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        aria-label="Fechar"
        className="absolute right-5 top-4 text-ink-faint transition hover:text-ink"
      >
        <X size={20} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const DialogHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("border-b border-line px-5 py-4", className)} {...props} />
);

export const DialogTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />
);

export const DialogDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description className={cn("mt-1 text-sm text-ink-muted", className)} {...props} />
);

export const DialogBody = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("p-5", className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex justify-end gap-2 px-5 pb-5", className)} {...props} />
);
