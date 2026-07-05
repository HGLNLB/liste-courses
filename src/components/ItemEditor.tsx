"use client";

import { useState } from "react";
import { formatItemLabel } from "@/lib/utils";
import type { Item } from "@/lib/types";

type ItemEditorProps = {
  initial?: Partial<Pick<Item, "name" | "quantity" | "unit" | "notes">>;
  onSave: (payload: { name: string; quantity?: string; unit?: string; notes?: string }) => void;
  onCancel: () => void;
};

export function ItemEditor({ initial, onSave, onCancel }: ItemEditorProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [quantity, setQuantity] = useState(initial?.quantity ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <div className="rounded-2xl border border-[#E5E5EA] bg-[#FAFAFA] p-3">
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nom de l'élément"
        className="mb-2 w-full rounded-lg border border-[#E5E5EA] bg-white px-3 py-2 text-base outline-none focus:border-[#007AFF]"
      />
      <div className="mb-2 grid grid-cols-2 gap-2">
        <input
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          placeholder="Quantité"
          className="rounded-lg border border-[#E5E5EA] bg-white px-3 py-2 text-sm outline-none focus:border-[#007AFF]"
        />
        <input
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          placeholder="Unité (kg, L…)"
          className="rounded-lg border border-[#E5E5EA] bg-white px-3 py-2 text-sm outline-none focus:border-[#007AFF]"
        />
      </div>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Notes"
        rows={2}
        className="mb-3 w-full resize-none rounded-lg border border-[#E5E5EA] bg-white px-3 py-2 text-sm outline-none focus:border-[#007AFF]"
      />
      {name.trim() && (
        <p className="mb-3 text-xs text-[#8E8E93]">
          Aperçu : {formatItemLabel({ name: name.trim(), quantity, unit } as Item)}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-[#F2F2F7] py-2 text-sm font-medium"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!name.trim()}
          onClick={() =>
            onSave({
              name: name.trim(),
              quantity: quantity.trim() || undefined,
              unit: unit.trim() || undefined,
              notes: notes.trim() || undefined,
            })
          }
          className="flex-1 rounded-xl bg-[#007AFF] py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
