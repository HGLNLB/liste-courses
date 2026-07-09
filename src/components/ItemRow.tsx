"use client";

import { useState } from "react";
import { Checkbox } from "./Checkbox";
import { SwipeableDelete } from "./SwipeableDelete";
import { formatItemLabel } from "@/lib/utils";
import type { Item } from "@/lib/types";

type ItemRowProps = {
  item: Item;
  dragEnabled: boolean;
  swipeEnabled: boolean;
  swipeBlocked: boolean;
  highlighted: boolean;
  showCheckbox: boolean;
  isDragging?: boolean;
  onSwipeOpenChange: (open: boolean) => void;
  onToggleChecked: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
};

function DragHandle() {
  return (
    <div
      className="pointer-events-none flex shrink-0 flex-col items-center justify-center gap-[3px] px-1 py-3 opacity-40"
      aria-hidden="true"
    >
      <span className="block h-[3px] w-[3px] rounded-full bg-[#8E8E93]" />
      <span className="block h-[3px] w-[3px] rounded-full bg-[#8E8E93]" />
      <span className="block h-[3px] w-[3px] rounded-full bg-[#8E8E93]" />
    </div>
  );
}

export function ItemRow({
  item,
  dragEnabled,
  swipeEnabled,
  swipeBlocked,
  highlighted,
  showCheckbox,
  isDragging = false,
  onSwipeOpenChange,
  onToggleChecked,
  onEdit,
  onDelete,
}: ItemRowProps) {
  const [swipeOpen, setSwipeOpen] = useState(false);

  const handleSwipeOpenChange = (open: boolean) => {
    setSwipeOpen(open);
    onSwipeOpenChange(open);
  };

  const rowContent = (
    <div
      data-item-id={item.id}
      data-item-row
      className={`relative flex items-center select-none ${
        highlighted ? "bg-[#FFF9C4]" : "bg-white"
      } ${isDragging ? "shadow-md ring-1 ring-[#E5E5EA]" : ""}`}
      style={{ opacity: item.is_checked ? 0.4 : 1 }}
    >
      {dragEnabled && <DragHandle />}
      <div
        role="button"
        tabIndex={swipeBlocked ? -1 : 0}
        aria-disabled={swipeBlocked}
        data-no-swipe
        onClick={() => {
          if (swipeBlocked || isDragging || swipeOpen) return;
          onEdit();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (swipeBlocked || isDragging || swipeOpen) return;
            onEdit();
          }
        }}
        className={`min-w-0 flex-1 py-3 pr-2 text-left ${swipeBlocked ? "pointer-events-none" : ""}`}
      >
        <p className="truncate text-base text-[#1C1C1E]">{formatItemLabel(item)}</p>
        {item.notes && <p className="truncate text-sm text-[#8E8E93]">{item.notes}</p>}
      </div>

      {showCheckbox && (
        <div className="shrink-0 pr-4" data-no-swipe data-no-toggle>
          <Checkbox
            checked={item.is_checked}
            onChange={onToggleChecked}
            ariaLabel={`Cocher ${item.name}`}
          />
        </div>
      )}
    </div>
  );

  if (!swipeEnabled) {
    return (
      <div className="overflow-hidden border-b border-[#F2F2F7] last:border-b-0">{rowContent}</div>
    );
  }

  return (
    <div className="overflow-hidden border-b border-[#F2F2F7] last:border-b-0">
      <SwipeableDelete
        enabled={swipeEnabled}
        onDelete={onDelete}
        onSwipeOpenChange={handleSwipeOpenChange}
      >
        {rowContent}
      </SwipeableDelete>
    </div>
  );
}
