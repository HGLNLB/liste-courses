import type { DropAnimation, DraggableSyntheticListeners } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { defaultDropAnimationSideEffects } from "@dnd-kit/core";

export const sortableDropAnimation: DropAnimation = {
  duration: 260,
  easing: "cubic-bezier(0.34, 1.45, 0.64, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
};

export type DragListenerExtras = {
  onPointerDown?: (event: React.PointerEvent) => void;
  onPointerUp?: (event: React.PointerEvent) => void;
  onPointerMove?: (event: React.PointerEvent) => void;
  onTouchStart?: (event: React.TouchEvent) => void;
  onTouchEnd?: (event: React.TouchEvent) => void;
  onTouchMove?: (event: React.TouchEvent) => void;
};

type ListenerHandler = (event: unknown) => void;

export function mergeDragListeners(
  listeners: DraggableSyntheticListeners | undefined,
  extra?: DragListenerExtras,
): SyntheticListenerMap {
  if (!listeners) return {};

  const call = (handler: ListenerHandler | undefined, event: unknown) => {
    handler?.(event);
  };

  return {
    ...listeners,
    onPointerDown: (event: React.PointerEvent) => {
      extra?.onPointerDown?.(event);
      call(listeners.onPointerDown as ListenerHandler | undefined, event);
    },
    onPointerMove: (event: React.PointerEvent) => {
      extra?.onPointerMove?.(event);
      call(listeners.onPointerMove as ListenerHandler | undefined, event);
    },
    onPointerUp: (event: React.PointerEvent) => {
      extra?.onPointerUp?.(event);
      call(listeners.onPointerUp as ListenerHandler | undefined, event);
    },
    onPointerCancel: (event: React.PointerEvent) => {
      extra?.onPointerUp?.(event);
      call(listeners.onPointerCancel as ListenerHandler | undefined, event);
    },
    onTouchStart: (event: React.TouchEvent) => {
      extra?.onTouchStart?.(event);
      call(listeners.onTouchStart as ListenerHandler | undefined, event);
    },
    onTouchMove: (event: React.TouchEvent) => {
      extra?.onTouchMove?.(event);
      call(listeners.onTouchMove as ListenerHandler | undefined, event);
    },
    onTouchEnd: (event: React.TouchEvent) => {
      extra?.onTouchEnd?.(event);
      call(listeners.onTouchEnd as ListenerHandler | undefined, event);
    },
    onTouchCancel: (event: React.TouchEvent) => {
      extra?.onTouchEnd?.(event);
      call(listeners.onTouchCancel as ListenerHandler | undefined, event);
    },
  };
}
