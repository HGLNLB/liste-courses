"use client";

import type { ComponentProps } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CategoryCard } from "./CategoryCard";

type SortableCategoryCardProps = ComponentProps<typeof CategoryCard>;

export function SortableCategoryCard(props: SortableCategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.category.id,
    disabled: props.editMode !== "categories",
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "z-20 opacity-90" : ""} ${
        props.editMode === "categories" ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      {...(props.editMode === "categories" ? { ...attributes, ...listeners } : {})}
    >
      <CategoryCard {...props} />
    </div>
  );
}
