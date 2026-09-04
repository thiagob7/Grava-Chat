import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  /*
    Raio de 0.5rem e peso 600 vêm do `.button` da referência — o nosso era
    `rounded` (4px) com `font-medium`, e num diálogo de canto `rounded-xl` o
    botão de canto quase reto destoava de tudo em volta.
  */
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand text-ink hover:bg-brand-hover",
        success: "bg-online text-white hover:brightness-110",
        danger: "bg-danger text-white hover:brightness-110",
        surface: "bg-surface-3 text-ink-muted hover:bg-surface-4 hover:text-ink",
        /*
          Botão para quando o FUNDO já é `surface-3`.

          Dentro de um diálogo — que é `surface-3` — o `surface` some: o botão
          fica exatamente da cor do que está atrás e vira texto solto. Foi o que
          aconteceu com os "Convidar" do modal de convite. Aqui a borda faz o
          contorno e o `surface-4` levanta o preenchimento um degrau, que é como
          a referência desenha o botão secundário.
        */
        outline:
          "border border-line bg-surface-4 text-ink hover:bg-[color-mix(in_srgb,var(--color-surface-4)_94%,var(--color-ink)_6%)]",
        ghost: "text-ink-muted hover:bg-surface-3 hover:text-ink",
        link: "text-brand hover:underline",
      },
      size: {
        /*
          O `small` da referência, medida por medida: 34px de altura, 56px de
          largura mínima, 6px/10px de folga e o corpo de 13px que o `--text-13`
          já traz com a entrelinha certa.

          A largura mínima é o que impede um "Ok" de virar um quadradinho ao
          lado de um "Convidar" — numa lista, botões de larguras diferentes na
          mesma coluna é o que mais denuncia falta de acabamento.
        */
        sm: "min-h-[2.125rem] min-w-14 px-2.5 py-1.5 text-13",
        md: "px-4 py-2.5 text-sm",
        lg: "px-5 py-3 text-sm",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
};

export { buttonVariants };
