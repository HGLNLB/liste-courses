"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import { ColorPicker } from "./ColorPicker";
import { ConfirmDialog } from "./ConfirmDialog";
import { ItemRow } from "./ItemRow";
import { ItemEditor } from "./ItemEditor";
import { AnimatedCollapse } from "./AnimatedCollapse";
import { SwipeableDelete } from "./SwipeableDelete";
import { useCategoryEditPress } from "@/hooks/useCategoryEditPress";
import { useDragSensors } from "@/hooks/useDragSensors";
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
  categorySortableRef?: (element: HTMLElement | null) => void;
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
  categorySortableRef,
  categoryHeaderAttributes,
  categoryHeaderListeners,
}: CategoryCardProps) {
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingCategoryInline, setEditingCategoryInline] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editColor, setEditColor] = useState(category.color);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [categorySwipeOpen, setCategorySwipeOpen] = useState(false);
  const [itemSwipeOpenId, setItemSwipeOpenId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const categorySwipeBlockedRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const categoryEditActive = editMode === "categories";
  const itemsInteractive = editMode === "none" && !categoryEditActive;
  const categorySwipeEnabled = editMode === "none" && !categoryEditActive;

  const itemSensors = useDragSensors(GESTURE.ITEM_DRAG_DELAY_MS);

  useEffect(() => {
    if (!editingCategoryInline) {
      setEditName(category.name);
      setEditColor(category.color);
    }
  }, [category.name, category.color, editingCategoryInline]);

  useEffect(() => {
    if (editingCategoryInline) {
      titleInputRef.current?.focus();
    }
  }, [editingCategoryInline]);

  const categoryEditPress = useCategoryEditPress({
    enabled: editMode === "none" && !categorySwipeOpen && !editingCategoryInline,
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

  const saveCategoryInline = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    onUpdateCategory(trimmed, editColor);
    setEditingCategoryInline(false);
  };

  const cancelCategoryInline = () => {
    setEditName(category.name);
    setEditColor(category.color);
    setEditingCategoryInline(false);
  };

  const headerTitle = categoryEditActive ? (
    <h2 className="min-w-0 flex-1 truncate text-left text-lg font-semibold text-[#1C1C1E]">
      {category.name}
    </h2>
  ) : editingCategoryInline ? (
    <input
      ref={titleInputRef}
      type="text"
      value={editName}
      onChange={(event) => setEditName(event.target.value)}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") saveCategoryInline();
        if (event.key === "Escape") cancelCategoryInline();
      }}
      onClick={(event) => event.stopPropagation()}
      className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-[#1C1C1E] outline-none ring-0"
      aria-label="Nom de la catégorie"
    />
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

  const headerContent = (
    <div
      ref={categorySortableRef}
      {...categoryHeaderAttributes}
      {...mergedHeaderListeners}
      className={`flex items-center gap-2 px-3 py-3 select-none bg-white ${
        isCategoryDragging ? "touch-none cursor-grabbing shadow-md" : categoryHeaderListeners ? "cursor-grab" : ""
      }`}
      data-category-header
      onClick={(event) => event.stopPropagation()}
    >
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

      {editMode === "none" && !editingCategoryInline && (
        <div onPointerDown={stopDragPointer} onTouchStart={stopDragPointer} className="shrink-0">
          <Checkbox
            checked={categoryChecked}
            onChange={handleCategoryChecked}
            ariaLabel={`Cocher la catégorie ${category.name}`}
          />
        </div>
      )}
    </div>
  );

  const headerRow =
    categorySwipeEnabled && !editingCategoryInline ? (
      <SwipeableDelete
        enabled={categorySwipeEnabled}
        rounded
        onDelete={onDeleteCategory}
        onSwipeOpenChange={handleCategorySwipeOpenChange}
      >
        {headerContent}
      </SwipeableDelete>
    ) : (
      headerContent
    );

  return (
    <section
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#E5E5EA]/80 ${
        wiggleCategories && categoryEditActive ? "animate-wiggle" : ""
      } ${dimmed ? "opacity-70" : ""}`}
      style={{ borderLeft: `4px solid ${category.color}` }}
      onClick={(event) => event.stopPropagation()}
    >
      {headerRow}

      {editingCategoryInline && (
        <div
          className="flex items-center justify-between gap-3 border-b border-[#F2F2F7] bg-white px-3 py-2"
          onClick={(event) => event.stopPropagation()}
        >
          <ColorPicker value={editColor} onChange={setEditColor} />
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={cancelCategoryInline}
              className="rounded-lg bg-[#F2F2F7] px-3 py-1.5 text-sm font-medium text-[#1C1C1E]"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!editName.trim()}
              onClick={saveCategoryInline}
              className="rounded-lg bg-[#007AFF] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              OK
            </button>
          </div>
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
                      swipeBlocked={itemSwipeOpenId === item.id}
                      highlighted={highlightedItemId === item.id}
                      showCheckbox={editMode === "none"}
                      onSwipeOpenChange={(open) => handleItemSwipeOpenChange(item.id, open)}
                      onToggleChecked={(checked) => onToggleItemChecked(item.id, checked)}
                      onEdit={() => {
                        if (itemSwipeOpenId === item.id) return;
                        setEditingItemId(item.id);
                      }}
                      onDelete={() => {
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
