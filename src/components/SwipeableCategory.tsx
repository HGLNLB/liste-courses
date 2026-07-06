"use client";

import { SwipeableDelete } from "./SwipeableDelete";

type SwipeableCategoryProps = {
  enabled: boolean;
  onDelete: () => void;
  children: React.ReactNode;
};

export function SwipeableCategory({ enabled, onDelete, children }: SwipeableCategoryProps) {
  return (
    <SwipeableDelete enabled={enabled} onDelete={onDelete} rounded>
      {children}
    </SwipeableDelete>
  );
}
