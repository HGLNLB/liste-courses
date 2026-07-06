"use client";

import { useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "./Checkbox";
import { SwipeableDelete } from "./SwipeableDelete";
import { formatItemLabel } from "@/lib/utils";
import type { Item } from "@/lib/types";

type ItemRowProps = {
  item: Item;
  dragEnabled: boolean;
  swipeEnabled: boolean;
  highlighted: boolean;
  showCheckbox: boolean;
  onToggleChecked: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ItemRow({
  item,
  dragEnabled,
  swipeEnabled,
  highlighted,
  showCheckbox,
  onToggleChecked,
  onEdit,
  onDelete,
}: ItemRowProps) {
  const draggedRef = useRef(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !dragEnabled,
  });

  useEffect(() => {
    if (isDragging) {
      draggedRef.current = true;
      return;
    }
    if (draggedRef.current) {
      const timer = setTimeout(() => {
        draggedRef.current = false;
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isDragging]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: item.is_checked ? 0.4 : 1,
  };

  const row = (
    <div
      ref={setNodeRef}
      style={style}
      data-item-id={item.id}
      className={`relative flex items-center gap-3 border-b border-[#F2F2F7] bg-white px-4 py-3 last:border-b-0 ${
        highlighted ? "bg-[#FFF9C4]" : ""
      } ${isDragging ? "z-10 shadow-md" : ""}`}
      {...attributes}
    >
      <div
        className={`flex min-w-0 flex-1 items-center ${
          dragEnabled ? "cursor-grab touch-none active:cursor-grabbing" : ""
        }`}
        {...(dragEnabled ? listeners : {})}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!draggedRef.current) onEdit();
          }}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-base text-[#1C1C1E]">{formatItemLabel(item)}</p>
          {item.notes && <p className="truncate text-sm text-[#8E8E93]">{item.notes}</p>}
        </button>
      </div>

      {showCheckbox && (
        <Checkbox
          checked={item.is_checked}
          onChange={onToggleChecked}
          ariaLabel={`Cocher ${item.name}`}
        />
      )}
    </div>
  );

  return (
    <SwipeableDelete enabled={swipeEnabled} onDelete={onDelete}>
      {row}
    </SwipeableDelete>
  );
}
