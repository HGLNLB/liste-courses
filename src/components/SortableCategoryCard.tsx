"use client";

import type { ComponentProps } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CategoryCard } from "./CategoryCard";

type SortableCategoryCardProps = ComponentProps<typeof CategoryCard>;

export function SortableCategoryCard(props: SortableCategoryCardProps) {
  const editActive = props.editMode === "categories";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.category.id,
    disabled: !editActive,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <CategoryCard
        {...props}
        categoryDragHandleProps={editActive ? { ...attributes, ...listeners } : undefined}
      />
    </div>
  );
}
