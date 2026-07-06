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

  const onSwipePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled) return;
      gestureRef.current = "pending";
      startRef.current = { x: event.clientX, y: event.clientY };
    },
    [enabled],
  );

  const onSwipePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled || gestureRef.current === "vertical") return;

      const dx = event.clientX - startRef.current.x;
      const dy = event.clientY - startRef.current.y;

      if (gestureRef.current === "pending") {
        if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return;

        if (Math.abs(dx) > Math.abs(dy)) {
          gestureRef.current = "swipe";
        } else {
          gestureRef.current = "vertical";
          return;
        }
      }

      if (gestureRef.current === "swipe" && dx > 0) {
        const base = revealed ? REVEAL_OFFSET : 0;
        x.set(Math.min(base + dx, 300));
      }
    },
    [enabled, revealed, x],
  );

  const onSwipePointerUp = useCallback(() => {
    if (!enabled) return;

    if (gestureRef.current === "swipe") {
      finishSwipe(x.get());
    }

    gestureRef.current = null;
  }, [enabled, finishSwipe, x]);

  return {
    x,
    deleteOpacity,
    isSwipeBlocking,
    swipeHandlers: {
      onPointerDown: onSwipePointerDown,
      onPointerMove: onSwipePointerMove,
      onPointerUp: onSwipePointerUp,
      onPointerCancel: onSwipePointerUp,
    },
  };
}

type PointerHandler = (event: React.PointerEvent) => void;

export function mergePointerListeners(
  sortableListeners: Record<string, Function> | undefined,
  swipeHandlers: {
    onPointerDown: PointerHandler;
    onPointerMove: PointerHandler;
    onPointerUp: PointerHandler;
    onPointerCancel: PointerHandler;
  },
  isSwipeBlocking: () => boolean,
) {
  const chain = (key: keyof typeof swipeHandlers): PointerHandler => {
    return (event) => {
      swipeHandlers[key](event);
      if ((key === "onPointerMove" || key === "onPointerUp" || key === "onPointerCancel") && isSwipeBlocking()) {
        return;
      }
      sortableListeners?.[key]?.(event as React.PointerEvent);
    };
  };

  return {
    onPointerDown: chain("onPointerDown"),
    onPointerMove: chain("onPointerMove"),
    onPointerUp: chain("onPointerUp"),
    onPointerCancel: chain("onPointerCancel"),
  };
}
