"use client";

import { CATEGORY_COLORS } from "@/lib/types";

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          aria-label={color.name}
          onClick={() => onChange(color.value)}
          className={`h-7 w-7 rounded-full border-2 transition-transform active:scale-95 ${
            value === color.value ? "border-[#007AFF] scale-110" : "border-transparent"
          }`}
          style={{ backgroundColor: color.value }}
        />
      ))}
    </div>
  );
}
