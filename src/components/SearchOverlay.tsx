"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { itemSearchText, normalizeText } from "@/lib/utils";
import type { CategoryWithItems } from "@/lib/types";
import { formatItemLabel } from "@/lib/utils";

type SearchOverlayProps = {
  open: boolean;
  categories: CategoryWithItems[];
  onClose: () => void;
  onSelect: (itemId: string) => void;
};

export function SearchOverlay({ open, categories, onClose, onSelect }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    const normalized = normalizeText(query);
    if (!normalized) return [];

    return categories.flatMap((category) =>
      category.items
        .filter((item) => itemSearchText(item).includes(normalized))
        .map((item) => ({ category, item })),
    );
  }, [categories, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F2F2F7]/95 backdrop-blur-sm">
      <div className="safe-top flex items-center gap-2 border-b border-[#E5E5EA] bg-white px-4 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-[#F2F2F7] px-3 py-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="#8E8E93" strokeWidth="2" />
            <path d="M20 20L16.5 16.5" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un élément…"
            className="w-full bg-transparent text-base outline-none"
          />
        </div>
        <button type="button" onClick={onClose} className="text-sm font-medium text-[#007AFF]">
          Fermer
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {query && results.length === 0 && (
          <p className="text-center text-sm text-[#8E8E93]">Aucun résultat pour « {query} »</p>
        )}

        <ul className="space-y-2">
          {results.map(({ category, item }) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-[#E5E5EA]/80"
              >
                <div>
                  <p className="text-base text-[#1C1C1E]">{formatItemLabel(item)}</p>
                  <p className="text-sm text-[#8E8E93]">{category.name}</p>
                </div>
                <span
                  className={`text-xs font-medium ${
                    item.is_checked ? "text-[#8E8E93]" : "text-[#FF9500]"
                  }`}
                >
                  {item.is_checked ? "Coché" : "À acheter"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
