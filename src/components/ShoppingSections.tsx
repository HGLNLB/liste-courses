"use client";

import { AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableCategoryCard } from "./SortableCategoryCard";
import { CategoryCard } from "./CategoryCard";
import { CategoryEditor } from "./CategoryEditor";
import { AnimatedCategoryWrapper } from "./AnimatedCategoryWrapper";
import { getNotNeededCategories, getToBuyCategories } from "@/lib/utils";
import type { CategoryWithItems, EditMode } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";

type ShoppingSectionsProps = {
  categories: CategoryWithItems[];
  editMode: EditMode;
  wiggleCategories: boolean;
  highlightedItemId: string | null;
  creatingCategory: boolean;
  editingCategoryId: string | null;
  onCreateCategory: () => void;
  onCancelCreateCategory: () => void;
  onSaveCategory: (name: string, color: string) => void;
  onCancelEditCategory: () => void;
  onSaveEditCategory: (name: string, color: string) => void;
  onCategoryDragEnd: (event: DragEndEvent) => void;
  onToggleOpen: (id: string) => void;
  onEditCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onLongPressCategory: () => void;
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
  creatingCategory,
  editingCategoryId,
  onCreateCategory,
  onCancelCreateCategory,
  onSaveCategory,
  onCancelEditCategory,
  onSaveEditCategory,
  onCategoryDragEnd,
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
}: ShoppingSectionsProps) {
  const toBuyCategories = getToBuyCategories(categories);
  const notNeededCategories = getNotNeededCategories(categories);

  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

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
      itemFilter: options.itemFilter,
      sectionType: options.sectionType,
      showAddItem: options.showAddItem,
      dimmed: options.dimmed,
      onToggleOpen: () => onToggleOpen(category.id),
      onEditCategory: () => onEditCategory(category.id),
      onDeleteCategory: () => onDeleteCategory(category.id),
      onLongPressCategory,
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

      {editingCategoryId && (
        <CategoryEditor
          initialName={categories.find((c) => c.id === editingCategoryId)?.name}
          initialColor={
            categories.find((c) => c.id === editingCategoryId)?.color ?? CATEGORY_COLORS[0].value
          }
          onCancel={onCancelEditCategory}
          onSave={onSaveEditCategory}
        />
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
            sensors={categorySensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onCategoryDragEnd}
          >
            <SortableContext
              items={toBuyCategories.map((category) => category.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {toBuyCategories.map((category) => (
                    <AnimatedCategoryWrapper key={category.id}>
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
