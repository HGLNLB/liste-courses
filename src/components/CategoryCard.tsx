"use client";

import { useState, useCallback, useRef } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { AnimatePresence, motion } from "framer-motion";
import { Checkbox } from "./Checkbox";
import { ConfirmDialog } from "./ConfirmDialog";
import { CategoryEditor } from "./CategoryEditor";
import { ItemRow } from "./ItemRow";
import { ItemEditor } from "./ItemEditor";
import { AnimatedCollapse } from "./AnimatedCollapse";
import { useCategoryEditPress } from "@/hooks/useCategoryEditPress";
import { useDragSensors } from "@/hooks/useDragSensors";
import { useSwipeDelete } from "@/hooks/useSwipeDelete";
import { GESTURE } from "@/lib/gestures";
import { mergeDragListeners, sortableDropAnimation } from "@/lib/dnd";
import { vibrate, formatItemLabel } from "@/lib/utils";
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
  isCategoryDragging?: boolean;
  onToggleOpen: () => void;
  onUpdateCategory: (name: string, color: string) => void;
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
  categoryHeaderAttributes?: DraggableAttributes;
  categoryHeaderListeners?: SyntheticListenerMap;
};

function CategoryDragHandle() {
  return (
    <div
      className="pointer-events-none flex shrink-0 flex-col items-center justify-center gap-[3px] px-1 opacity-40"
      aria-hidden="true"
    >
      <span className="block h-[3px] w-[3px] rounded-full bg-[#8E8E93]" />
      <span className="block h-[3px] w-[3px] rounded-full bg-[#8E8E93]" />
      <span className="block h-[3px] w-[3px] rounded-full bg-[#8E8E93]" />
    </div>
  );
}

function stopDragPointer(event: React.PointerEvent | React.TouchEvent) {
  event.stopPropagation();
}

export function CategoryCard({
  category,
  editMode,
  wiggleCategories,
  highlightedItemId,
  itemFilter = "all",
  sectionType,
  showAddItem = true,
  dimmed = false,
  isCategoryDragging = false,
  onToggleOpen,
  onUpdateCategory,
  onDeleteCategory,
  onLongPressCategory,
  onToggleCategoryChecked,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleItemChecked,
  onReorderItems,
  categoryHeaderAttributes,
  categoryHeaderListeners,
}: CategoryCardProps) {
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingCategoryInline, setEditingCategoryInline] = useState(false);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [activeSwipeItemId, setActiveSwipeItemId] = useState<string | null>(null);
  const [categorySwipeOpen, setCategorySwipeOpen] = useState(false);
  const [itemSwipeOpenId, setItemSwipeOpenId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const categorySwipeBlockedRef = useRef(false);

  const categoryEditActive = editMode === "categories";
  const itemsInteractive = editMode === "none" && !categoryEditActive;
  const categorySwipeEnabled = editMode === "none" && !categoryEditActive;

  const itemSensors = useDragSensors(GESTURE.ITEM_DRAG_DELAY_MS);

  const categoryEditPress = useCategoryEditPress({
    enabled: editMode === "none" && !categorySwipeOpen,
    blockedRef: categorySwipeBlockedRef,
    onEditModeRequest: () => {
      vibrate();
      onLongPressCategory();
    },
  });

  const handleCategorySwipeOpenChange = useCallback(
    (open: boolean) => {
      categorySwipeBlockedRef.current = open;
      setCategorySwipeOpen(open);
      if (open) {
        categoryEditPress.cancel();
      }
    },
    [categoryEditPress],
  );

  const categorySwipe = useSwipeDelete({
    enabled: categorySwipeEnabled,
    isActive: true,
    dragHoldDelayMs: GESTURE.CATEGORY_DRAG_DELAY_MS,
    onActivate: () => {},
    onSwipeOpenChange: handleCategorySwipeOpenChange,
    onDelete: onDeleteCategory,
  });

  const handleItemSwipeOpenChange = useCallback((itemId: string, open: boolean) => {
    setItemSwipeOpenId((current) => {
      if (open) return itemId;
      return current === itemId ? null : current;
    });
  }, []);

  const mergedHeaderListeners = categoryHeaderListeners
    ? mergeDragListeners(categoryHeaderListeners, {
        onPointerDown: categoryEditPress.onPointerDown,
        onPointerMove: categoryEditPress.onPointerMove,
        onPointerUp: categoryEditPress.onPointerUp,
        onTouchStart: categoryEditPress.onTouchStart,
        onTouchMove: categoryEditPress.onTouchMove,
        onTouchEnd: categoryEditPress.onTouchEnd,
      })
    : undefined;

  const visibleItems = category.items.filter((item) => {
    if (itemFilter === "unchecked") return !item.is_checked;
    if (itemFilter === "checked") return item.is_checked;
    return true;
  });

  const reorderableItemIds = visibleItems
    .filter((item) => item.id !== editingItemId)
    .map((item) => item.id);

  const handleItemDragStart = (event: DragStartEvent) => {
    setActiveSwipeItemId(null);
    vibrate([30, 20, 30]);
    setDraggingItemId(String(event.active.id));
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    setDraggingItemId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const visibleIds = visibleItems
      .filter((item) => item.id !== editingItemId)
      .map((item) => item.id);
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

  const isEmptyCategory = category.items.length === 0;

  const categoryChecked =
    sectionType === "toBuy"
      ? isEmptyCategory
        ? category.is_checked
        : false
      : sectionType === "notNeeded"
        ? isEmptyCategory
          ? category.is_checked
          : true
        : category.is_checked;

  const handleCategoryChecked = (checked: boolean) => {
    if (sectionType === "toBuy") {
      onToggleCategoryChecked(isEmptyCategory ? checked : true);
      return;
    }
    if (sectionType === "notNeeded") {
      onToggleCategoryChecked(isEmptyCategory ? checked : false);
      return;
    }
    onToggleCategoryChecked(checked);
  };

  const headerTitle = categoryEditActive ? (
    <h2 className="min-w-0 flex-1 truncate text-left text-lg font-semibold text-[#1C1C1E]">
      {category.name}
    </h2>
  ) : (
    <button
      type="button"
      onClick={() => {
        if (categorySwipeOpen || isCategoryDragging) return;
        setEditingCategoryInline(true);
      }}
      className={`min-w-0 flex-1 text-left ${categorySwipeOpen ? "pointer-events-none" : ""}`}
    >
      <h2 className="truncate text-lg font-semibold text-[#1C1C1E]">{category.name}</h2>
    </button>
  );

  const headerInner = (
    <>
      {categoryEditActive && <CategoryDragHandle />}

      <button
        type="button"
        onClick={onToggleOpen}
        onPointerDown={stopDragPointer}
        onTouchStart={stopDragPointer}
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

      {headerTitle}
    </>
  );

  const headerRow = (
    <div
      className="relative overflow-hidden bg-white select-none"
      data-category-header
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {categorySwipeEnabled && (
        <motion.div
          className="absolute inset-0 flex items-center bg-[#FF3B30] pl-5"
          style={{ opacity: categorySwipe.deleteOpacity }}
          aria-hidden="true"
        >
          <span className="text-2xl font-bold text-white">−</span>
        </motion.div>
      )}

      <div className="relative flex items-center gap-2 px-3 py-3">
        {categoryEditActive && (
          <button
            type="button"
            aria-label="Supprimer la catégorie"
            onPointerDown={stopDragPointer}
            onTouchStart={stopDragPointer}
            onClick={(event) => {
              event.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF3B30] text-sm font-bold text-white"
          >
            −
          </button>
        )}

        {mergedHeaderListeners ? (
          <motion.div
            style={{ x: categorySwipeEnabled ? categorySwipe.x : 0 }}
            className={`flex min-w-0 flex-1 items-center gap-2 touch-manipulation ${
              isCategoryDragging || categorySwipe.isSwipeActive ? "touch-none" : ""
            } ${isCategoryDragging ? "cursor-grabbing" : "cursor-grab"}`}
            {...categoryHeaderAttributes}
            {...mergedHeaderListeners}
            {...(categorySwipeEnabled && !isCategoryDragging ? categorySwipe.captureHandlers : {})}
            aria-label="Réorganiser la catégorie"
          >
            {headerInner}
          </motion.div>
        ) : (
          <motion.div
            style={{ x: categorySwipeEnabled ? categorySwipe.x : 0 }}
            className={`flex min-w-0 flex-1 items-center gap-2 ${
              categorySwipe.isSwipeActive ? "touch-none" : ""
            }`}
            {...(categorySwipeEnabled ? categorySwipe.captureHandlers : {})}
          >
            {headerInner}
          </motion.div>
        )}

        {editMode === "none" && (
          <div onPointerDown={stopDragPointer} onTouchStart={stopDragPointer} className="shrink-0">
            <Checkbox
              checked={categoryChecked}
              onChange={handleCategoryChecked}
              ariaLabel={`Cocher la catégorie ${category.name}`}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#E5E5EA]/80 ${
        wiggleCategories && categoryEditActive ? "animate-wiggle" : ""
      } ${dimmed ? "opacity-70" : ""}`}
      style={{ borderLeft: `4px solid ${category.color}` }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {headerRow}

      {editingCategoryInline && (
        <div
          className="border-b border-[#F2F2F7] px-3 pb-3"
          onClick={(event) => event.stopPropagation()}
        >
          <CategoryEditor
            initialName={category.name}
            initialColor={category.color}
            onCancel={() => setEditingCategoryInline(false)}
            onSave={(name, color) => {
              onUpdateCategory(name, color);
              setEditingCategoryInline(false);
            }}
          />
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Supprimer la catégorie ?"
        message={`« ${category.name} » et tous ses éléments seront supprimés définitivement.`}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDeleteCategory();
        }}
      />

      <AnimatedCollapse open={category.is_open}>
        <div className="border-t border-[#F2F2F7]">
          <DndContext
            sensors={itemSensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={handleItemDragStart}
            onDragEnd={handleItemDragEnd}
            onDragCancel={() => setDraggingItemId(null)}
          >
            <SortableContext items={reorderableItemIds} strategy={verticalListSortingStrategy}>
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
                      swipeActive={activeSwipeItemId === item.id}
                      swipeBlocked={itemSwipeOpenId === item.id}
                      highlighted={highlightedItemId === item.id}
                      showCheckbox={editMode === "none"}
                      onSwipeActivate={() => setActiveSwipeItemId(item.id)}
                      onSwipeRelease={() => {
                        setActiveSwipeItemId((current) => (current === item.id ? null : current));
                      }}
                      onSwipeOpenChange={(open) => handleItemSwipeOpenChange(item.id, open)}
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
                  ),
                )}
              </AnimatePresence>
            </SortableContext>
            <DragOverlay dropAnimation={sortableDropAnimation}>
              {draggingItem ? (
                <div className="flex items-center rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-[#E5E5EA]">
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
