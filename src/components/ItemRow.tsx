"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "./Checkbox";
import { useSwipeDelete } from "@/hooks/useSwipeDelete";
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

function DragHandle() {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-[3px] px-2 py-3 opacity-40">
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

  const { x, deleteOpacity, captureHandlers } = useSwipeDelete({
    enabled: swipeEnabled,
    onDelete,
  });

  useEffect(() => {
    if (isDragging) {
      draggedRef.current = true;
      return;
    }
    if (draggedRef.current) {
      const timer = setTimeout(() => {
        draggedRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDragging]);

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : item.is_checked ? 0.4 : 1,
  };

  return (
    <div className="relative overflow-hidden select-none" data-item-row>
      {swipeEnabled && (
        <motion.div
          className="absolute inset-0 flex items-center bg-[#FF3B30] pl-5"
          style={{ opacity: deleteOpacity }}
          aria-hidden="true"
        >
          <span className="text-2xl font-bold text-white">−</span>
        </motion.div>
      )}

      <motion.div
        style={{ x: swipeEnabled ? x : 0 }}
        className="relative bg-white"
        {...(swipeEnabled ? captureHandlers : {})}
      >
        <div
          ref={setNodeRef}
          style={sortableStyle}
          data-item-id={item.id}
          className={`relative flex items-center border-b border-[#F2F2F7] last:border-b-0 ${
            highlighted ? "bg-[#FFF9C4]" : "bg-white"
          }`}
          {...attributes}
        >
          {dragEnabled ? (
            <div
              className="flex min-w-0 flex-1 touch-manipulation"
              {...listeners}
            >
              <DragHandle />
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!draggedRef.current && !isDragging) onEdit();
                }}
                className="min-w-0 flex-1 py-3 pr-2 text-left"
              >
                <p className="truncate text-base text-[#1C1C1E]">{formatItemLabel(item)}</p>
                {item.notes && <p className="truncate text-sm text-[#8E8E93]">{item.notes}</p>}
              </div>
            </div>
          ) : (
            <>
              <DragHandle />
              <button
                type="button"
                onClick={onEdit}
                className="min-w-0 flex-1 py-3 pr-2 text-left"
              >
                <p className="truncate text-base text-[#1C1C1E]">{formatItemLabel(item)}</p>
                {item.notes && <p className="truncate text-sm text-[#8E8E93]">{item.notes}</p>}
              </button>
            </>
          )}

          {showCheckbox && (
            <div className="shrink-0 pr-4">
              <Checkbox
                checked={item.is_checked}
                onChange={onToggleChecked}
                ariaLabel={`Cocher ${item.name}`}
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
