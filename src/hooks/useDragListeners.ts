"use client";

import { useMemo, type RefObject } from "react";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";

type ListenerEvent = { pointerType?: string };

export function useDragListeners(
  listeners: DraggableSyntheticListeners | undefined,
  blockedRef: RefObject<boolean>,
) {
  return useMemo(() => {
    if (!listeners) return {};

    const guard = (handler: ((event: ListenerEvent) => void) | undefined) => {
      if (!handler) return undefined;
      return (event: ListenerEvent) => {
        if (blockedRef.current) return;
        if (event.pointerType === "touch") return;
        handler(event);
      };
    };

    return {
      ...listeners,
      onPointerDown: guard(
        listeners.onPointerDown as ((event: ListenerEvent) => void) | undefined,
      ),
      onMouseDown: guard(
        listeners.onMouseDown as ((event: ListenerEvent) => void) | undefined,
      ),
      onTouchStart: (event: ListenerEvent) => {
        if (blockedRef.current) return;
        listeners.onTouchStart?.(event);
      },
    };
  }, [listeners, blockedRef]);
}
