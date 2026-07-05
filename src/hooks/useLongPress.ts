"use client";

import { useCallback, useRef } from "react";

type LongPressOptions = {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
  disabled?: boolean;
};

export function useLongPress({
  onLongPress,
  onClick,
  delay = 500,
  disabled = false,
}: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (disabled) return;
    longPressTriggeredRef.current = false;
    clear();
    timerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress();
    }, delay);
  }, [clear, delay, disabled, onLongPress]);

  const end = useCallback(() => {
    clear();
  }, [clear]);

  const click = useCallback(() => {
    if (disabled) return;
    if (!longPressTriggeredRef.current) {
      onClick?.();
    }
    longPressTriggeredRef.current = false;
  }, [disabled, onClick]);

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: end,
    onTouchStart: start,
    onTouchEnd: end,
    onTouchCancel: end,
    onClick: click,
  };
}
