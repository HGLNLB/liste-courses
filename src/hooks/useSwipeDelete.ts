"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";
import { GESTURE } from "@/lib/gestures";
import { vibrate } from "@/lib/utils";

const REVEAL_OFFSET = 72;
const DELETE_THRESHOLD = 140;
const SWIPE_START_PX = 10;

type UseSwipeDeleteOptions = {
  enabled: boolean;
  isActive: boolean;
  dragHoldDelayMs?: number;
  onActivate: () => void;
  onRelease?: () => void;
  onSwipeOpenChange?: (open: boolean) => void;
  onDelete: () => void;
};

export function useSwipeDelete({
  enabled,
  isActive,
  dragHoldDelayMs = GESTURE.ITEM_DRAG_DELAY_MS,
  onActivate,
  onRelease,
  onSwipeOpenChange,
  onDelete,
}: UseSwipeDeleteOptions) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [0, REVEAL_OFFSET], [0, 1]);
  const [revealed, setRevealed] = useState(false);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const revealedRef = useRef(false);
  const isDeletingRef = useRef(false);
  const gestureRef = useRef<"pending" | "swipe" | "vertical" | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const touchStartTimeRef = useRef(0);
  const touchClaimedRef = useRef(false);

  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  useEffect(() => {
    onSwipeOpenChange?.(revealed || isSwipeActive || isDeletingRef.current);
  }, [revealed, isSwipeActive, onSwipeOpenChange]);

  const snapTo = useCallback(
    (target: number) => {
      animate(x, target, { type: "spring", stiffness: 500, damping: 35 });
    },
    [x],
  );

  const canSwipe = useCallback(
    () => enabled && (isActive || touchClaimedRef.current),
    [enabled, isActive],
  );

  useEffect(() => {
    if (!enabled || !isActive) {
      if (x.get() > 0 || revealedRef.current) {
        snapTo(0);
      }
      setRevealed(false);
      revealedRef.current = false;
      setIsSwipeActive(false);
      gestureRef.current = null;
      touchClaimedRef.current = false;
    }
  }, [enabled, isActive, snapTo, x]);

  const completeDelete = useCallback(() => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    onSwipeOpenChange?.(true);
    vibrate(30);
    animate(x, typeof window !== "undefined" ? window.innerWidth : 400, {
      duration: 0.28,
      ease: [0.4, 0, 1, 1],
      onComplete: () => {
        isDeletingRef.current = false;
        onSwipeOpenChange?.(false);
        onDelete();
      },
    });
  }, [onDelete, onSwipeOpenChange, x]);

  const finishSwipe = useCallback(
    (position: number) => {
      if (!enabled || isDeletingRef.current) return;

      if (revealedRef.current) {
        if (position > DELETE_THRESHOLD) {
          completeDelete();
          return;
        }
        if (position < REVEAL_OFFSET - 16) {
          setRevealed(false);
          revealedRef.current = false;
          snapTo(0);
          onRelease?.();
          return;
        }
        snapTo(REVEAL_OFFSET);
        return;
      }

      if (position > 40) {
        setRevealed(true);
        revealedRef.current = true;
        vibrate(20);
        snapTo(REVEAL_OFFSET);
        return;
      }

      snapTo(0);
      onRelease?.();
    },
    [enabled, onRelease, snapTo, completeDelete],
  );

  const engageSwipe = useCallback(() => {
    onSwipeOpenChange?.(true);
    setIsSwipeActive(true);
  }, [onSwipeOpenChange]);

  const shouldDeferForDrag = useCallback((dx: number, dy: number) => {
    const elapsed = Date.now() - touchStartTimeRef.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const horizontalIntent =
      absDx >= GESTURE.HORIZONTAL_SWIPE_PX && absDx > absDy * 1.4;

    if (horizontalIntent) return false;
    if (elapsed < dragHoldDelayMs + 50) return true;
    return absDy > absDx;
  }, [dragHoldDelayMs]);

  const updateGesture = useCallback(
    (clientX: number, clientY: number) => {
      if (!canSwipe() || gestureRef.current === "vertical") return false;

      const dx = clientX - startRef.current.x;
      const dy = clientY - startRef.current.y;

      if (gestureRef.current === "pending") {
        if (Math.abs(dx) < SWIPE_START_PX && Math.abs(dy) < SWIPE_START_PX) return false;

        if (shouldDeferForDrag(dx, dy)) return false;

        if (Math.abs(dy) > Math.abs(dx) && !revealedRef.current) {
          gestureRef.current = "vertical";
          return false;
        }

        gestureRef.current = "swipe";
        engageSwipe();
      }

      if (gestureRef.current === "swipe") {
        const target = revealedRef.current
          ? Math.max(0, Math.min(REVEAL_OFFSET + dx, 300))
          : Math.max(0, Math.min(dx, 300));
        x.set(target);
        return true;
      }

      return false;
    },
    [canSwipe, engageSwipe, shouldDeferForDrag, x],
  );

  const endGesture = useCallback(() => {
    if (!enabled) return;

    if (gestureRef.current === "swipe") {
      finishSwipe(x.get());
    }

    gestureRef.current = null;
    touchClaimedRef.current = false;
    setIsSwipeActive(false);
  }, [enabled, finishSwipe, x]);

  const isInteractiveTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    Boolean(target.closest("[data-no-swipe],[data-no-drag]"));

  const captureHandlers = {
    onTouchStartCapture: (event: React.TouchEvent) => {
      if (!enabled || isInteractiveTarget(event.target)) return;

      const touch = event.touches[0];
      if (!touch) return;

      onActivate();
      touchClaimedRef.current = true;
      touchStartTimeRef.current = Date.now();
      gestureRef.current = "pending";
      startRef.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchMoveCapture: (event: React.TouchEvent) => {
      if (!enabled) return;
      if (gestureRef.current === null && isInteractiveTarget(event.target)) return;
      const touch = event.touches[0];
      if (!touch) return;

      const isSwipe = updateGesture(touch.clientX, touch.clientY);

      if (isSwipe) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
    onTouchEndCapture: (event: React.TouchEvent) => {
      if (!enabled) return;
      if (gestureRef.current === null && isInteractiveTarget(event.target)) return;
      if (gestureRef.current === "swipe") {
        event.stopPropagation();
        event.preventDefault();
      }
      endGesture();
    },
    onTouchCancelCapture: (event: React.TouchEvent) => {
      if (!enabled) return;
      if (gestureRef.current === null && isInteractiveTarget(event.target)) return;
      if (gestureRef.current === "swipe") {
        event.stopPropagation();
        event.preventDefault();
      }
      endGesture();
    },
  };

  return {
    x,
    deleteOpacity,
    isSwipeActive,
    revealed,
    captureHandlers,
  };
}
