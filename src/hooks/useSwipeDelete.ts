"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";
import { vibrate } from "@/lib/utils";

const REVEAL_OFFSET = 72;
const DELETE_THRESHOLD = 140;
const SWIPE_LOCK_PX = 10;

type UseSwipeDeleteOptions = {
  enabled: boolean;
  onDelete: () => void;
};

export function useSwipeDelete({ enabled, onDelete }: UseSwipeDeleteOptions) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [0, REVEAL_OFFSET], [0, 1]);
  const [revealed, setRevealed] = useState(false);
  const isDeletingRef = useRef(false);
  const gestureRef = useRef<"pending" | "swipe" | "vertical" | null>(null);
  const startRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      setRevealed(false);
      x.set(0);
      gestureRef.current = null;
    }
  }, [enabled, x]);

  const snapTo = useCallback(
    (target: number) => {
      animate(x, target, { type: "spring", stiffness: 500, damping: 35 });
    },
    [x],
  );

  const completeDelete = useCallback(() => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    vibrate(30);
    animate(x, typeof window !== "undefined" ? window.innerWidth : 400, {
      duration: 0.28,
      ease: [0.4, 0, 1, 1],
      onComplete: onDelete,
    });
  }, [onDelete, x]);

  const finishSwipe = useCallback(
    (position: number) => {
      if (!enabled || isDeletingRef.current) return;

      if (revealed) {
        if (position > DELETE_THRESHOLD) {
          completeDelete();
          return;
        }
        if (position < REVEAL_OFFSET - 20) {
          setRevealed(false);
          snapTo(0);
          return;
        }
        snapTo(REVEAL_OFFSET);
        return;
      }

      if (position > 40) {
        setRevealed(true);
        vibrate(20);
        snapTo(REVEAL_OFFSET);
        return;
      }

      snapTo(0);
    },
    [enabled, revealed, snapTo, completeDelete],
  );

  const isSwipeBlocking = useCallback(() => gestureRef.current === "swipe", []);

  const updateGesture = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || gestureRef.current === "vertical") return false;

      const dx = clientX - startRef.current.x;
      const dy = clientY - startRef.current.y;

      if (gestureRef.current === "pending") {
        if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return false;

        if (Math.abs(dx) > Math.abs(dy)) {
          gestureRef.current = "swipe";
        } else {
          gestureRef.current = "vertical";
          return false;
        }
      }

      if (gestureRef.current === "swipe" && dx > 0) {
        const base = revealed ? REVEAL_OFFSET : 0;
        x.set(Math.min(base + dx, 300));
        return true;
      }

      return false;
    },
    [enabled, revealed, x],
  );

  const captureHandlers = {
    onTouchStartCapture: (event: React.TouchEvent) => {
      if (!enabled) return;
      const touch = event.touches[0];
      if (!touch) return;
      gestureRef.current = "pending";
      startRef.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchMoveCapture: (event: React.TouchEvent) => {
      if (!enabled) return;
      const touch = event.touches[0];
      if (!touch) return;
      const blocking = updateGesture(touch.clientX, touch.clientY);
      if (blocking) {
        event.stopPropagation();
      }
    },
    onTouchEndCapture: () => {
      if (!enabled) return;
      if (gestureRef.current === "swipe") {
        finishSwipe(x.get());
      }
      gestureRef.current = null;
    },
    onTouchCancelCapture: () => {
      if (!enabled) return;
      if (gestureRef.current === "swipe") {
        finishSwipe(x.get());
      }
      gestureRef.current = null;
    },
  };

  return {
    x,
    deleteOpacity,
    isSwipeBlocking,
    captureHandlers,
  };
}
