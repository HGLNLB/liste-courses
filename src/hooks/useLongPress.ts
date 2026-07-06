"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

type LongPressOptions = {
  onLongPress: (event: TouchEvent | MouseEvent | PointerEvent) => void;
  onClick?: () => void;
  delay?: number;
  disabled?: boolean;
  blockedRef?: RefObject<boolean>;
  moveTolerance?: number;
};

export function useLongPress({
  onLongPress,
  onClick,
  delay = 500,
  disabled = false,
  blockedRef,
  moveTolerance = 12,
}: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const startEventRef = useRef<TouchEvent | MouseEvent | PointerEvent | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const isBlocked = useCallback(
    () => disabled || Boolean(blockedRef?.current),
    [blockedRef, disabled],
  );

  useEffect(() => {
    if (isBlocked()) {
      clear();
    }
  }, [clear, isBlocked, disabled]);

  const start = useCallback(
    (event: TouchEvent | MouseEvent | PointerEvent) => {
      if (isBlocked()) return;

      longPressTriggeredRef.current = false;
      startEventRef.current = event;
      clear();

      const point = "touches" in event ? event.touches[0] : event;
      if (!point) return;

      startPosRef.current = { x: point.clientX, y: point.clientY };

      timerRef.current = setTimeout(() => {
        if (isBlocked() || !startEventRef.current) return;
        longPressTriggeredRef.current = true;
        onLongPress(startEventRef.current);
      }, delay);
    },
    [clear, delay, isBlocked, onLongPress],
  );

  const move = useCallback(
    (event: TouchEvent | MouseEvent | PointerEvent) => {
      if (!timerRef.current) return;

      const point = "touches" in event ? event.touches[0] : event;
      if (!point) return;

      const dx = Math.abs(point.clientX - startPosRef.current.x);
      const dy = Math.abs(point.clientY - startPosRef.current.y);
      if (dx > moveTolerance || dy > moveTolerance) {
        clear();
      }
    },
    [clear, moveTolerance],
  );

  const end = useCallback(() => {
    clear();
    startEventRef.current = null;
  }, [clear]);

  const click = useCallback(() => {
    if (isBlocked()) return;
    if (!longPressTriggeredRef.current) {
      onClick?.();
    }
    longPressTriggeredRef.current = false;
  }, [isBlocked, onClick]);

  return {
    onMouseDown: (event: React.MouseEvent) => start(event.nativeEvent),
    onMouseUp: end,
    onMouseLeave: end,
    onMouseMove: (event: React.MouseEvent) => move(event.nativeEvent),
    onTouchStart: (event: React.TouchEvent) => start(event.nativeEvent),
    onTouchMove: (event: React.TouchEvent) => move(event.nativeEvent),
    onTouchEnd: end,
    onTouchCancel: end,
    onPointerDown: (event: React.PointerEvent) => start(event.nativeEvent),
    onPointerMove: (event: React.PointerEvent) => move(event.nativeEvent),
    onPointerUp: end,
    onPointerCancel: end,
    onClick: click,
  };
}
