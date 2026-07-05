"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { Checkbox } from "./Checkbox";
import { ItemRow } from "./ItemRow";
import { ItemEditor } from "./ItemEditor";
import { useLongPress } from "@/hooks/useLongPress";
import { vibrate } from "@/lib/utils";
import type { CategoryWithItems, EditMode } from "@/lib/types";

type CategoryCardProps = {
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

export function CategoryCard({
  category,
  editMode,
  wiggleCategories,
  wiggleItems,
  highlightedItemId,
  onToggleOpen,
  onEditCategory,
  onDeleteCategory,
  onLongPressCategory,
  onToggleCategoryChecked,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleItemChecked,
  onLongPressItem,
  onReorderItems,
}: CategoryCardProps) {
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const itemSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = category.items.map((item) => item.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const next = [...ids];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    onReorderItems(next);
  };

  const categoryEditActive = editMode === "categories";
  const itemEditActive = editMode === "items";

  const categoryLongPress = useLongPress({
    onLongPress: () => {
      vibrate();
      onLongPressCategory();
    },
    onClick: onEditCategory,
    disabled: categoryEditActive,
  });

  return (
    <section
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#E5E5EA]/80 ${
        wiggleCategories && categoryEditActive ? "animate-wiggle" : ""
      }`}
      style={{ borderLeft: `4px solid ${category.color}` }}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        {categoryEditActive && (
          <button
            type="button"
            aria-label="Supprimer la catégorie"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteCategory();
            }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF3B30] text-sm font-bold text-white"
          >
            −
          </button>
        )}

        <button
          type="button"
          onClick={onToggleOpen}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8E8E93]"
          aria-label={category.is_open ? "Replier" : "Déplier"}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className={`transition-transform ${category.is_open ? "rotate-90" : ""}`}
            aria-hidden="true"
          >
            <path d="M4 2L9 6L4 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>

        <div
          className="min-w-0 flex-1 text-left"
          {...(!categoryEditActive ? categoryLongPress : {})}
        >
          <h2 className="truncate text-lg font-semibold text-[#1C1C1E]">{category.name}</h2>
        </div>

        {editMode === "none" && (
          <Checkbox
            checked={category.is_checked}
            onChange={onToggleCategoryChecked}
            ariaLabel={`Cocher la catégorie ${category.name}`}
          />
        )}
      </div>

      {category.is_open && (
        <div className="border-t border-[#F2F2F7]">
          <DndContext
            sensors={itemSensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleItemDragEnd}
          >
            <SortableContext
              items={category.items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {category.items.map((item) =>
                editingItemId === item.id ? (
                  <div key={item.id} className="px-3 py-2">
                    <ItemEditor
                      initial={item}
                      onCancel={() => setEditingItemId(null)}
                      onSave={(payload) => {
                        onUpdateItem(item.id, payload);
                        setEditingItemId(null);
                      }}
                    />
                  </div>
                ) : (
                  <ItemRow
                    key={item.id}
                    item={item}
                    editMode={itemEditActive}
                    wiggle={wiggleItems && itemEditActive}
                    highlighted={highlightedItemId === item.id}
                    showCheckbox={editMode === "none"}
                    onToggleChecked={(checked) => onToggleItemChecked(item.id, checked)}
                    onLongPress={onLongPressItem}
                    onEdit={() => setEditingItemId(item.id)}
                    onDelete={() => onDeleteItem(item.id)}
                  />
                ),
              )}
            </SortableContext>
          </DndContext>

          {!itemEditActive && !categoryEditActive && (
            <div className="px-3 py-2">
              {addingItem ? (
                <ItemEditor
                  onCancel={() => setAddingItem(false)}
                  onSave={(payload) => {
                    onAddItem(payload);
                    setAddingItem(false);
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingItem(true)}
                  className="w-full rounded-xl py-2 text-left text-sm text-[#007AFF]"
                >
                  + Ajouter un élément
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
