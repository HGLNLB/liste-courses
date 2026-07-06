import type { CategoryWithItems, Item } from "./types";

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function formatItemLabel(item: Item): string {
  const parts = [item.name];
  if (item.quantity) {
    parts.push(item.quantity);
  }
  if (item.unit) {
    parts.push(item.unit);
  }
  return parts.join(" · ");
}

export function itemSearchText(item: Item): string {
  return normalizeText(
    [item.name, item.quantity, item.unit, item.notes].filter(Boolean).join(" "),
  );
}

export function vibrate(pattern: number | number[] = 40): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function getToBuyCategories(categories: CategoryWithItems[]) {
  return categories.filter(
    (category) =>
      category.items.length === 0 || category.items.some((item) => !item.is_checked),
  );
}

export function getNotNeededCategories(categories: CategoryWithItems[]) {
  return categories.filter((category) => category.items.some((item) => item.is_checked));
}

export function getUncheckedGroups(categories: CategoryWithItems[]) {
  return categories
    .map((category) => ({
      category,
      items: category.items.filter((item) => !item.is_checked),
    }))
    .filter((group) => group.items.length > 0);
}

export function getCheckedGroups(categories: CategoryWithItems[]) {
  return categories
    .map((category) => ({
      category,
      items: category.items.filter((item) => item.is_checked),
    }))
    .filter((group) => group.items.length > 0);
}

export function isCategoryFullyChecked(category: CategoryWithItems): boolean {
  return category.items.length > 0 && category.items.every((item) => item.is_checked);
}
