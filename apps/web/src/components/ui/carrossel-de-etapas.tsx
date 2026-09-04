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
  etapa: string;
  etapas: readonly string[];
  paineis: Record<string, React.ReactNode>;
  className?: string;
}

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

const semMovimento: Variants = {
  entra: { opacity: 0, x: 0 },
  centro: { opacity: 1, x: 0 },
  sai: { opacity: 0, x: 0 },
};

export const CarrosselDeEtapas: React.FC<Props> = ({ etapa, etapas, paineis, className }) => {
  const [anterior, setAnterior] = React.useState(etapa);
  const [direcao, setDirecao] = React.useState(0);
  const [altura, setAltura] = React.useState<number>();
  const semAnimacao = useReducedMotion();

  if (anterior !== etapa) {
    setDirecao(etapas.indexOf(etapa) > etapas.indexOf(anterior) ? 1 : -1);
    setAnterior(etapa);
  }

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
