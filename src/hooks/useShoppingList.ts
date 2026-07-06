"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryWithItems, Item } from "@/lib/types";
import { isCategoryFullyChecked } from "@/lib/utils";

const REALTIME_RELOAD_MS = 300;
const LOCAL_WRITE_GRACE_MS = 900;

function sortByPosition<T extends { position: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position);
}

export function useShoppingList(userId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<CategoryWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipRealtimeUntilRef = useRef(0);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markLocalWrite = useCallback(() => {
    skipRealtimeUntilRef.current = Date.now() + LOCAL_WRITE_GRACE_MS;
  }, []);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!userId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    const [{ data: categoriesData, error: categoriesError }, { data: itemsData, error: itemsError }] =
      await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", userId)
          .order("position", { ascending: true }),
        supabase.from("items").select("*").eq("user_id", userId).order("position", { ascending: true }),
      ]);

    if (categoriesError || itemsError) {
      setError(categoriesError?.message ?? itemsError?.message ?? "Erreur de chargement");
      if (!options?.silent) {
        setLoading(false);
      }
      return;
    }

    const itemsByCategory = (itemsData ?? []).reduce<Record<string, Item[]>>((acc, item) => {
      if (!acc[item.category_id]) acc[item.category_id] = [];
      acc[item.category_id].push(item);
      return acc;
    }, {});

    const merged: CategoryWithItems[] = sortByPosition(categoriesData ?? []).map((category) => {
      const items = sortByPosition(itemsByCategory[category.id] ?? []);
      return {
        ...category,
        items,
        is_checked:
          items.length === 0 ? category.is_checked : isCategoryFullyChecked({ ...category, items }),
      };
    });

    setCategories(merged);
    if (!options?.silent) {
      setLoading(false);
    }
  }, [supabase, userId]);

  const scheduleRemoteReload = useCallback(() => {
    if (!userId) return;
    if (Date.now() < skipRealtimeUntilRef.current) return;

    if (reloadTimerRef.current) {
      clearTimeout(reloadTimerRef.current);
    }

    reloadTimerRef.current = setTimeout(() => {
      if (Date.now() < skipRealtimeUntilRef.current) return;
      void load({ silent: true });
    }, REALTIME_RELOAD_MS);
  }, [load, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`shopping-list-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `user_id=eq.${userId}` },
        scheduleRemoteReload,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `user_id=eq.${userId}` },
        scheduleRemoteReload,
      )
      .subscribe();

    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [scheduleRemoteReload, supabase, userId]);

  const addCategory = useCallback(
    async (name: string, color: string) => {
      if (!userId) return;
      markLocalWrite();
      const position = categories.length;
      const { data, error: insertError } = await supabase
        .from("categories")
        .insert({ user_id: userId, name, color, position })
        .select()
        .single();

      if (insertError || !data) {
        setError(insertError?.message ?? "Impossible d'ajouter la catégorie");
        return;
      }

      setCategories((prev) => [...prev, { ...data, items: [] }]);
    },
    [categories.length, markLocalWrite, supabase, userId],
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Pick<Category, "name" | "color" | "is_open">>) => {
      markLocalWrite();
      setCategories((prev) =>
        prev.map((category) => (category.id === id ? { ...category, ...updates } : category)),
      );

      const { error: updateError } = await supabase
        .from("categories")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        await load({ silent: true });
      }
    },
    [load, markLocalWrite, supabase],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      markLocalWrite();
      setCategories((prev) => prev.filter((category) => category.id !== id));

      const { error: deleteError } = await supabase.from("categories").delete().eq("id", id);
      if (deleteError) {
        setError(deleteError.message);
        await load({ silent: true });
      }
    },
    [load, markLocalWrite, supabase],
  );

  const reorderCategories = useCallback(
    async (orderedIds: string[]) => {
      markLocalWrite();
      setCategories((prev) => {
        const map = new Map(prev.map((category) => [category.id, category]));
        return orderedIds
          .map((id, index) => {
            const category = map.get(id);
            return category ? { ...category, position: index } : null;
          })
          .filter(Boolean) as CategoryWithItems[];
      });

      const results = await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from("categories").update({ position: index }).eq("id", id),
        ),
      );

      const failed = results.find((result) => result.error);
      if (failed?.error) {
        setError(failed.error.message);
        await load({ silent: true });
      }
    },
    [load, markLocalWrite, supabase],
  );

  const toggleCategoryOpen = useCallback(
    async (id: string) => {
      const category = categories.find((entry) => entry.id === id);
      if (!category) return;
      await updateCategory(id, { is_open: !category.is_open });
    },
    [categories, updateCategory],
  );

  const setCategoryChecked = useCallback(
    async (categoryId: string, checked: boolean) => {
      const category = categories.find((entry) => entry.id === categoryId);
      if (!category) return;

      markLocalWrite();
      setCategories((prev) =>
        prev.map((entry) =>
          entry.id === categoryId
            ? {
                ...entry,
                is_checked: checked,
                items: entry.items.map((item) => ({ ...item, is_checked: checked })),
              }
            : entry,
        ),
      );

      const results = await Promise.all([
        supabase.from("categories").update({ is_checked: checked }).eq("id", categoryId),
        ...category.items.map((item) =>
          supabase.from("items").update({ is_checked: checked }).eq("id", item.id),
        ),
      ]);

      const failed = results.find((result) => result.error);
      if (failed?.error) {
        setError(failed.error.message);
        await load({ silent: true });
      }
    },
    [categories, load, markLocalWrite, supabase],
  );

  const addItem = useCallback(
    async (
      categoryId: string,
      payload: { name: string; quantity?: string; unit?: string; notes?: string },
    ) => {
      if (!userId) return;
      markLocalWrite();
      const category = categories.find((entry) => entry.id === categoryId);
      const position = category?.items.length ?? 0;

      const { data, error: insertError } = await supabase
        .from("items")
        .insert({
          user_id: userId,
          category_id: categoryId,
          name: payload.name,
          quantity: payload.quantity || null,
          unit: payload.unit || null,
          notes: payload.notes || null,
          position,
        })
        .select()
        .single();

      if (insertError || !data) {
        setError(insertError?.message ?? "Impossible d'ajouter l'élément");
        return;
      }

      setCategories((prev) =>
        prev.map((entry) =>
          entry.id === categoryId ? { ...entry, items: [...entry.items, data] } : entry,
        ),
      );
    },
    [categories, markLocalWrite, supabase, userId],
  );

  const updateItem = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Item, "name" | "quantity" | "unit" | "notes">>,
    ) => {
      markLocalWrite();
      setCategories((prev) =>
        prev.map((category) => ({
          ...category,
          items: category.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        })),
      );

      const { error: updateError } = await supabase
        .from("items")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        await load({ silent: true });
      }
    },
    [load, markLocalWrite, supabase],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      markLocalWrite();
      setCategories((prev) =>
        prev.map((category) => ({
          ...category,
          items: category.items.filter((item) => item.id !== id),
        })),
      );

      const { error: deleteError } = await supabase.from("items").delete().eq("id", id);
      if (deleteError) {
        setError(deleteError.message);
        await load({ silent: true });
      }
    },
    [load, markLocalWrite, supabase],
  );

  const reorderItems = useCallback(
    async (categoryId: string, orderedIds: string[]) => {
      markLocalWrite();
      setCategories((prev) =>
        prev.map((category) => {
          if (category.id !== categoryId) return category;
          const map = new Map(category.items.map((item) => [item.id, item]));
          return {
            ...category,
            items: orderedIds
              .map((id, index) => {
                const item = map.get(id);
                return item ? { ...item, position: index } : null;
              })
              .filter(Boolean) as Item[],
          };
        }),
      );

      const results = await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from("items").update({ position: index }).eq("id", id),
        ),
      );

      const failed = results.find((result) => result.error);
      if (failed?.error) {
        setError(failed.error.message);
        await load({ silent: true });
      }
    },
    [load, markLocalWrite, supabase],
  );

  const toggleItemChecked = useCallback(
    async (itemId: string, checked: boolean) => {
      markLocalWrite();
      setCategories((prev) =>
        prev.map((category) => {
          const items = category.items.map((item) =>
            item.id === itemId ? { ...item, is_checked: checked } : item,
          );
          return {
            ...category,
            items,
            is_checked: items.length > 0 && items.every((item) => item.is_checked),
          };
        }),
      );

      const { error: updateError } = await supabase
        .from("items")
        .update({ is_checked: checked })
        .eq("id", itemId);

      if (updateError) {
        setError(updateError.message);
        await load({ silent: true });
      }
    },
    [load, markLocalWrite, supabase],
  );

  return {
    categories,
    loading,
    error,
    reload: load,
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
    clearError: () => setError(null),
  };
}
