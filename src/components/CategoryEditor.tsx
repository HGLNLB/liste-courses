"use client";

import { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { CATEGORY_COLORS } from "@/lib/types";

type CategoryEditorProps = {
  initialName?: string;
  initialColor?: string;
  onSave: (name: string, color: string) => void;
  onCancel: () => void;
};

export function CategoryEditor({
  initialName = "",
  initialColor = CATEGORY_COLORS[0].value,
  onSave,
  onCancel,
}: CategoryEditorProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  return (
    <div className="rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-lg">
      <input
        autoFocus
        type="text"
        name="shopping-category-title"
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        spellCheck
        inputMode="text"
        enterKeyHint="done"
        data-1p-ignore
        data-lpignore="true"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nom de la catégorie"
        className="mb-3 w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-base outline-none focus:border-[#007AFF]"
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="mt-4 flex gap-2">
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
          onClick={() => onSave(name.trim(), color)}
          className="flex-1 rounded-xl bg-[#007AFF] py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
