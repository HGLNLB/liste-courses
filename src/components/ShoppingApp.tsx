"use client";

import { useCallback, useEffect, useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { useShoppingList } from "@/hooks/useShoppingList";
import { SortableCategoryCard } from "./SortableCategoryCard";
import { CategoryEditor } from "./CategoryEditor";
import { SearchOverlay } from "./SearchOverlay";
import { ShoppingSections } from "./ShoppingSections";
import { vibrate } from "@/lib/utils";
import type { EditMode } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";

type ShoppingAppProps = {
  userId: string;
  userEmail: string;
};

export function ShoppingApp({ userId, userEmail }: ShoppingAppProps) {
  const supabase = createClient();
  const {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    toggleCategoryOpen,
    setCategoryChecked,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    toggleItemChecked,
    clearError,
  } = useShoppingList(userId);

  const [editMode, setEditMode] = useState<EditMode>("none");
  const [wiggleCategories, setWiggleCategories] = useState(false);
  const [wiggleItems, setWiggleItems] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const exitEditMode = useCallback(() => {
    setEditMode("none");
    setWiggleCategories(false);
    setWiggleItems(false);
  }, []);

  const enterCategoryEditMode = useCallback(() => {
    vibrate([30, 30, 30]);
    setEditMode("categories");
    setWiggleCategories(true);
    setWiggleItems(false);
  }, []);

  const enterItemEditMode = useCallback(() => {
    vibrate([30, 30, 30]);
    setEditMode("items");
    setWiggleItems(true);
    setWiggleCategories(false);
  }, []);

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = categories.map((category) => category.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const next = [...ids];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    reorderCategories(next);
  };

  const scrollToItem = (itemId: string) => {
    setHighlightedItemId(itemId);
    const element = document.querySelector(`[data-item-id="${itemId}"]`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedItemId(null), 2500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-[#8E8E93]">
        Chargement…
      </div>
    );
  }

  return (
    <div
      className="min-h-full bg-[#F2F2F7]"
      onClick={() => {
        if (editMode !== "none") exitEditMode();
      }}
    >
      <header className="safe-top sticky top-0 z-40 border-b border-[#E5E5EA] bg-[#F2F2F7]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-semibold text-[#1C1C1E]">Liste de courses</h1>
            <p className="text-xs text-[#8E8E93]">{userEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Rechercher"
              onClick={(event) => {
                event.stopPropagation();
                setSearchOpen(true);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E5E5EA]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="#1C1C1E" strokeWidth="2" />
                <path d="M20 20L16.5 16.5" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleLogout();
              }}
              className="rounded-full bg-white px-3 py-2 text-xs font-medium text-[#FF3B30] shadow-sm ring-1 ring-[#E5E5EA]"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {!online && (
          <div className="bg-[#FFF3CD] px-4 py-2 text-center text-xs text-[#856404]">
            Mode hors ligne — les modifications seront synchronisées au retour du réseau.
          </div>
        )}

        {editMode !== "none" && (
          <div className="bg-[#007AFF]/10 px-4 py-2 text-center text-xs font-medium text-[#007AFF]">
            Mode édition — touchez ailleurs pour terminer
          </div>
        )}
      </header>

      {error && (
        <div className="mx-4 mt-4 flex items-center justify-between rounded-xl bg-[#FFE5E5] px-4 py-3 text-sm text-[#C62828]">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="font-medium">
            OK
          </button>
        </div>
      )}

      <main className="space-y-6 py-4">
        <section className="px-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8E8E93]">
              Catégories
            </h2>
            {editMode === "none" && (
              <button
                type="button"
                onClick={() => setCreatingCategory(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#007AFF] text-xl font-light text-white shadow-sm"
                aria-label="Ajouter une catégorie"
              >
                +
              </button>
            )}
          </div>

          {creatingCategory && (
            <div className="mb-4">
              <CategoryEditor
                onCancel={() => setCreatingCategory(false)}
                onSave={async (name, color) => {
                  await addCategory(name, color);
                  setCreatingCategory(false);
                }}
              />
            </div>
          )}

          {editingCategoryId && (
            <div className="mb-4">
              <CategoryEditor
                initialName={categories.find((c) => c.id === editingCategoryId)?.name}
                initialColor={
                  categories.find((c) => c.id === editingCategoryId)?.color ??
                  CATEGORY_COLORS[0].value
                }
                onCancel={() => setEditingCategoryId(null)}
                onSave={async (name, color) => {
                  await updateCategory(editingCategoryId, { name, color });
                  setEditingCategoryId(null);
                }}
              />
            </div>
          )}

          <DndContext
            sensors={categorySensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleCategoryDragEnd}
          >
            <SortableContext
              items={categories.map((category) => category.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {categories.length === 0 && (
                  <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#8E8E93] shadow-sm ring-1 ring-[#E5E5EA]/80">
                    Appuyez sur + pour créer votre première catégorie.
                  </p>
                )}
                {categories.map((category) => (
                  <SortableCategoryCard
                    key={category.id}
                    category={category}
                    editMode={editMode}
                    wiggleCategories={wiggleCategories}
                    wiggleItems={wiggleItems}
                    highlightedItemId={highlightedItemId}
                    onToggleOpen={() => toggleCategoryOpen(category.id)}
                    onEditCategory={() => setEditingCategoryId(category.id)}
                    onDeleteCategory={() => deleteCategory(category.id)}
                    onLongPressCategory={enterCategoryEditMode}
                    onToggleCategoryChecked={(checked) => setCategoryChecked(category.id, checked)}
                    onAddItem={(payload) => addItem(category.id, payload)}
                    onUpdateItem={(id, payload) => updateItem(id, payload)}
                    onDeleteItem={deleteItem}
                    onToggleItemChecked={toggleItemChecked}
                    onLongPressItem={enterItemEditMode}
                    onReorderItems={(orderedIds) => reorderItems(category.id, orderedIds)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        <ShoppingSections categories={categories} onItemClick={scrollToItem} />
      </main>

      <SearchOverlay
        open={searchOpen}
        categories={categories}
        onClose={() => setSearchOpen(false)}
        onSelect={scrollToItem}
      />
    </div>
  );
}
