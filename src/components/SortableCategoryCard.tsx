"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CategoryCard } from "./CategoryCard";
import type { CategoryWithItems, EditMode } from "@/lib/types";

type SortableCategoryCardProps = {
  category: CategoryWithItems;
  editMode: EditMode;
  wiggleCategories: boolean;
  wiggleItems: boolean;
  highlightedItemId: string | null;
  onToggleOpen: () => void;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
  onLongPressCategory: () => void;
  onToggleCategoryChecked: (checked: boolean) => void;
  onAddItem: (payload: { name: string; quantity?: string; unit?: string; notes?: string }) => void;
  onUpdateItem: (
    id: string,
    payload: { name: string; quantity?: string; unit?: string; notes?: string },
  ) => void;
  onDeleteItem: (id: string) => void;
  onToggleItemChecked: (id: string, checked: boolean) => void;
  onLongPressItem: () => void;
  onReorderItems: (orderedIds: string[]) => void;
};

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
