"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "./Checkbox";
import { useLongPress } from "@/hooks/useLongPress";
import { formatItemLabel, vibrate } from "@/lib/utils";
import type { Item } from "@/lib/types";

type ItemRowProps = {
  item: Item;
  editMode: boolean;
  wiggle: boolean;
  highlighted: boolean;
  showCheckbox: boolean;
  onToggleChecked: (checked: boolean) => void;
  onLongPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ItemRow({
  item,
  editMode,
  wiggle,
  highlighted,
  showCheckbox,
  onToggleChecked,
  onLongPress,
  onEdit,
  onDelete,
}: ItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !editMode,
  });

  const longPress = useLongPress({
    onLongPress: () => {
      vibrate();
      onLongPress();
    },
    onClick: onEdit,
    disabled: editMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: item.is_checked ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-item-id={item.id}
      className={`relative flex items-center gap-3 border-b border-[#F2F2F7] px-4 py-3 last:border-b-0 ${
        highlighted ? "bg-[#FFF9C4]" : "bg-white"
      } ${isDragging ? "z-10 shadow-md" : ""} ${wiggle ? "animate-wiggle" : ""}`}
    >
      {editMode && (
        <button
          type="button"
          aria-label="Supprimer l'élément"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF3B30] text-sm font-bold text-white"
        >
          −
        </button>
      )}

      <div
        className={`min-w-0 flex-1 ${editMode ? "cursor-grab active:cursor-grabbing" : ""}`}
        {...(editMode ? { ...attributes, ...listeners } : {})}
        {...(!editMode ? longPress : {})}
      >
        <p className="truncate text-base text-[#1C1C1E]">{formatItemLabel(item)}</p>
        {item.notes && <p className="truncate text-sm text-[#8E8E93]">{item.notes}</p>}
      </div>

      {showCheckbox && !editMode && (
        <Checkbox
          checked={item.is_checked}
          onChange={onToggleChecked}
          ariaLabel={`Cocher ${item.name}`}
        />
      )}
    </div>
  );
}
