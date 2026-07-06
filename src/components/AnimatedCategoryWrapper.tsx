"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  categoryEnter,
  categoryExit,
  categoryTransition,
  categoryVisible,
} from "@/lib/motion";

type AnimatedCategoryWrapperProps = {
  children: React.ReactNode;
  layout?: boolean;
};

export function AnimatedCategoryWrapper({
  children,
  layout = true,
}: AnimatedCategoryWrapperProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layout={layout && !reduceMotion}
      initial={reduceMotion ? false : categoryEnter}
      animate={categoryVisible}
      exit={reduceMotion ? { opacity: 0 } : categoryExit}
      transition={reduceMotion ? { duration: 0 } : categoryTransition}
    >
      {children}
    </motion.div>
  );
}
