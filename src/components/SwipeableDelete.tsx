"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { vibrate } from "@/lib/utils";

const REVEAL_OFFSET = 72;
const DELETE_THRESHOLD = 140;

type SwipeableDeleteProps = {
  enabled: boolean;
  onDelete: () => void;
  rounded?: boolean;
  children: React.ReactNode;
};

export function SwipeableDelete({
  enabled,
  onDelete,
  rounded = false,
  children,
}: SwipeableDeleteProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [0, REVEAL_OFFSET], [0, 1]);
  const [revealed, setRevealed] = useState(false);
  const isDeletingRef = useRef(false);
  const scrollLockedRef = useRef(false);

  const releaseScroll = useCallback(() => {
    if (scrollLockedRef.current) {
      scrollLockedRef.current = false;
      unlockScroll();
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setRevealed(false);
      x.set(0);
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

  const handleDelete = useCallback(() => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    vibrate(30);
    animate(x, typeof window !== "undefined" ? window.innerWidth : 400, {
      duration: 0.28,
      ease: [0.4, 0, 1, 1],
      onComplete: () => {
        releaseScroll();
        onDelete();
      },
    });
  }, [onDelete, releaseScroll, x]);

  const handleDragStart = useCallback(() => {
    if (!scrollLockedRef.current) {
      scrollLockedRef.current = true;
      lockScroll();
    }
  }, []);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (!enabled || isDeletingRef.current) return;

      const offsetX = info.offset.x;
      const velocityX = info.velocity.x;

      if (revealed) {
        const position = x.get();
        if (position > DELETE_THRESHOLD || velocityX > 400) {
          handleDelete();
          return;
        }
        if (position < REVEAL_OFFSET - 16 || offsetX < -20 || velocityX < -200) {
          setRevealed(false);
          snapTo(0);
          releaseScroll();
          return;
        }
        snapTo(REVEAL_OFFSET);
        releaseScroll();
        return;
      }

      if (offsetX > 40 || velocityX > 300) {
        setRevealed(true);
        vibrate(20);
        snapTo(REVEAL_OFFSET);
        releaseScroll();
        return;
      }

      snapTo(0);
      releaseScroll();
    },
    [enabled, revealed, snapTo, handleDelete, releaseScroll, x],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className={`relative overflow-hidden ${rounded ? "rounded-2xl" : ""}`}>
      <motion.div
        className="absolute inset-0 flex items-center bg-[#FF3B30] pl-5"
        style={{ opacity: deleteOpacity }}
        aria-hidden="true"
      >
        <span className="text-2xl font-bold text-white">−</span>
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: revealed ? 280 : REVEAL_OFFSET + 20 }}
        dragElastic={revealed ? 0.15 : 0.08}
        style={{ x }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="relative touch-none"
      >
        {children}
      </motion.div>
    </div>
  );
}
