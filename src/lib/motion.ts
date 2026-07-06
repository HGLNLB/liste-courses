export const fastEase = [0.4, 0, 0.2, 1] as const;

export const collapseTransition = {
  height: { duration: 0.22, ease: fastEase },
  opacity: { duration: 0.16, ease: "easeOut" as const },
};

export const listItemTransition = {
  duration: 0.2,
  ease: fastEase,
};

export const categoryTransition = {
  duration: 0.22,
  ease: fastEase,
};

export const categoryEnter = {
  opacity: 0,
  y: -10,
  scale: 0.98,
};

export const categoryVisible = {
  opacity: 1,
  y: 0,
  scale: 1,
};

export const categoryExit = {
  opacity: 0,
  y: -6,
  scale: 0.98,
  transition: { duration: 0.18, ease: fastEase },
};
