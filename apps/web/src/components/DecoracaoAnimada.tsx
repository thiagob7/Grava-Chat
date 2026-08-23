import React, { useEffect, useRef } from "react";
import type { Decoracao } from "@gravae/shared";

import { carregarDecoracao, folgaDaDecoracao } from "~/lib/cosmeticos/animadas";

interface DecoracaoAnimadaProps {
  decoracao: Decoracao;
  /**
   * Parada em lista, andando no cartão — a mesma regra do resto do catálogo.
   * Cem avatares tocando animação ao mesmo tempo engasgam a rolagem, e quem
   * paga é quem só queria ler quem está online.
   */
  animar: boolean;
}

/**
 * Uma decoração de avatar que é arquivo Lottie, e não CSS.
 *
 * Usa o `lottie-web` na build LEVE — JavaScript puro, sem WASM.
 *
 * "Leve" tira o suporte a expressões do After Effects, que nenhuma decoração
 * usa: o arquivo cai pela metade e, de brinde, some o `eval` que a build cheia
 * carrega — que seria um problema no dia que este app ganhar uma CSP séria.
 *
 * A alternativa moderna (`@lottiefiles/dotlottie-web`) busca o `.wasm` num CDN
 * por padrão, e isso é exatamente a armadilha que a Inter já nos custou: falha
 * calada no aplicativo de desktop sem internet alcançável. Aqui não há nada a
 * buscar em tempo de execução.
 */
export const DecoracaoAnimada: React.FC<DecoracaoAnimadaProps> = ({
  decoracao,
  animar,
}) => {
  const caixa = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let vivo = true;
    let player: {
      destroy: () => void;
      goToAndStop: (v: number, f?: boolean) => void;
      totalFrames: number;
    } | null = null;

    void (async () => {
      // os dois `import()` são dinâmicos: nem o player nem o desenho entram no
      // carregamento inicial
      const [lottie, dados] = await Promise.all([
        import("lottie-web/build/player/lottie_light"),
        carregarDecoracao(decoracao),
      ]);

      if (!vivo || !caixa.current || !dados) return;

      /**
       * O `animationData` vai CLONADO.
       *
       * O lottie-web muta o objeto que recebe — ele guarda estado do player
       * dentro do próprio desenho. Como o `import()` devolve sempre a mesma
       * instância do JSON, o segundo player a usar o mesmo arquivo recebia um
       * objeto já mastigado e não desenhava nada: a decoração aparecia num
       * avatar e sumia no outro, sem erro nenhum no console.
       */
      player = lottie.default.loadAnimation({
        container: caixa.current,
        renderer: "svg",
        loop: true,
        autoplay: animar,
        animationData: structuredClone(dados),
      });

      /**
       * Parado, congela no ÚLTIMO quadro — não no primeiro.
       *
       * Essas artes CRESCEM na entrada: no quadro 0 as asas e a estrela estão
       * com escala zero, e só o aro existe. Congelando no início, a decoração
       * aparecia pela metade na lista de membros e inteira só no cartão — a
       * mesma pessoa com duas caras, sem erro nenhum no console.
       */
      if (!animar) player?.goToAndStop(Math.max(0, player.totalFrames - 1), true);
    })();

    return () => {
      vivo = false;
      player?.destroy();
    };
  }, [decoracao, animar]);

  /*
    A folga vem do catálogo, e não do CSS: cada arte tem o buraco num tamanho
    diferente, e é ele que precisa casar com a foto.
  */
  return (
    <span
      ref={caixa}
      aria-hidden
      className="gc-camada"
      style={{ inset: folgaDaDecoracao(decoracao) }}
    />
  );
};
