"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableCategoryCard } from "./SortableCategoryCard";
import { CategoryCard } from "./CategoryCard";
import { CategoryEditor } from "./CategoryEditor";
import { AnimatedCategoryWrapper } from "./AnimatedCategoryWrapper";
import { GESTURE } from "@/lib/gestures";
import { sortableDropAnimation } from "@/lib/dnd";
import { useDragSensors } from "@/hooks/useDragSensors";
import { getNotNeededCategories, getToBuyCategories, vibrate } from "@/lib/utils";
import type { CategoryWithItems, EditMode, ItemSortMode } from "@/lib/types";

type ShoppingSectionsProps = {
  categories: CategoryWithItems[];
  editMode: EditMode;
  wiggleCategories: boolean;
  highlightedItemId: string | null;
  itemSortMode: ItemSortMode;
  creatingCategory: boolean;
  onCreateCategory: () => void;
  onCancelCreateCategory: () => void;
  onSaveCategory: (name: string, color: string) => void;
  onCategoryDragEnd: (event: DragEndEvent) => void;
  onToggleOpen: (id: string) => void;
  onUpdateCategory: (id: string, name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
  onLongPressCategory: () => void;
  onDismissEditMode: () => void;
  onToggleCategoryChecked: (id: string, checked: boolean) => void;
  onAddItem: (
    categoryId: string,
    payload: { name: string; quantity?: string; unit?: string; notes?: string },
  ) => void;
  onUpdateItem: (
    id: string,
    payload: { name: string; quantity?: string; unit?: string; notes?: string },
  ) => void;
  onDeleteItem: (id: string) => void;
  onToggleItemChecked: (id: string, checked: boolean) => void;
  onReorderItems: (categoryId: string, orderedIds: string[]) => void;
};

export function ShoppingSections({
  categories,
  editMode,
  wiggleCategories,
  highlightedItemId,
  itemSortMode,
  creatingCategory,
  onCreateCategory,
  onCancelCreateCategory,
  onSaveCategory,
  onCategoryDragEnd,
  onToggleOpen,
  onUpdateCategory,
  onDeleteCategory,
  onLongPressCategory,
  onDismissEditMode,
  onToggleCategoryChecked,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleItemChecked,
  onReorderItems,
}: ShoppingSectionsProps) {
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [categoryDndKey, setCategoryDndKey] = useState(0);

  const toBuyCategories = getToBuyCategories(categories);
  const notNeededCategories = getNotNeededCategories(categories);

  const categoryDragDelay =
    editMode === "categories"
      ? GESTURE.CATEGORY_DRAG_DELAY_EDIT_MS
      : GESTURE.CATEGORY_DRAG_DELAY_MS;

  const categorySensors = useDragSensors(categoryDragDelay);

  const draggingCategory = useMemo(
    () => categories.find((category) => category.id === draggingCategoryId) ?? null,
    [categories, draggingCategoryId],
  );

  const handleCategoryDragStart = (event: DragStartEvent) => {
    vibrate([30, 20, 30]);
    setDraggingCategoryId(String(event.active.id));
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    onCategoryDragEnd(event);
    setDraggingCategoryId(null);
  };

  const handleLongPressCategory = () => {
    setDraggingCategoryId(null);
    setCategoryDndKey((key) => key + 1);
    onLongPressCategory();
  };

  const renderCategoryCard = (
    category: CategoryWithItems,
    options: {
      itemFilter: "unchecked" | "checked";
      sectionType: "toBuy" | "notNeeded";
      showAddItem: boolean;
      dimmed: boolean;
      sortable: boolean;
    },
  ) => {
    const props = {
      category,
      editMode,
      wiggleCategories,
      highlightedItemId,
      itemSortMode,
      itemFilter: options.itemFilter,
      sectionType: options.sectionType,
      showAddItem: options.showAddItem,
      dimmed: options.dimmed,
      onToggleOpen: () => onToggleOpen(category.id),
      onUpdateCategory: (name: string, color: string) => onUpdateCategory(category.id, name, color),
      onDeleteCategory: () => onDeleteCategory(category.id),
      onLongPressCategory: handleLongPressCategory,
      onDismissEditMode,
      onToggleCategoryChecked: (checked: boolean) => onToggleCategoryChecked(category.id, checked),
      onAddItem: (payload: { name: string; quantity?: string; unit?: string; notes?: string }) =>
        onAddItem(category.id, payload),
      onUpdateItem,
      onDeleteItem,
      onToggleItemChecked,
      onReorderItems: (orderedIds: string[]) => onReorderItems(category.id, orderedIds),
    };

    if (options.sortable) {
      return <SortableCategoryCard {...props} />;
    }

    return <CategoryCard {...props} />;
  };

  return (
    <div className="space-y-6 px-4 pb-8">
      {creatingCategory && (
        <CategoryEditor onCancel={onCancelCreateCategory} onSave={onSaveCategory} />
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#FF9500]">
            À acheter
          </h2>
          {editMode === "none" && (
            <button
              type="button"
              onClick={onCreateCategory}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007AFF] text-xl font-light text-white shadow-sm"
              aria-label="Ajouter une catégorie"
            >
              +
            </button>
          )}
        </div>

        {toBuyCategories.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#8E8E93] shadow-sm ring-1 ring-[#E5E5EA]/80">
            Tout est coché — rien à acheter.
          </p>
        ) : (
          <DndContext
            key={categoryDndKey}
            sensors={categorySensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={handleCategoryDragStart}
            onDragEnd={handleCategoryDragEnd}
            onDragCancel={() => setDraggingCategoryId(null)}
          >
            <SortableContext
              items={toBuyCategories.map((category) => category.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {toBuyCategories.map((category) => (
                    <AnimatedCategoryWrapper key={category.id} layout={false}>
                      {renderCategoryCard(category, {
                        itemFilter: "unchecked",
                        sectionType: "toBuy",
                        showAddItem: true,
                        dimmed: false,
                        sortable: true,
                      })}
                    </AnimatedCategoryWrapper>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={sortableDropAnimation}>
              {draggingCategory ? (
                <div
                  className="overflow-hidden rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-[#E5E5EA]/80"
                  style={{ borderLeft: `4px solid ${draggingCategory.color}` }}
                >
                  <p className="truncate text-lg font-semibold text-[#1C1C1E]">
                    {draggingCategory.name}
                  </p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#8E8E93]">
          Pas besoin
        </h2>

        {notNeededCategories.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#8E8E93] shadow-sm ring-1 ring-[#E5E5EA]/80">
            Aucun élément coché pour l&apos;instant.
          </p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false} mode="popLayout">
              {notNeededCategories.map((category) => (
                <AnimatedCategoryWrapper key={`${category.id}-notNeeded`}>
                  {renderCategoryCard(category, {
                    itemFilter: "checked",
                    sectionType: "notNeeded",
                    showAddItem: false,
                    dimmed: true,
                    sortable: false,
                  })}
                </AnimatedCategoryWrapper>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
