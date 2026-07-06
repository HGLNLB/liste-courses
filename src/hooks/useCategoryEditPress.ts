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

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clear(), [clear]);

  const cancel = useCallback(() => {
    clear();
  }, [clear]);

  const onPointerDown = useCallback(() => {
    if (!enabled || blockedRef.current) return;
    clear();
    timerRef.current = setTimeout(() => {
      if (!blockedRef.current) {
        onEditModeRequest();
      }
    }, GESTURE.CATEGORY_EDIT_DELAY_MS);
  }, [blockedRef, clear, enabled, onEditModeRequest]);

  const onPointerUp = useCallback(() => {
    clear();
  }, [clear]);

  return { onPointerDown, onPointerUp, cancel };
}
