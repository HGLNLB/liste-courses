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

type DragListenerExtras = {
  onPointerDown?: () => void;
  onPointerUp?: () => void;
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
      extra?.onPointerDown?.();
      call(listeners.onPointerDown as ListenerHandler | undefined, event);
    },
    onPointerUp: (event: React.PointerEvent) => {
      extra?.onPointerUp?.();
      call(listeners.onPointerUp as ListenerHandler | undefined, event);
    },
    onPointerCancel: (event: React.PointerEvent) => {
      extra?.onPointerUp?.();
      call(listeners.onPointerCancel as ListenerHandler | undefined, event);
    },
  };
}
