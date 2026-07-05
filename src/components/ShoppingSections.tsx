"use client";

import { formatItemLabel, getCheckedGroups, getUncheckedGroups } from "@/lib/utils";
import type { CategoryWithItems } from "@/lib/types";

type ShoppingSectionsProps = {
  categories: CategoryWithItems[];
  onItemClick: (itemId: string) => void;
};

export function ShoppingSections({ categories, onItemClick }: ShoppingSectionsProps) {
  const toBuy = getUncheckedGroups(categories);
  const notNeeded = getCheckedGroups(categories);

  return (
    <div className="space-y-4 px-4 pb-8">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#E5E5EA]/80">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#FF9500]">
          À acheter
        </h3>
        {toBuy.length === 0 ? (
          <p className="text-sm text-[#8E8E93]">Tout est coché — rien à acheter.</p>
        ) : (
          <div className="space-y-4">
            {toBuy.map(({ category, items }) => (
              <div key={category.id}>
                <p
                  className="mb-1 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: category.color }}
                >
                  {category.name}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onItemClick(item.id)}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-[#1C1C1E] hover:bg-[#F2F2F7]"
                      >
                        {formatItemLabel(item)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#E5E5EA]/80">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#8E8E93]">
          Pas besoin
        </h3>
        {notNeeded.length === 0 ? (
          <p className="text-sm text-[#8E8E93]">Aucun élément coché pour l&apos;instant.</p>
        ) : (
          <div className="space-y-4 opacity-60">
            {notNeeded.map(({ category, items }) => (
              <div key={category.id}>
                <p
                  className="mb-1 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: category.color }}
                >
                  {category.name}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onItemClick(item.id)}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-[#636366] line-through hover:bg-[#F2F2F7]"
                      >
                        {formatItemLabel(item)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
