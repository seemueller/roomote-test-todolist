import { useState, useMemo } from "react";
import type { Todo } from "../types";

export type DueDateFilter = "all" | "today" | "overdue" | "upcoming" | "none";

export const filterLabels: Record<DueDateFilter, string> = {
  all: "Alle",
  today: "Heute",
  overdue: "Überfällig",
  upcoming: "Künftig",
  none: "Ohne Datum",
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return dueDate === todayStr();
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return dueDate < todayStr();
}

function isDueUpcoming(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = todayStr();
  return dueDate > today;
}

export function useFilters(
  todos: readonly Todo[],
  categoryFilter: number | null,
  setCategoryFilter: (v: number | null) => void,
) {
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "done">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (dueDateFilter === "today" && !isDueToday(todo.due_date)) return false;
      if (dueDateFilter === "overdue" && (!isOverdue(todo.due_date) || todo.done)) return false;
      if (dueDateFilter === "upcoming" && !isDueUpcoming(todo.due_date)) return false;
      if (dueDateFilter === "none" && todo.due_date) return false;
      if (statusFilter === "open" && todo.done) return false;
      if (statusFilter === "done" && !todo.done) return false;
      if (categoryFilter !== null && todo.category_id !== categoryFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!todo.title.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [todos, dueDateFilter, statusFilter, categoryFilter, searchQuery]);

  const hasActiveFilter = dueDateFilter !== "all" || statusFilter !== "all" || searchQuery || categoryFilter !== null;

  function clearFilters() {
    setDueDateFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
    setCategoryFilter(null);
  }

  return {
    dueDateFilter,
    setDueDateFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredTodos,
    hasActiveFilter,
    clearFilters,
  };
}

export { isDueToday, isOverdue, isDueUpcoming };
