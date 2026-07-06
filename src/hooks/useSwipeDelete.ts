"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { vibrate } from "@/lib/utils";

const REVEAL_OFFSET = 72;
const DELETE_THRESHOLD = 140;
const SWIPE_START_PX = 10;

type UseSwipeDeleteOptions = {
  enabled: boolean;
  onDelete: () => void;
  onEngage?: () => void;
  onRelease?: () => void;
};

export function useSwipeDelete({ enabled, onDelete, onEngage, onRelease }: UseSwipeDeleteOptions) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [0, REVEAL_OFFSET], [0, 1]);
  const [revealed, setRevealed] = useState(false);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const revealedRef = useRef(false);
  const isDeletingRef = useRef(false);
  const scrollLockedRef = useRef(false);
  const gestureRef = useRef<"pending" | "swipe" | "vertical" | null>(null);
  const startRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  const releaseScroll = useCallback(() => {
    if (scrollLockedRef.current) {
      scrollLockedRef.current = false;
      unlockScroll();
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setRevealed(false);
      revealedRef.current = false;
      setIsSwipeActive(false);
      x.set(0);
      gestureRef.current = null;
      releaseScroll();
    }
  }, [enabled, releaseScroll, x]);

  useEffect(() => () => releaseScroll(), [releaseScroll]);

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

      if (revealedRef.current) {
        if (position > DELETE_THRESHOLD) {
          completeDelete();
          return;
        }
        if (position < REVEAL_OFFSET - 16) {
          setRevealed(false);
          revealedRef.current = false;
          snapTo(0);
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
    },
    [enabled, snapTo, completeDelete],
  );

  const engageSwipe = useCallback(() => {
    if (!scrollLockedRef.current) {
      scrollLockedRef.current = true;
      lockScroll();
    }
    onEngage?.();
    setIsSwipeActive(true);
  }, [onEngage]);

  const updateGesture = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || gestureRef.current === "vertical") return false;

      const dx = clientX - startRef.current.x;
      const dy = clientY - startRef.current.y;

      if (gestureRef.current === "pending") {
        if (Math.abs(dx) < SWIPE_START_PX && Math.abs(dy) < SWIPE_START_PX) return false;

        if (Math.abs(dy) > Math.abs(dx)) {
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
    [enabled, engageSwipe, x],
  );

  const endGesture = useCallback(() => {
    if (!enabled) return;

    if (gestureRef.current === "swipe") {
      finishSwipe(x.get());
    }

    gestureRef.current = null;
    setIsSwipeActive(false);
    onRelease?.();
    releaseScroll();
  }, [enabled, finishSwipe, onRelease, releaseScroll, x]);

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

      const isSwipe = updateGesture(touch.clientX, touch.clientY);

      if (isSwipe) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
    onTouchEndCapture: (event: React.TouchEvent) => {
      if (!enabled) return;
      if (gestureRef.current === "swipe") {
        event.stopPropagation();
        event.preventDefault();
      }
      endGesture();
    },
    onTouchCancelCapture: (event: React.TouchEvent) => {
      if (!enabled) return;
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
