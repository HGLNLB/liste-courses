"use client";

import { motion, useReducedMotion } from "framer-motion";
import { collapseTransition } from "@/lib/motion";

type AnimatedCollapseProps = {
  open: boolean;
  children: React.ReactNode;
};

export function AnimatedCollapse({ open, children }: AnimatedCollapseProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={false}
      animate={{
        height: open ? "auto" : 0,
        opacity: open ? 1 : 0,
      }}
      transition={reduceMotion ? { duration: 0 } : collapseTransition}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
