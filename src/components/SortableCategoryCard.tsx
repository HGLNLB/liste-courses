"use client";

import type { ComponentProps } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CategoryCard } from "./CategoryCard";

type SortableCategoryCardProps = ComponentProps<typeof CategoryCard>;

export function SortableCategoryCard(props: SortableCategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div style={style}>
      <CategoryCard
        {...props}
        isCategoryDragging={isDragging}
        categorySortableRef={setNodeRef}
        categoryHeaderAttributes={attributes}
        categoryHeaderListeners={listeners}
      />
    </div>
  );
}
