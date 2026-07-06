"use client";

import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "./Checkbox";
import { useSwipeDelete } from "@/hooks/useSwipeDelete";
import { formatItemLabel } from "@/lib/utils";
import type { Item } from "@/lib/types";
import { motion } from "framer-motion";

type ItemRowProps = {
  item: Item;
  dragEnabled: boolean;
  swipeEnabled: boolean;
  swipeActive: boolean;
  swipeBlocked: boolean;
  highlighted: boolean;
  showCheckbox: boolean;
  onSwipeActivate: () => void;
  onSwipeRelease: () => void;
  onSwipeOpenChange: (open: boolean) => void;
  onToggleChecked: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
};

function DragHandle() {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-[3px] px-1 py-3 opacity-40">
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
  swipeActive,
  swipeBlocked,
  highlighted,
  showCheckbox,
  onSwipeActivate,
  onSwipeRelease,
  onSwipeOpenChange,
  onToggleChecked,
  onEdit,
  onDelete,
}: ItemRowProps) {
  const { x, deleteOpacity, isSwipeActive, captureHandlers } = useSwipeDelete({
    enabled: swipeEnabled,
    isActive: swipeActive,
    onActivate: onSwipeActivate,
    onRelease: onSwipeRelease,
    onSwipeOpenChange,
    onDelete,
  });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !dragEnabled || isSwipeActive,
  });

  const handleListeners = useMemo(() => {
    if (!listeners || !dragEnabled) return {};

    const wrap = (handler: ((event: React.SyntheticEvent) => void) | undefined) => {
      if (!handler) return undefined;
      return (event: React.SyntheticEvent) => {
        handler(event);
        event.stopPropagation();
      };
    };

    return {
      ...attributes,
      ...listeners,
      onPointerDown: wrap(listeners.onPointerDown as ((event: React.SyntheticEvent) => void) | undefined),
      onTouchStart: wrap(listeners.onTouchStart as ((event: React.SyntheticEvent) => void) | undefined),
      onMouseDown: wrap(listeners.onMouseDown as ((event: React.SyntheticEvent) => void) | undefined),
      onKeyDown: wrap(listeners.onKeyDown as ((event: React.SyntheticEvent) => void) | undefined),
    };
  }, [attributes, dragEnabled, listeners]);

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : item.is_checked ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      data-item-id={item.id}
      data-item-row
      className={`relative overflow-hidden select-none border-b border-[#F2F2F7] last:border-b-0 ${
        highlighted ? "bg-[#FFF9C4]" : "bg-white"
      }`}
    >
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
        className={`relative bg-inherit ${isSwipeActive ? "touch-none" : ""}`}
        {...(swipeEnabled && !isDragging ? captureHandlers : {})}
      >
        <div className="relative flex items-center bg-inherit">
          {dragEnabled ? (
            <>
              <div
                data-drag-handle
                className="flex shrink-0 touch-none cursor-grab px-2 active:cursor-grabbing"
                {...handleListeners}
              >
                <DragHandle />
              </div>
              <div
                role="button"
                tabIndex={swipeBlocked ? -1 : 0}
                aria-disabled={swipeBlocked}
                onClick={() => {
                  if (swipeBlocked || isDragging) return;
                  onEdit();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (swipeBlocked || isDragging) return;
                    onEdit();
                  }
                }}
                className={`min-w-0 flex-1 py-3 pr-2 text-left ${swipeBlocked ? "pointer-events-none" : ""}`}
              >
                <p className="truncate text-base text-[#1C1C1E]">{formatItemLabel(item)}</p>
                {item.notes && <p className="truncate text-sm text-[#8E8E93]">{item.notes}</p>}
              </div>
            </>
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
