"use client";

import type { ComponentProps } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItemRow } from "./ItemRow";

type SortableItemRowProps = ComponentProps<typeof ItemRow> & {
  id: string;
  sortableDisabled?: boolean;
};

export function SortableItemRow({ id, sortableDisabled = false, ...props }: SortableItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: sortableDisabled || !props.dragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "touch-none" : undefined}
    >
      <ItemRow {...props} isDragging={isDragging} />
    </div>
  );
}
