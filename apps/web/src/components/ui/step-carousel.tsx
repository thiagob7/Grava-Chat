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
  step: string;
  steps: readonly string[];
  panels: Record<string, React.ReactNode>;
  className?: string;
}

const swipe: Variants = {
  entering: (direction: number) => ({ opacity: 0, x: direction > 0 ? 24 : direction < 0 ? -24 : 0 }),
  center: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 520, damping: 42, mass: 0.7 },
  },
  leaving: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -24 : direction < 0 ? 24 : 0,
    transition: { duration: 0.1, ease: "easeIn" },
  }),
};

const heightOf: Transition = { type: "spring", stiffness: 460, damping: 40, mass: 0.7 };
const instant: Transition = { duration: 0 };

const withoutMotion: Variants = {
  entering: { opacity: 0, x: 0 },
  center: { opacity: 1, x: 0 },
  leaving: { opacity: 0, x: 0 },
};

export const StepCarousel: React.FC<Props> = ({ step, steps, panels, className }) => {
  const [previous, setPrevious] = React.useState(step);
  const [direction, setDirection] = React.useState(0);
  const [height, setHeight] = React.useState<number>();
  const inAnimation = useReducedMotion();

  if (previous !== step) {
    setDirection(steps.indexOf(step) > steps.indexOf(previous) ? 1 : -1);
    setPrevious(step);
  }

  const measure = React.useCallback((no: HTMLDivElement | null) => {
    if (!no) return;

    const read = () => setHeight(no.offsetHeight);
    read();

    const observer = new ResizeObserver(read);
    observer.observe(no);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div data-gc="ui.step-carousel.motiondiv"
      animate={{ height: height }}
      transition={inAnimation ? instant : heightOf}
      className={cn("relative overflow-hidden", className)}
    >
      <AnimatePresence data-gc="ui.step-carousel.animate-presence" mode="wait" initial={false} custom={direction}>
        <motion.div data-gc="ui.step-carousel.motiondiv--2"
          key={step}
          ref={measure}
          custom={direction}
          variants={inAnimation ? withoutMotion : swipe}
          initial="entering"
          animate="center"
          exit="leaving"
          transition={inAnimation ? instant : undefined}
          className="flex flex-col"
        >
          {panels[step]}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
