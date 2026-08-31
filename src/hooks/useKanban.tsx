import { DragEvent, ReactNode, useState } from "react";
import { updateTodoStatus } from "../db";
import type { Todo, TodoStatus } from "../types";
import {
  LaneTodoIcon,
  LaneProgressIcon,
  LaneDoneIcon,
} from "../ui";

type TodoHandler = (todo: Todo) => Promise<void>;
type TodoIdHandler = (id: number) => Promise<void>;

interface KanbanLane {
  status: TodoStatus;
  label: string;
  icon: ReactNode;
  color: string;
}

const kanbanLanes: KanbanLane[] = [
  { status: "todo", label: "Zu tun", icon: <LaneTodoIcon />, color: "#7cc3f7" },
  { status: "in_progress", label: "In Bearbeitung", icon: <LaneProgressIcon />, color: "#ffd43b" },
  { status: "done", label: "Erledigt", icon: <LaneDoneIcon />, color: "#6fcf7f" },
];

export function useKanban(
  handleToggle: TodoHandler,
  handleDelete: TodoIdHandler,
  setTodos: (updater: (prev: Todo[]) => Todo[]) => void,
) {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [draggedTodoId, setDraggedTodoId] = useState<number | null>(null);
  const [dragOverLane, setDragOverLane] = useState<TodoStatus | null>(null);

  async function handleDropOnLane(todoId: number, targetStatus: TodoStatus) {
    try {
      const updated = await updateTodoStatus(todoId, targetStatus);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      console.log(`drag: Aufgabe ${todoId} nach "${targetStatus}" verschoben`);
    } catch (err) {
      console.error(`drag: Verschieben von Aufgabe ${todoId} fehlgeschlagen:`, String(err));
    } finally {
      setDraggedTodoId(null);
      setDragOverLane(null);
    }
  }

  function handleDragStart(e: DragEvent, todoId: number) {
    setDraggedTodoId(todoId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(todoId));
    console.log(`drag: dragstart für Aufgabe ${todoId}`);
  }

  function handleChildDragStart(e: DragEvent) {
    e.stopPropagation();
  }

  function handleLaneDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleLaneDragLeave(e: DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverLane(null);
  }

  function handleLaneDrop(e: DragEvent, targetStatus: TodoStatus) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    const todoId = Number(raw);
    console.log(`drag: drop auf "${targetStatus}", dataTransfer="${raw}"`);
    if (todoId) {
      handleDropOnLane(todoId, targetStatus);
    } else {
      console.warn(`drag: drop ohne verwertbare Aufgaben-ID (dataTransfer="${raw}")`);
    }
  }

  function toggleViewMode() {
    setViewMode((v) => (v === "list" ? "kanban" : "list"));
  }

  return {
    viewMode,
    draggedTodoId,
    dragOverLane,
    setDragOverLane,
    kanbanLanes,
    handleToggle,
    handleDelete,
    handleDropOnLane,
    handleDragStart,
    handleChildDragStart,
    handleLaneDragOver,
    handleLaneDragLeave,
    handleLaneDrop,
    toggleViewMode,
  };
}
