"use client";

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, Reorder, motion } from "framer-motion";
import { Checkbox } from "./Checkbox";
import { ItemRow } from "./ItemRow";
import { ItemEditor } from "./ItemEditor";
import { AnimatedCollapse } from "./AnimatedCollapse";
import { SwipeableDelete } from "./SwipeableDelete";
import { useLongPress } from "@/hooks/useLongPress";
import { vibrate } from "@/lib/utils";
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
  const [activeSwipeItemId, setActiveSwipeItemId] = useState<string | null>(null);
  const [categorySwipeOpen, setCategorySwipeOpen] = useState(false);
  const [itemSwipeOpenId, setItemSwipeOpenId] = useState<string | null>(null);
  const categorySwipeBlockedRef = useRef(false);

  const categoryEditActive = editMode === "categories";
  const itemsInteractive = editMode === "none" && !categoryEditActive;
  const categorySwipeEnabled = editMode === "none" && !categoryEditActive;

  const handleCategorySwipeOpenChange = useCallback((open: boolean) => {
    categorySwipeBlockedRef.current = open;
    setCategorySwipeOpen(open);
  }, []);

  const handleItemSwipeOpenChange = useCallback((itemId: string, open: boolean) => {
    setItemSwipeOpenId((current) => {
      if (open) return itemId;
      return current === itemId ? null : current;
    });
  }, []);

  const visibleItems = category.items.filter((item) => {
    if (itemFilter === "unchecked") return !item.is_checked;
    if (itemFilter === "checked") return item.is_checked;
    return true;
  });

  const reorderableItems = visibleItems.filter((item) => item.id !== editingItemId);

  const handleItemReorder = useCallback(
    (reordered: typeof visibleItems) => {
      const visibleSet = new Set(reordered.map((item) => item.id));
      const hiddenItems = category.items.filter((item) => !visibleSet.has(item.id));
      const merged = [...reordered, ...hiddenItems];
      onReorderItems(merged.map((item) => item.id));
    },
    [category.items, onReorderItems],
  );

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
    blockedRef: categorySwipeBlockedRef,
    moveTolerance: 10,
    onLongPress: () => {
      vibrate();
      onLongPressCategory();
    },
    onClick: onEditCategory,
    disabled: categoryEditActive || categorySwipeOpen,
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
        onSwipeOpenChange={handleCategorySwipeOpenChange}
      >
        <div className="flex items-center gap-2 bg-white px-3 py-3 select-none" data-category-header>
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
              className={`min-w-0 flex-1 text-left ${categorySwipeOpen ? "pointer-events-none" : ""}`}
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
              ) : null,
            )}
          </AnimatePresence>

          <Reorder.Group
            axis="y"
            values={reorderableItems}
            onReorder={handleItemReorder}
            className="bg-white"
          >
            {reorderableItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                dragEnabled={itemsInteractive}
                swipeEnabled={itemsInteractive}
                swipeActive={activeSwipeItemId === item.id}
                swipeBlocked={itemSwipeOpenId === item.id}
                highlighted={highlightedItemId === item.id}
                showCheckbox={editMode === "none"}
                onSwipeActivate={() => setActiveSwipeItemId(item.id)}
                onSwipeRelease={() => {
                  setActiveSwipeItemId((current) => (current === item.id ? null : current));
                }}
                onSwipeOpenChange={(open) => handleItemSwipeOpenChange(item.id, open)}
                onDragStart={() => setActiveSwipeItemId(null)}
                onToggleChecked={(checked) => onToggleItemChecked(item.id, checked)}
                onEdit={() => {
                  if (itemSwipeOpenId === item.id) return;
                  setEditingItemId(item.id);
                }}
                onDelete={() => {
                  setActiveSwipeItemId(null);
                  setItemSwipeOpenId(null);
                  onDeleteItem(item.id);
                }}
              />
            ))}
          </Reorder.Group>

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
