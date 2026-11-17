import { useRef } from 'react';

// Touch keeps native momentum scrolling. Mouse users can drag the same rail;
// pointer capture starts only after movement, preserving ordinary button clicks.
export function useRailDrag(enabled) {
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  return {
    onPointerDown(event) {
      suppressClick.current = false;
      if (!enabled || event.pointerType !== 'mouse' || event.button !== 0)
        return;
      gesture.current = {
        id: event.pointerId,
        startX: event.clientX,
        scrollLeft: event.currentTarget.scrollLeft,
        dragged: false,
      };
    },
    onPointerMove(event) {
      const current = gesture.current;
      if (!enabled || !current || current.id !== event.pointerId) return;
      if (event.buttons !== 1) {
        gesture.current = null;
        return;
      }
      const distance = event.clientX - current.startX;
      if (!current.dragged && Math.abs(distance) < 8) return;
      if (!current.dragged) {
        current.dragged = true;
        suppressClick.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      event.currentTarget.scrollLeft = current.scrollLeft - distance;
    },
    onPointerLeave() {
      // Before capture, an outside release never reaches this rail.
      if (!gesture.current?.dragged) gesture.current = null;
    },
    onPointerUp(event) {
      gesture.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
    },
    onPointerCancel() {
      gesture.current = null;
    },
    onLostPointerCapture() {
      gesture.current = null;
    },
    onClickCapture(event) {
      if (enabled && suppressClick.current && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onDragStart(event) {
      if (enabled) event.preventDefault();
    },
  };
}
