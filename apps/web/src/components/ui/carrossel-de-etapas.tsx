import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "motion/react";

import { cn } from "~/lib/utils";

interface Props {
  /// qual etapa está em cena
  etapa: string;
  /// a ordem delas, que é o que decide o LADO de onde a nova entra
  etapas: readonly string[];
  /// os painéis por etapa — o carrossel desenha um de cada vez
  paineis: Record<string, React.ReactNode>;
  className?: string;
}

/*
  Os números são os do `SteppedCarousel.tsx` da referência, copiados como
  NÚMEROS e não como código: 24px de deslize, spring 520/42/0.7 na entrada,
  100ms `easeIn` na saída, spring 460/40/0.7 na altura da caixa.

  `direcao` é +1 avançando, -1 voltando. Vai como número porque é assim que
  entra na conta do lado: quem entra vem do lado oposto ao que o outro foi.
*/
const deslize: Variants = {
  entra: (direcao: number) => ({ opacity: 0, x: direcao > 0 ? 24 : direcao < 0 ? -24 : 0 }),
  centro: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 520, damping: 42, mass: 0.7 },
  },
  sai: (direcao: number) => ({
    opacity: 0,
    x: direcao > 0 ? -24 : direcao < 0 ? 24 : 0,
    transition: { duration: 0.1, ease: "easeIn" },
  }),
};

const daAltura: Transition = { type: "spring", stiffness: 460, damping: 40, mass: 0.7 };
const instantaneo: Transition = { duration: 0 };

/// Sem movimento: só a opacidade. É o `reducedMotionVariants` da referência.
const semMovimento: Variants = {
  entra: { opacity: 0, x: 0 },
  centro: { opacity: 1, x: 0 },
  sai: { opacity: 0, x: 0 },
};

/**
 * Troca de etapas dentro de uma mesma caixa — o `SteppedCarousel` da
 * referência.
 *
 * O movimento é SEQUENCIAL, e é isso que o faz ser lido: o painel que sai
 * desliza pro lado e some; só então o que entra chega, deslizando do lado
 * oposto. Quem garante a ordem é o `mode="wait"` do `AnimatePresence`.
 *
 * Cheguei a usar `mode="popLayout"`, que deixa os dois em cena ao mesmo tempo.
 * Não é diferença de gosto: com os dois se movendo juntos, um por cima do
 * outro, não se enxerga nem a saída nem a chegada — vira um borrão de 200ms.
 * Foi por isso que a troca pareceu "não pegar" por várias tentativas seguidas.
 *
 * A altura da caixa acompanha a do painel em cena, com um segundo spring. Ela é
 * MEDIDA, e não `height: auto`: com `auto`, o `motion` não tem número de
 * chegada para interpolar e a caixa salta em vez de acompanhar.
 */
export const CarrosselDeEtapas: React.FC<Props> = ({ etapa, etapas, paineis, className }) => {
  const [anterior, setAnterior] = React.useState(etapa);
  const [direcao, setDirecao] = React.useState(0);
  const [altura, setAltura] = React.useState<number>();
  const semAnimacao = useReducedMotion();

  /*
    A direção sai DURANTE o render, não de um efeito.

    É o padrão de "ajustar estado quando a prop muda": o React refaz o render na
    hora, antes de pintar. Num efeito, o painel que entra chegava à tela um
    quadro antes com a direção da troca anterior e trocava de lado no quadro
    seguinte — um tranco no meio da animação.
  */
  if (anterior !== etapa) {
    setDirecao(etapas.indexOf(etapa) > etapas.indexOf(anterior) ? 1 : -1);
    setAnterior(etapa);
  }

  /*
    Mede o painel em cena e continua medindo enquanto ele estiver lá.

    Uma medida só na montagem não serve: o conteúdo cresce depois — a lista de
    amigos chega da rede, o aviso quebra em duas linhas. O `ResizeObserver`
    acompanha, e a limpeza devolvida pelo `ref` (React 19) o desliga quando o
    painel sai de cena.
  */
  const medir = React.useCallback((no: HTMLDivElement | null) => {
    if (!no) return;

    const ler = () => setAltura(no.offsetHeight);
    ler();

    const observador = new ResizeObserver(ler);
    observador.observe(no);
    return () => observador.disconnect();
  }, []);

  return (
    <motion.div
      animate={{ height: altura }}
      transition={semAnimacao ? instantaneo : daAltura}
      className={cn("relative overflow-hidden", className)}
    >
      {/*
        `custom` precisa chegar também no `AnimatePresence`: é dele que a
        variante de SAÍDA tira a direção. Só no `motion.div` de dentro, o painel
        que sai iria para o mesmo lado de onde o outro veio.
      */}
      <AnimatePresence mode="wait" initial={false} custom={direcao}>
        <motion.div
          key={etapa}
          ref={medir}
          custom={direcao}
          variants={semAnimacao ? semMovimento : deslize}
          initial="entra"
          animate="centro"
          exit="sai"
          transition={semAnimacao ? instantaneo : undefined}
          className="flex flex-col"
        >
          {paineis[etapa]}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
