"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { AnimatePresence, motion } from "framer-motion";
import { Checkbox } from "./Checkbox";
import { ItemRow } from "./ItemRow";
import { ItemEditor } from "./ItemEditor";
import { AnimatedCollapse } from "./AnimatedCollapse";
import { SwipeableDelete } from "./SwipeableDelete";
import { useLongPress } from "@/hooks/useLongPress";
import { formatItemLabel, vibrate } from "@/lib/utils";
import { listItemTransition } from "@/lib/motion";
import type { CategoryWithItems, EditMode } from "@/lib/types";

type CategoryCardProps = {
  category: CategoryWithItems;
  editMode: EditMode;
  wiggleCategories: boolean;
  highlightedItemId: string | null;
  itemFilter?: "all" | "unchecked" | "checked";
  sectionType?: "toBuy" | "notNeeded";
  showAddItem?: boolean;
  dimmed?: boolean;
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
  onReorderItems: (orderedIds: string[]) => void;
};

export function CategoryCard({
  category,
  editMode,
  wiggleCategories,
  highlightedItemId,
  itemFilter = "all",
  sectionType,
  showAddItem = true,
  dimmed = false,
  onToggleOpen,
  onEditCategory,
  onDeleteCategory,
  onLongPressCategory,
  onToggleCategoryChecked,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleItemChecked,
  onReorderItems,
}: CategoryCardProps) {
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const categoryEditActive = editMode === "categories";
  const itemsInteractive = editMode === "none" && !categoryEditActive;
  const categorySwipeEnabled = editMode === "none" && !categoryEditActive;

  const itemSensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const visibleItems = category.items.filter((item) => {
    if (itemFilter === "unchecked") return !item.is_checked;
    if (itemFilter === "checked") return item.is_checked;
    return true;
  });

  const handleItemDragStart = (event: DragStartEvent) => {
    vibrate(20);
    setDraggingItemId(String(event.active.id));
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    setDraggingItemId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const visibleIds = visibleItems.map((item) => item.id);
    const oldIndex = visibleIds.indexOf(String(active.id));
    const newIndex = visibleIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const nextVisible = [...visibleIds];
    const [moved] = nextVisible.splice(oldIndex, 1);
    nextVisible.splice(newIndex, 0, moved);

    const visibleSet = new Set(nextVisible);
    const hiddenItems = category.items.filter((item) => !visibleSet.has(item.id));
    const reorderedVisible = nextVisible
      .map((id) => category.items.find((item) => item.id === id))
      .filter(Boolean) as typeof category.items;
    const merged = [...reorderedVisible, ...hiddenItems];
    onReorderItems(merged.map((item) => item.id));
  };

  const draggingItem = visibleItems.find((entry) => entry.id === draggingItemId);

  const categoryChecked =
    sectionType === "toBuy" ? false : sectionType === "notNeeded" ? true : category.is_checked;

  const handleCategoryChecked = (checked: boolean) => {
    if (sectionType === "toBuy") {
      onToggleCategoryChecked(true);
      return;
    }
    if (sectionType === "notNeeded") {
      onToggleCategoryChecked(false);
      return;
    }
    onToggleCategoryChecked(checked);
  };

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
      } ${dimmed ? "opacity-70" : ""}`}
      style={{ borderLeft: `4px solid ${category.color}` }}
    >
      <SwipeableDelete
        enabled={categorySwipeEnabled}
        onDelete={onDeleteCategory}
      >
        <div className="flex items-center gap-2 bg-white px-3 py-3">
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
              className={`transition-transform duration-200 ease-out ${category.is_open ? "rotate-90" : ""}`}
              aria-hidden="true"
            >
              <path d="M4 2L9 6L4 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>

          {categoryEditActive ? (
            <h2 className="min-w-0 flex-1 truncate text-left text-lg font-semibold text-[#1C1C1E]">
              {category.name}
            </h2>
          ) : (
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              {...categoryLongPress}
            >
              <h2 className="truncate text-lg font-semibold text-[#1C1C1E]">{category.name}</h2>
            </button>
          )}

          {editMode === "none" && (
            <Checkbox
              checked={categoryChecked}
              onChange={handleCategoryChecked}
              ariaLabel={`Cocher la catégorie ${category.name}`}
            />
          )}
        </div>
      </SwipeableDelete>

      <AnimatedCollapse open={category.is_open}>
        <div className="border-t border-[#F2F2F7]">
          <DndContext
            sensors={itemSensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={handleItemDragStart}
            onDragEnd={handleItemDragEnd}
          >
            <SortableContext
              items={visibleItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence initial={false}>
                {visibleItems.map((item) =>
                  editingItemId === item.id ? (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={listItemTransition}
                      className="overflow-hidden"
                    >
                      <div className="px-3 py-2">
                        <ItemEditor
                          initial={item}
                          onCancel={() => setEditingItemId(null)}
                          onSave={(payload) => {
                            onUpdateItem(item.id, payload);
                            setEditingItemId(null);
                          }}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <ItemRow
                      key={item.id}
                      item={item}
                      dragEnabled={itemsInteractive}
                      swipeEnabled={itemsInteractive}
                      highlighted={highlightedItemId === item.id}
                      showCheckbox={editMode === "none"}
                      onToggleChecked={(checked) => onToggleItemChecked(item.id, checked)}
                      onEdit={() => setEditingItemId(item.id)}
                      onDelete={() => onDeleteItem(item.id)}
                    />
                  ),
                )}
              </AnimatePresence>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {draggingItem ? (
                <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-[#E5E5EA]">
                  <p className="text-base text-[#1C1C1E]">{formatItemLabel(draggingItem)}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {itemsInteractive && showAddItem && (
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
      </AnimatedCollapse>
    </section>
  );
}
