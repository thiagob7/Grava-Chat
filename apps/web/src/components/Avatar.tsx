import React, { useEffect, useState } from "react";
import type { PerfilPublico, PresenceStatus } from "@gravae/shared";

import { DecoracaoAnimada } from "~/components/DecoracaoAnimada";
import { ehAnimada } from "~/lib/cosmeticos/animadas";
import { classeDoEnfeite, variaveisDoEnfeite } from "~/lib/cosmeticos/estilos";
import { avatarColor, initials } from "~/lib/format";
import { cn } from "~/lib/utils";

const STATUS_COLOR: Record<PresenceStatus, string> = {
  ONLINE: "bg-online",
  IDLE: "bg-idle",
  DND: "bg-dnd",
  OFFLINE: "bg-ink-faint",
};

interface AvatarProps {
  id: string;
  name: string;
  url?: string | null;
  size?: number;
  status?: PresenceStatus;
  /** anel verde de "está falando", em volta da foto */
  speaking?: boolean;
  /**
   * Decoração e moldura de quem é dono da foto.
   *
   * O componente foi ESTENDIDO em vez de embrulhado num `<AvatarEnfeitado>`
   * justamente por causa dos 27 lugares que já o chamam: props opcionais
   * deixam todos eles compilando sem uma edição, e a Fase 1 acrescenta o
   * enfeite só onde ele deve aparecer.
   */
  enfeites?: Pick<PerfilPublico, "decoracao" | "moldura"> | null;
  /** enfeite animado. Fora do cartão de perfil e do editor, sempre parado. */
  animar?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  id,
  name,
  url,
  size = 40,
  status,
  speaking,
  enfeites,
  animar = false,
  className,
}) => {
  const [falhou, setFalhou] = useState(false);

  // troca de usuário reaproveita o componente: sem isso, um erro anterior
  // esconderia a foto do próximo
  useEffect(() => setFalhou(false), [url]);

  const mostrarImagem = Boolean(url) && !falhou;

  /**
   * Decoração pode ser CSS ou ARQUIVO.
   *
   * As de CSS são uma camada com classe; as animadas são um Lottie tocado por
   * um player. Quem decide é o catálogo, não este componente — acrescentar uma
   * animada nova não passa por aqui.
   */
  const animada = ehAnimada(enfeites?.decoracao);
  const decoracao = animada
    ? null
    : classeDoEnfeite("decoracao", enfeites?.decoracao);
  /**
   * "Está falando" ganha da moldura, sempre.
   *
   * O anel verde e a moldura somados viram um aro gordo que não é nem um nem
   * outro — e o que a pessoa precisa saber naquele instante é quem está
   * falando, não que o colega escolheu uma moldura dourada. Sinal em tempo real
   * ganha de enfeite.
   */
  const moldura = speaking
    ? null
    : classeDoEnfeite("moldura", enfeites?.moldura);
  const ritmo = variaveisDoEnfeite({ animar, velocidade: "8s" });

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full transition-shadow duration-100",
        /**
         * Anel por box-shadow, não por borda: borda muda o tamanho da caixa e
         * faria a lista inteira tremer a cada palavra. A sombra fica por fora
         * sem ocupar espaço no layout.
         */
        speaking && "shadow-[0_0_0_3px_var(--color-online)]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {mostrarImagem ? (
        <img
          src={url!}
          alt=""
          width={size}
          height={size}
          onError={() => setFalhou(true)}
          /**
           * Sem isto o Google devolve 403 para a foto de perfil: o
           * lh3.googleusercontent.com recusa requisições que mandam Referer de
           * outra origem, e o navegador cai no texto alternativo — foi o "Thi"
           * aparecendo por baixo da imagem.
           */
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="size-full rounded-full bg-surface-3 object-cover"
        />
      ) : (
        // Fallback é a inicial, nunca o alt do <img>: alt vaza como texto solto
        // e estoura o layout do círculo.
        <div
          className="flex size-full select-none items-center justify-center rounded-full font-semibold text-white"
          style={{ backgroundColor: avatarColor(id), fontSize: size * 0.38 }}
          aria-label={name}
        >
          {initials(name)}
        </div>
      )}

      {moldura && (
        <span
          aria-hidden
          className={cn("gc-camada gc-camada--moldura", moldura)}
          style={ritmo}
        />
      )}
      {decoracao && (
        <span
          aria-hidden
          className={cn("gc-camada", decoracao)}
          style={ritmo}
        />
      )}
      {animada && enfeites?.decoracao && (
        <DecoracaoAnimada decoracao={enfeites.decoracao} animar={animar} />
      )}

      {status && (
        // A borda na cor do fundo cria o "recorte" do indicador, igual ao Discord.
        <span
          className={cn("absolute rounded-full border-[3px]", STATUS_COLOR[status])}
          /**
           * O recorte era `border-surface-1` fixo, e isso já é um bug hoje: o
           * `UserPanel` e o cartão de perfil vivem em `surface-0`, então a
           * bolinha aparece com um aro do tom errado em volta. Quem sabe qual é
           * o fundo é quem chama — daí a variável, com o tom antigo de padrão.
           */
          style={{ ...cantoDoStatus(size), borderColor: "var(--gc-recorte, var(--color-surface-1))" }}
        />
      )}
    </div>
  );
};

/**
 * Tamanho e lugar da bolinha de status.
 *
 * Ela era posicionada pelo CANTO da caixa (`-bottom-0.5 -right-0.5`), e canto
 * de caixa não é borda de círculo: fica a raio×√2 do centro, ou seja FORA da
 * foto. Somado a 35% de diâmetro, metade da bolinha ficava pendurada pra fora —
 * e no cartão de perfil, onde o avatar tem um anel de 6px do MESMO tom da borda
 * dela, as duas se fundiam num borrão escuro pendurado no canto.
 *
 * Agora ela anda pela DIAGONAL de verdade, a uma distância que deixa só um fio
 * pra fora do círculo, e é um terço menor.
 */
function cantoDoStatus(size: number) {
  // `box-sizing: border-box` no app inteiro: este tamanho JÁ inclui os 3px de
  // borda de cada lado. Somá-los de novo enfia a bolinha 3px pra dentro.
  const lado = Math.round(size * 0.28);
  // um fio pra fora da foto — o bastante pra a bolinha morder a borda em vez de
  // boiar em cima do rosto
  const distancia = (size / 2) * 1.04 - lado / 2;
  const canto = size / 2 + distancia / Math.SQRT2 - lado / 2;

  return { width: lado, height: lado, left: canto, top: canto };
}
