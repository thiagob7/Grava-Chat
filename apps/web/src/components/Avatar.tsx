import React, { useEffect, useState } from "react";
import type { PerfilPublico, PresenceStatus } from "@gravae/shared";

import { DecoracaoDeArquivo } from "~/components/DecoracaoDeArquivo";
import { IconeDeStatus } from "~/components/IconeDeStatus";
import { ehDeArquivo, folgaDaDecoracao } from "~/lib/cosmeticos/decoracoes";
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
    O furo é aberto em CADA CAMADA, na caixa dela.

    A tentativa anterior mascarava o container inteiro de uma vez — mais curta
    de escrever, e errada: máscara em CSS não pinta fora do próprio quadro, e
    as decorações transbordam de propósito (a alada vai 24% pra fora de cada
    lado). O resultado foi um avatar com o furo certinho e as asas sumidas.

    Aqui cada camada recebe o mesmo buraco, deslocado pela folga dela: a foto
    não tem folga, a decoração de classe tem 16%, e a de arquivo tem a sua
    própria. Como o degradê preenche exatamente a caixa de quem o recebe, não
    há tamanho nem posição a acertar — e nada é cortado por engano.
  */
  const furo = (folga: number) => {
    if (!selo) return undefined;

    const buraco = `radial-gradient(circle ${selo.raio}px at ${selo.centro.x + folga}px ${selo.centro.y + folga}px, transparent ${selo.raio}px, #000 ${selo.raio + 0.5}px)`;
    return { WebkitMaskImage: buraco, maskImage: buraco } as React.CSSProperties;
  };

  /// `-16%` é a folga do `.gc-camada`, fixada no CSS dos cosméticos.
  const recorteDaCamada = furo(size * 0.16);
  const recorteDeArquivo = enfeites?.decoracao
    ? furo(-(parseFloat(folgaDaDecoracao(enfeites.decoracao)) / 100) * size)
    : undefined;

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
    <div
      className={cn(
        "relative shrink-0 rounded-full transition-shadow duration-100",
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
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          style={furo(0)}
          className="size-full rounded-full bg-surface-3 object-cover"
        />
      ) : (
        <div
          className="flex size-full select-none items-center justify-center rounded-full font-semibold text-white"
          style={{ ...furo(0), backgroundColor: avatarColor(id), fontSize: size * 0.38 }}
          aria-label={name}
        >
          {initials(name)}
        </div>
      )}

      {decoracao && (
        <span
          aria-hidden
          className={cn("gc-camada", decoracao)}
          style={{ ...ritmo, ...recorteDaCamada }}
        />
      )}
      {deArquivo && enfeites?.decoracao && (
        <DecoracaoDeArquivo
          decoracao={enfeites.decoracao}
          animar={animar}
          recorte={recorteDeArquivo}
        />
      )}


      {selo && (
        <span className="absolute" style={{ left: selo.left, top: selo.top }}>
          <IconeDeStatus tipo={emVoz ? "VOZ" : status!} tamanho={selo.lado} />
        </span>
      )}
    </div>
  );
};

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

  O centro fica a 76% do lado, e não sobre a circunferência (85,4%, que é onde
  a diagonal de 45° cruza a borda). Ali, metade da bolinha ficava pendurada
  fora do avatar — e quem usa moldura via a bolinha invadindo a asa do enfeite
  em vez de encostar no rosto. Mais pra dentro, ela morde o próprio avatar, que
  é o desenho que se reconhece de qualquer app.
*/
function cantoDoStatus(size: number) {
  const lado = Math.max(8, Math.round(size * 0.22));
  const centro = size * 0.76;
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
