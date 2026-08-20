'use client';

import { useCallback, useRef, useState } from 'react';

import type { Task } from '@/shared/domain/models';
import type { WorkflowState } from '@/shared/domain/workflow';

const DRAG_MIME = 'application/x-pyramid-task';

export interface BoardDrag {
  draggingId: string | null;
  hoveredColumn: WorkflowState | null;
  onCardDragStart: (event: React.DragEvent, task: Task) => void;
  onCardDragEnd: () => void;
  onColumnDragOver: (event: React.DragEvent, state: WorkflowState) => void;
  onColumnDragLeave: (state: WorkflowState) => void;
  onColumnDrop: (event: React.DragEvent, state: WorkflowState, cards: Task[]) => void;
  /** Card the pointer is currently above; the drop lands before it. */
  onCardDragOver: (event: React.DragEvent, taskId: string) => void;
}

/**
 * Drag-and-drop for the board, on the native HTML drag API.
 *
 * No dependency: the interaction is a card, a column, and an index, and the
 * platform already models all three. What the hook adds is the bookkeeping —
 * which card is in flight, which column is under the pointer, and where in
 * that column the drop should land — plus emitting the destination column's
 * complete new order so the server write can be idempotent.
 */
export function useBoardDrag(
  onReorder: (state: WorkflowState, orderedIds: string[]) => void | Promise<void>,
): BoardDrag {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<WorkflowState | null>(null);
  const dropBeforeId = useRef<string | null>(null);

  const onCardDragStart = useCallback((event: React.DragEvent, task: Task) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(DRAG_MIME, task.id);
    // Some browsers refuse a drag without text/plain on the payload.
    event.dataTransfer.setData('text/plain', task.title);
    setDraggingId(task.id);
  }, []);

  const onCardDragEnd = useCallback(() => {
    setDraggingId(null);
    setHoveredColumn(null);
    dropBeforeId.current = null;
  }, []);

  const onColumnDragOver = useCallback((event: React.DragEvent, state: WorkflowState) => {
    // Preventing the default is what marks this element as a valid drop target.
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setHoveredColumn(state);
  }, []);

  const onColumnDragLeave = useCallback((state: WorkflowState) => {
    setHoveredColumn((current) => (current === state ? null : current));
  }, []);

  const onCardDragOver = useCallback((event: React.DragEvent, taskId: string) => {
    event.preventDefault();
    event.stopPropagation();

    // Above the midpoint drops before this card, below it drops after.
    const bounds = event.currentTarget.getBoundingClientRect();
    const isTopHalf = event.clientY < bounds.top + bounds.height / 2;
    dropBeforeId.current = isTopHalf ? taskId : null;
  }, []);

  const onColumnDrop = useCallback(
    (event: React.DragEvent, state: WorkflowState, cards: Task[]) => {
      event.preventDefault();

      const movedId = event.dataTransfer.getData(DRAG_MIME) || draggingId;
      onCardDragEnd();
      if (!movedId) return;

      const remaining = cards.filter((card) => card.id !== movedId).map((card) => card.id);
      const anchor = dropBeforeId.current;
      const insertAt = anchor && anchor !== movedId ? remaining.indexOf(anchor) : -1;

      const ordered = [...remaining];
      ordered.splice(insertAt === -1 ? ordered.length : insertAt, 0, movedId);

      // A drop that changes nothing should not cost a round-trip.
      const unchanged =
        ordered.length === cards.length && ordered.every((id, index) => cards[index]?.id === id);
      if (unchanged) return;

      void onReorder(state, ordered);
    },
    [draggingId, onCardDragEnd, onReorder],
  );

  return {
    draggingId,
    hoveredColumn,
    onCardDragStart,
    onCardDragEnd,
    onColumnDragOver,
    onColumnDragLeave,
    onColumnDrop,
    onCardDragOver,
  };
}
