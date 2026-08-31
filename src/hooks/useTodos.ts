import { FormEvent, useState } from "react";
import {
  addTodo,
  deleteTodo,
  toggleTodoDone,
  updateTodoCategory,
  updateTodoDueDate,
  updateTodoPriority,
  updateTodoTitle,
} from "../db";
import { Priority, Todo } from "../types";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [burstId, setBurstId] = useState<number | null>(null);

  function refreshTodos(items: Todo[]) {
    setTodos(items);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    try {
      const dueDate = newDueDate || null;
      const todo = await addTodo(title, newPriority, dueDate, newCategoryId);
      setTodos((prev) => [todo, ...prev]);
      setNewTitle("");
      setNewPriority("medium");
      setNewDueDate("");
      setNewCategoryId(null);
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleToggle(todo: Todo) {
    if (!todo.done) {
      setBurstId(todo.id);
      setTimeout(() => setBurstId(null), 800);
    }
    try {
      const updated = await toggleTodoDone(todo.id, !todo.done);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handlePriorityChange(id: number, priority: Priority) {
    try {
      const updated = await updateTodoPriority(id, priority);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setEditingDueDate(todo.due_date || "");
  }

  async function commitEdit(id: number) {
    const title = editingTitle.trim();
    if (title) {
      try {
        const updated = await updateTodoTitle(id, title);
        setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setError(null);
      } catch (err) {
        setError(String(err));
      }
    }
    try {
      const dueDate = editingDueDate || null;
      const updated = await updateTodoDueDate(id, dueDate);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setError(null);
    } catch (err) {
      setError(String(err));
    }
    setEditingId(null);
  }

  async function handleUpdateTodoCategory(id: number, categoryId: number | null) {
    try {
      const updated = await updateTodoCategory(id, categoryId);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  }

  return {
    todos,
    setTodos: setTodos as React.Dispatch<React.SetStateAction<Todo[]>>,
    newTitle,
    setNewTitle,
    newPriority,
    setNewPriority,
    newDueDate,
    setNewDueDate,
    newCategoryId,
    setNewCategoryId,
    error,
    setError,
    editingId,
    setEditingId,
    editingTitle,
    setEditingTitle,
    editingDueDate,
    setEditingDueDate,
    burstId,
    refreshTodos,
    handleAdd,
    handleToggle,
    handleDelete,
    handlePriorityChange,
    startEdit,
    commitEdit,
    handleUpdateTodoCategory,
  };
}
