"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type DragEndEvent } from "@dnd-kit/core";
import { createClient } from "@/lib/supabase/client";
import { useShoppingList } from "@/hooks/useShoppingList";
import { forceUnlockScroll } from "@/lib/scrollLock";
import { CategoryEditor } from "./CategoryEditor";
import { SearchOverlay } from "./SearchOverlay";
import { ShoppingSections } from "./ShoppingSections";
import { vibrate } from "@/lib/utils";
import type { EditMode } from "@/lib/types";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [online, setOnline] = useState(true);
  const ignoreBackgroundExitUntilRef = useRef(0);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      forceUnlockScroll();
    };
  }, []);

  const exitEditMode = useCallback(() => {
    setEditMode("none");
    setWiggleCategories(false);
  }, []);

  const enterCategoryEditMode = useCallback(() => {
    vibrate([30, 30, 30]);
    setEditMode("categories");
    setWiggleCategories(true);
    ignoreBackgroundExitUntilRef.current = Date.now() + 600;
  }, []);

  const handleBackgroundDismiss = useCallback(() => {
    if (Date.now() < ignoreBackgroundExitUntilRef.current) return;
    if (editMode !== "none") exitEditMode();
  }, [editMode, exitEditMode]);

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
      data-shopping-app
      onClick={handleBackgroundDismiss}
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

      <main className="py-4">
        {categories.length === 0 && !creatingCategory ? (
          <div className="space-y-4 px-4">
            <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#8E8E93] shadow-sm ring-1 ring-[#E5E5EA]/80">
              Appuyez sur + pour créer votre première catégorie.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCreatingCategory(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#007AFF] text-xl font-light text-white shadow-sm"
                aria-label="Ajouter une catégorie"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <ShoppingSections
            categories={categories}
            editMode={editMode}
            wiggleCategories={wiggleCategories}
            highlightedItemId={highlightedItemId}
            creatingCategory={creatingCategory}
            onCreateCategory={() => setCreatingCategory(true)}
            onCancelCreateCategory={() => setCreatingCategory(false)}
            onSaveCategory={async (name, color) => {
              await addCategory(name, color);
              setCreatingCategory(false);
            }}
            onCategoryDragEnd={handleCategoryDragEnd}
            onToggleOpen={toggleCategoryOpen}
            onUpdateCategory={async (id, name, color) => {
              await updateCategory(id, { name, color });
            }}
            onDeleteCategory={deleteCategory}
            onLongPressCategory={enterCategoryEditMode}
            onToggleCategoryChecked={setCategoryChecked}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onToggleItemChecked={toggleItemChecked}
            onReorderItems={reorderItems}
          />
        )}

        {creatingCategory && categories.length === 0 && (
          <div className="mt-4 px-4">
            <CategoryEditor
              onCancel={() => setCreatingCategory(false)}
              onSave={async (name, color) => {
                await addCategory(name, color);
                setCreatingCategory(false);
              }}
            />
          </div>
        )}
      </main>

      <SearchOverlay
        open={searchOpen}
        categories={categories}
        onClose={() => setSearchOpen(false)}
        onSelect={scrollToItem}
        onToggleItemChecked={toggleItemChecked}
      />
    </div>
  );
}
