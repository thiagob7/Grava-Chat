import React, { useEffect, useState } from "react";
import type { PerfilPublico, PresenceStatus } from "@gravae/shared";

import { DecoracaoDeArquivo } from "~/components/DecoracaoDeArquivo";
import { IconeDeStatus } from "~/components/IconeDeStatus";
import { ehDeArquivo } from "~/lib/cosmeticos/decoracoes";
import { classeDoEnfeite, variaveisDoEnfeite } from "~/lib/cosmeticos/estilos";
import { avatarColor, initials } from "~/lib/format";
import { cn } from "~/lib/utils";

interface AvatarProps {
  id: string;
  name: string;
  url?: string | null;
  size?: number;
  status?: PresenceStatus;
  /// numa chamada agora: troca a bolinha de presença pelo alto-falante
  emVoz?: boolean;
  speaking?: boolean;
  enfeites?: Pick<PerfilPublico, "decoracao" | "moldura"> | null;
  animar?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  id,
  name,
  url,
  size = 40,
  status,
  emVoz,
  speaking,
  enfeites,
  animar = false,
  className,
}) => {
  const [falhou, setFalhou] = useState(false);

  useEffect(() => setFalhou(false), [url]);

  const mostrarImagem = Boolean(url) && !falhou;

  /// Sem status e sem voz não há selo — e sem selo não há buraco a abrir.
  const selo = status || emVoz ? cantoDoStatus(size) : null;

  /*
    O furo é aberto na CAIXA INTEIRA, e não só na foto.

    Cortando só a imagem, a moldura e o enfeite continuavam passando por cima da
    bolinha — que foi exatamente o que sobrou depois do primeiro conserto: um
    buraco no rosto com a asa dourada atravessando ele. As decorações são
    camadas irmãs, e cada uma tem folga própria (-16%, -22%, -24%), então
    mascarar uma por uma seria repetir a conta em três lugares e errar no
    quarto.

    A máscara vive no container e é maior que ele (`FOLGA_DA_MASCARA` de cada
    lado), porque as decorações transbordam: uma máscara do tamanho da caixa
    esconderia justamente as asas que passam para fora. Sem `no-repeat` o
    degradê se repetiria e abriria buracos em todo lado.
  */
  const mascara: React.CSSProperties | undefined = !selo
    ? undefined
    : (() => {
      const folga = size * FOLGA_DA_MASCARA;
      const lado = size + folga * 2;
      const buraco = `radial-gradient(circle ${selo.raio}px at ${selo.centro.x + folga}px ${selo.centro.y + folga}px, transparent ${selo.raio}px, #000 ${selo.raio + 0.5}px)`;

      return {
        WebkitMaskImage: buraco,
        maskImage: buraco,
        WebkitMaskSize: `${lado}px ${lado}px`,
        maskSize: `${lado}px ${lado}px`,
        WebkitMaskPosition: `-${folga}px -${folga}px`,
        maskPosition: `-${folga}px -${folga}px`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      } as React.CSSProperties;
    })();

  const deArquivo = ehDeArquivo(enfeites?.decoracao);
  const decoracao = deArquivo
    ? null
    : classeDoEnfeite("decoracao", enfeites?.decoracao);
  const ritmo = variaveisDoEnfeite({ animar, velocidade: "8s" });

  return (
    /*
      Duas caixas: a de dentro leva a máscara, a de fora leva a bolinha.

      Com a bolinha dentro da caixa mascarada, o furo comeria justamente ela —
      o buraco não distingue quem é filho de quem, só recorta o que estiver
      naquela área.
    */
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={cn(
          "relative size-full rounded-full transition-shadow duration-100",
          speaking && "shadow-[0_0_0_3px_var(--color-online)]",
          className,
        )}
        style={mascara}
      >
      {mostrarImagem ? (
        <img
          src={url!}
          alt=""
          width={size}
          height={size}
          onError={() => setFalhou(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="size-full rounded-full bg-surface-3 object-cover"
        />
      ) : (
        <div
          className="flex size-full select-none items-center justify-center rounded-full font-semibold text-white"
          style={{ backgroundColor: avatarColor(id), fontSize: size * 0.38 }}
          aria-label={name}
        >
          {initials(name)}
        </div>
      )}

      {decoracao && (
        <span
          aria-hidden
          className={cn("gc-camada", decoracao)}
          style={ritmo}
        />
      )}
      {deArquivo && enfeites?.decoracao && (
        <DecoracaoDeArquivo decoracao={enfeites.decoracao} animar={animar} />
      )}

      </div>

      {selo && (
        <span className="absolute" style={{ left: selo.left, top: selo.top }}>
          <IconeDeStatus tipo={emVoz ? "VOZ" : status!} tamanho={selo.lado} />
        </span>
      )}
    </div>
  );
};

/// Quanto a máscara passa de cada lado do avatar. A decoração mais generosa
/// hoje transborda 24%; 35% deixa folga pra próxima sem esconder asa nenhuma.
const FOLGA_DA_MASCARA = 0.35;

/*
  Onde a bolinha pousa, e o buraco que ela abre.

  O anel em volta dela era pintado com a cor do fundo (`--gc-recorte`) — o que
  obriga quem coloca um avatar em qualquer lugar novo a lembrar de declarar
  essa cor, e falha sem remédio sobre foto, vídeo ou degradê, onde não existe
  UMA cor de fundo. Agora o avatar é recortado de verdade: um furo na máscara,
  que deixa passar o que estiver atrás, seja lá o que for.
*/
/*
  Onde a bolinha pousa, e o buraco que ela abre.

  O anel em volta dela era pintado com a cor do fundo (`--gc-recorte`) — o que
  obriga quem coloca um avatar em qualquer lugar novo a lembrar de declarar
  essa cor, e falha sem remédio sobre foto, vídeo ou degradê, onde não existe
  UMA cor de fundo. Agora o avatar é recortado de verdade: um furo na máscara,
  que deixa passar o que estiver atrás, seja lá o que for.

  O centro fica a 78% do lado, e não sobre a circunferência (85,4%, que é onde
  a diagonal de 45° cruza a borda). Ali, metade da bolinha ficava pendurada
  fora do avatar — e quem usa moldura via a bolinha invadindo a asa do enfeite
  em vez de encostar no rosto. Mais pra dentro, ela morde o próprio avatar, que
  é o desenho que se reconhece de qualquer app.
*/
function cantoDoStatus(size: number) {
  const lado = Math.max(8, Math.round(size * 0.28));
  const centro = size * 0.78;
  /// folga entre a bolinha e a borda do recorte; acompanha o tamanho pra não
  /// sumir no avatar pequeno nem virar um rombo no grande
  const folga = Math.max(1.25, size * 0.045);

  return {
    lado,
    left: centro - lado / 2,
    top: centro - lado / 2,
    centro: { x: centro, y: centro },
    raio: lado / 2 + folga,
  };
}
