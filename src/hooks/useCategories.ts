import { FormEvent, useCallback, useState } from "react";
import { addCategory, deleteCategory, updateCategory } from "../db";
import { CATEGORY_COLORS, Category, Todo } from "../types";

export function useCategories(
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>,
  setError: (err: string | null) => void,
  categoryFilter: number | null,
  setCategoryFilter: (v: number | null) => void,
) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryColor, setEditingCategoryColor] = useState("");

  function refreshCategories(cats: Category[]) {
    setCategories(cats);
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const cat = await addCategory(name, newCategoryColor);
      setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName("");
      setNewCategoryColor(CATEGORY_COLORS[(categories.length + 1) % CATEGORY_COLORS.length]);
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  }

  function startEditCategory(cat: Category) {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
    setEditingCategoryColor(cat.color);
  }

  async function commitEditCategory(id: number) {
    const name = editingCategoryName.trim();
    if (!name) return;
    try {
      const updated = await updateCategory(id, name, editingCategoryColor);
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setError(null);
    } catch (err) {
      setError(String(err));
    }
    setEditingCategoryId(null);
  }

  async function handleDeleteCategory(id: number) {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setTodos((prev) => prev.map((t) => (t.category_id === id ? { ...t, category_id: null, category_name: null, category_color: null } : t)));
      if (categoryFilter === id) setCategoryFilter(null);
      setError(null);
    } catch (err) {
      setError(String(err));
    }
  }

  const closeCategoryManager = useCallback(() => {
    setShowCategoryManager(false);
    setEditingCategoryId(null);
  }, []);

  return {
    categories,
    showCategoryManager,
    setShowCategoryManager,
    newCategoryName,
    setNewCategoryName,
    newCategoryColor,
    setNewCategoryColor,
    editingCategoryId,
    editingCategoryName,
    setEditingCategoryName,
    editingCategoryColor,
    setEditingCategoryColor,
    refreshCategories,
    handleAddCategory,
    startEditCategory,
    commitEditCategory,
    handleDeleteCategory,
    closeCategoryManager,
  };
}
