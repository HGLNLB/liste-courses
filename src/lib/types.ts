export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  position: number;
  is_checked: boolean;
  is_open: boolean;
  created_at: string;
  updated_at: string;
};

export type Item = {
  id: string;
  category_id: string;
  user_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  notes: string | null;
  position: number;
  is_checked: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryWithItems = Category & {
  items: Item[];
};

export type EditMode = "none" | "categories";

export type ItemSortMode = "position" | "alphabetical";

export const CATEGORY_COLORS = [
  { name: "Jaune", value: "#FFD60A" },
  { name: "Vert", value: "#34C759" },
  { name: "Bleu", value: "#007AFF" },
  { name: "Orange", value: "#FF9500" },
  { name: "Rose", value: "#FF2D55" },
  { name: "Violet", value: "#AF52DE" },
  { name: "Turquoise", value: "#5AC8FA" },
  { name: "Gris", value: "#8E8E93" },
] as const;
