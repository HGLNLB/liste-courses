"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { vibrate } from "@/lib/utils";

const REVEAL_OFFSET = 72;
const DELETE_THRESHOLD = 140;

type SwipeableDeleteProps = {
  enabled: boolean;
  onDelete: () => void;
  onSwipeOpenChange?: (open: boolean) => void;
  rounded?: boolean;
  children: React.ReactNode;
};

export function SwipeableDelete({
  enabled,
  onDelete,
  onSwipeOpenChange,
  rounded = false,
  children,
}: SwipeableDeleteProps) {
  const x = useMotionValue(0);
  const [revealed, setRevealed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDeletingRef = useRef(false);
  const revealedRef = useRef(false);
  const revealedAtDragStartRef = useRef(false);

  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  const notifyOpen = useCallback(
    (open: boolean) => {
      onSwipeOpenChange?.(open);
    },
    [onSwipeOpenChange],
  );

  useEffect(() => {
    notifyOpen(revealed || isDragging || isDeletingRef.current);
  }, [revealed, isDragging, notifyOpen]);

  useEffect(() => {
    if (!enabled) {
      setRevealed(false);
      revealedRef.current = false;
      setIsDragging(false);
      x.set(0);
      notifyOpen(false);
    }
  }, [enabled, notifyOpen, x]);

  const snapTo = useCallback(
    (target: number) => {
      animate(x, target, { type: "spring", stiffness: 500, damping: 35 });
    },
    [x],
  );

  const handleDelete = useCallback(() => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    notifyOpen(true);
    vibrate(30);
    animate(x, typeof window !== "undefined" ? window.innerWidth : 400, {
      duration: 0.28,
      ease: [0.4, 0, 1, 1],
      onComplete: () => {
        isDeletingRef.current = false;
        notifyOpen(false);
        onDelete();
      },
    });
  }, [notifyOpen, onDelete, x]);

  const handleDragStart = useCallback(() => {
    revealedAtDragStartRef.current = revealedRef.current;
    notifyOpen(true);
    setIsDragging(true);
  }, [notifyOpen]);

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      notifyOpen(true);

      if (revealedAtDragStartRef.current) return;

      if (!revealedRef.current && info.offset.x >= REVEAL_OFFSET - 4) {
        setRevealed(true);
        revealedRef.current = true;
        vibrate(20);
      }
    },
    [notifyOpen],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (!enabled || isDeletingRef.current) return;

      setIsDragging(false);

      const offsetX = info.offset.x;
      const velocityX = info.velocity.x;
      const position = x.get();

      if (revealedAtDragStartRef.current) {
        if (position > DELETE_THRESHOLD || velocityX > 400) {
          handleDelete();
          return;
        }
        if (position < REVEAL_OFFSET - 16 || offsetX < -20 || velocityX < -200) {
          setRevealed(false);
          revealedRef.current = false;
          snapTo(0);
          notifyOpen(false);
          return;
        }
        snapTo(REVEAL_OFFSET);
        return;
      }

      if (offsetX > 40 || velocityX > 300 || position > 40) {
        setRevealed(true);
        revealedRef.current = true;
        vibrate(20);
        snapTo(REVEAL_OFFSET);
        return;
      }

      snapTo(0);
      notifyOpen(false);
    },
    [enabled, snapTo, handleDelete, notifyOpen, x],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className={`relative overflow-hidden ${rounded ? "rounded-t-2xl" : ""}`}>
      <div
        className="absolute inset-y-0 left-0 flex w-[72px] items-center bg-[#FF3B30] pl-5"
        aria-hidden="true"
      >
        <span className="text-2xl font-bold text-white">−</span>
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: revealed ? 280 : REVEAL_OFFSET + 20 }}
        dragElastic={revealed ? 0.15 : 0.08}
        style={{ x }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative bg-white"
      >
        {children}
      </motion.div>
    </div>
  );
}
