"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { GESTURE } from "@/lib/gestures";

type UseCategoryEditPressOptions = {
  enabled: boolean;
  blockedRef: RefObject<boolean>;
  onEditModeRequest: () => void;
};

export function useCategoryEditPress({
  enabled,
  blockedRef,
  onEditModeRequest,
}: UseCategoryEditPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clear(), [clear]);

  const cancel = useCallback(() => {
    clear();
    movedRef.current = false;
  }, [clear]);

  const onPressStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || blockedRef.current) return;
      movedRef.current = false;
      startRef.current = { x: clientX, y: clientY };
      clear();
      timerRef.current = setTimeout(() => {
        if (!blockedRef.current && !movedRef.current) {
          onEditModeRequest();
        }
      }, GESTURE.CATEGORY_EDIT_DELAY_MS);
    },
    [blockedRef, clear, enabled, onEditModeRequest],
  );

  const onPressMove = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - startRef.current.x;
      const dy = clientY - startRef.current.y;
      if (Math.hypot(dx, dy) > GESTURE.MOVE_TOLERANCE_PX) {
        movedRef.current = true;
        clear();
      }
    },
    [clear],
  );

  const onPressEnd = useCallback(() => {
    clear();
    movedRef.current = false;
  }, [clear]);

  return {
    onPointerDown: (event: React.PointerEvent) => onPressStart(event.clientX, event.clientY),
    onPointerMove: (event: React.PointerEvent) => onPressMove(event.clientX, event.clientY),
    onPointerUp: onPressEnd,
    onPointerCancel: onPressEnd,
    onTouchStart: (event: React.TouchEvent) => {
      const touch = event.touches[0];
      if (touch) onPressStart(touch.clientX, touch.clientY);
    },
    onTouchMove: (event: React.TouchEvent) => {
      const touch = event.touches[0];
      if (touch) onPressMove(touch.clientX, touch.clientY);
    },
    onTouchEnd: onPressEnd,
    onTouchCancel: onPressEnd,
    cancel,
  };
}
