"use client";

import { useCallback, useEffect, useRef } from "react";
import { Reorder, useDragControls, motion } from "framer-motion";
import { Checkbox } from "./Checkbox";
import { useLongPress } from "@/hooks/useLongPress";
import { useSwipeDelete } from "@/hooks/useSwipeDelete";
import { formatItemLabel, vibrate } from "@/lib/utils";
import type { Item } from "@/lib/types";

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
  onDragStart?: () => void;
  onDragEnd?: () => void;
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
  onDragStart,
  onDragEnd,
  onToggleChecked,
  onEdit,
  onDelete,
}: ItemRowProps) {
  const draggedRef = useRef(false);
  const dragControls = useDragControls();

  const handleActivate = useCallback(() => {
    onSwipeActivate();
  }, [onSwipeActivate]);

  const { x, deleteOpacity, isSwipeActive, captureHandlers } = useSwipeDelete({
    enabled: swipeEnabled,
    isActive: swipeActive,
    onActivate: handleActivate,
    onRelease: onSwipeRelease,
    onSwipeOpenChange,
    onDelete,
  });

  const handleLongPress = useLongPress({
    delay: 3000,
    moveTolerance: 20,
    disabled: !dragEnabled || isSwipeActive || swipeBlocked,
    onLongPress: (event) => {
      vibrate([30, 20, 30]);
      onDragStart?.();
      dragControls.start(event as PointerEvent);
    },
  });

  useEffect(() => {
    if (!dragEnabled) {
      draggedRef.current = false;
    }
  }, [dragEnabled]);

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => {
        draggedRef.current = true;
        onDragStart?.();
      }}
      onDragEnd={() => {
        onDragEnd?.();
        setTimeout(() => {
          draggedRef.current = false;
        }, 100);
      }}
      className={`relative overflow-hidden select-none border-b border-[#F2F2F7] last:border-b-0 ${
        highlighted ? "bg-[#FFF9C4]" : "bg-white"
      }`}
      data-item-id={item.id}
      data-item-row
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
        {...(swipeEnabled ? captureHandlers : {})}
      >
        <div className="relative flex items-center bg-inherit">
          {dragEnabled ? (
            <>
              <div
                data-drag-handle
                className="flex shrink-0 touch-none cursor-grab px-2 active:cursor-grabbing"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  handleLongPress.onPointerDown?.(event);
                }}
                onPointerMove={handleLongPress.onPointerMove}
                onPointerUp={handleLongPress.onPointerUp}
                onPointerCancel={handleLongPress.onPointerCancel}
                onTouchStart={(event) => {
                  event.stopPropagation();
                  handleLongPress.onTouchStart?.(event);
                }}
                onTouchMove={handleLongPress.onTouchMove}
                onTouchEnd={handleLongPress.onTouchEnd}
                onTouchCancel={handleLongPress.onTouchCancel}
              >
                <DragHandle />
              </div>
              <div
                role="button"
                tabIndex={swipeBlocked ? -1 : 0}
                aria-disabled={swipeBlocked}
                onClick={() => {
                  if (swipeBlocked || draggedRef.current) return;
                  onEdit();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (swipeBlocked || draggedRef.current) return;
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
    </Reorder.Item>
  );
}
