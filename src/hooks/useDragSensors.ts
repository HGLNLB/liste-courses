"use client";

import { MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { GESTURE } from "@/lib/gestures";

export function useDragSensors(delayMs: number) {
  return useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: delayMs,
        tolerance: GESTURE.MOVE_TOLERANCE_PX,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
  );
}
