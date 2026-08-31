import { KeyboardEvent, useCallback, useEffect, useState } from "react";
import { listCategories, listTodos } from "./db";
import { installDebugInterceptor } from "./debug";
import { APP_VERSION, CHANGELOG } from "./version";
import { CustomTitleBar } from "./CustomTitleBar";
import { DebugLogPanel } from "./DebugLogPanel";
import {
  BoardViewIcon,
  CategoryBadge,
  CategorySelect,
  CheckIcon,
  ChevronLeftIcon,
  ColorPicker,
  DueDateBadge,
  FilterChip,
  IconButton,
  InlineEditInput,
  ListViewIcon,
  Modal,
  PencilIcon,
  PlusIcon,
  PrioritySelect,
  TagIcon,
  TrashIcon,
  UpdateIcon,
} from "./ui";
import {
  useTodos,
  useCategories,
  useFilters,
  useKanban,
  useUpdateCheck,
  filterLabels,
  isDueToday,
  isOverdue,
} from "./hooks";
import type { DueDateFilter } from "./hooks";
import "./App.css";

function formatDate(dueDate: string): string {
  const [y, m, d] = dueDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateMidnight = new Date(date);
  dateMidnight.setHours(0, 0, 0, 0);

  if (dateMidnight.getTime() === today.getTime()) return "Heute";
  if (dateMidnight.getTime() === tomorrow.getTime()) return "Morgen";

  return `${d}.${m}.`;
}

function App() {
  const todosHook = useTodos();
  const {
    todos,
    setTodos,
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
  } = todosHook;

  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  const categoriesHook = useCategories(
    setTodos,
    setError,
    categoryFilter,
    setCategoryFilter,
  );
  const {
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
  } = categoriesHook;

  const filtersHook = useFilters(todos, categoryFilter, setCategoryFilter);
  const {
    dueDateFilter,
    setDueDateFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredTodos,
    hasActiveFilter,
    clearFilters,
  } = filtersHook;

  const kanbanHook = useKanban(handleToggle, handleDelete, setTodos);
  const {
    viewMode,
    draggedTodoId,
    dragOverLane,
    setDragOverLane,
    kanbanLanes,
    handleDragStart,
    handleChildDragStart,
    handleLaneDragOver,
    handleLaneDragLeave,
    handleLaneDrop,
    toggleViewMode,
  } = kanbanHook;

  const updateHook = useUpdateCheck();
  const {
    showChangelog,
    setShowChangelog,
    closeChangelog,
    updateAvailable,
    setUpdateAvailable,
    checkingUpdate,
    installingUpdate,
    updateStatus,
    setUpdateStatus,
    triggerCheckUpdate,
    handleInstallUpdate,
  } = updateHook;

  // Debug log panel (Ctrl+Shift+L)
  const [showDebug, setShowDebug] = useState(false);
  const closeDebug = useCallback(() => setShowDebug(false), []);

  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [items, cats] = await Promise.all([
        listTodos(),
        listCategories(),
      ]);
      refreshTodos(items);
      refreshCategories(cats);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    installDebugInterceptor();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "L") {
        e.preventDefault();
        setShowDebug((d) => !d);
      }
    }
    document.addEventListener("keydown", handleKey as any);
    return () => document.removeEventListener("keydown", handleKey as any);
  }, []);

  const remaining = todos.filter((t) => !t.done).length;
  const headerCount = todos.length === 0 ? "Keine Aufgaben" : `${remaining} offen`;

  return (
    <div className="app-shell">
      <CustomTitleBar />

      <main className="app">
        <header className="app-header">
          <h1>TodoList</h1>
          <p className="app-subtitle">{headerCount}</p>
          <button
            type="button"
            className={`view-toggle ${viewMode === "kanban" ? "kanban-active" : ""}`}
            onClick={toggleViewMode}
            aria-label={viewMode === "list" ? "Zum Kanban-Brett wechseln" : "Zur Listenansicht wechseln"}
            title={viewMode === "list" ? "Kanban-Brett" : "Liste"}
          >
            {viewMode === "list" ? <BoardViewIcon /> : <ListViewIcon />}
          </button>
        </header>

        <form className="add-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Was steht an?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.currentTarget.value)}
          />
          <input
            type="date"
            className="date-input"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.currentTarget.value)}
            title="Fälligkeitsdatum (optional)"
          />
          <CategorySelect
            categories={categories}
            value={newCategoryId}
            onValueChange={setNewCategoryId}
            placeholderLabel="Keine Kategorie"
          />
          <PrioritySelect value={newPriority} onValueChange={setNewPriority} aria-label="Priorität" />
          <button type="submit" aria-label="Aufgabe hinzufügen">
            <PlusIcon />
          </button>
        </form>

        {viewMode === "list" && (
          <>
            <div className="filter-bar">
              <div className="filter-row">
                {(Object.keys(filterLabels) as DueDateFilter[]).map((key) => (
                  <FilterChip
                    key={key}
                    active={dueDateFilter === key}
                    onClick={() => setDueDateFilter(key)}
                  >
                    {filterLabels[key]}
                  </FilterChip>
                ))}
                <div className="status-filter">
                  <FilterChip variant="segment" active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
                    Alle
                  </FilterChip>
                  <FilterChip variant="segment" active={statusFilter === "open"} onClick={() => setStatusFilter("open")}>
                    Offen
                  </FilterChip>
                  <FilterChip variant="segment" active={statusFilter === "done"} onClick={() => setStatusFilter("done")}>
                    Erledigt
                  </FilterChip>
                </div>
              </div>
              <div className="filter-row">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Suche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                />
                <CategorySelect
                  className="filter-select"
                  categories={categories}
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                  placeholderLabel="Alle Kategorien"
                />
                <IconButton
                  variant="icon"
                  onClick={() => setShowCategoryManager(true)}
                  aria-label="Kategorien verwalten"
                >
                  <TagIcon />
                  Kategorien
                </IconButton>
              </div>
            </div>

            {hasActiveFilter && (
              <div className="active-filters">
                <span className="filter-label">
                  {filterLabels[dueDateFilter]}
                  {statusFilter !== "all"
                    ? ` • ${statusFilter === "open" ? "Offen" : "Erledigt"}`
                    : ""}
                  {categoryFilter !== null
                    ? ` • ${categories.find((c) => c.id === categoryFilter)?.name || "Kategorie"}`
                    : ""}
                  {searchQuery ? ` • Suche: "${searchQuery}"` : ""}
                </span>
                <button
                  type="button"
                  className="clear-filters"
                  onClick={clearFilters}
                >
                  Zurücksetzen
                </button>
              </div>
            )}
            {error && <p className="error">Fehler: {error}</p>}
            {loading && <p className="muted">Lade Aufgaben …</p>}

            {!loading && todos.length === 0 && !error && (
              <p className="muted">Noch keine Aufgaben. Lege deine erste an — Titel eintippen, Enter drücken.</p>
            )}

            {!loading && hasActiveFilter && filteredTodos.length === 0 && (
              <p className="muted">Keine Aufgaben gefunden. Setz den Filter auf „Alle" zurück.</p>
            )}

            <ul className="todo-list">
              {filteredTodos.map((todo) => {
                const overdue = !todo.done && isOverdue(todo.due_date);
                const today = isDueToday(todo.due_date);

                return (
                  <li
                    key={todo.id}
                    className={[
                      todo.done ? "done" : "",
                      overdue ? "overdue" : "",
                      today && !todo.done ? "due-today" : "",
                      `priority-${todo.priority}`,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <IconButton
                      variant="checkbox"
                      onClick={() => handleToggle(todo)}
                      aria-label={`${todo.title} als erledigt markieren`}
                    >
                      {todo.done && <CheckIcon />}
                    </IconButton>

                    {editingId === todo.id ? (
                      <div className="edit-row">
                        <InlineEditInput
                          value={editingTitle}
                          autoFocus
                          onValueChange={setEditingTitle}
                          onCommit={() => commitEdit(todo.id)}
                          onCancel={() => setEditingId(null)}
                        />
                        <input
                          type="date"
                          className="edit-date-input"
                          value={editingDueDate}
                          onChange={(e) => setEditingDueDate(e.currentTarget.value)}
                          onBlur={() => commitEdit(todo.id)}
                        />
                      </div>
                    ) : (
                      <span className="title" onDoubleClick={() => startEdit(todo)}>
                        {todo.title}
                      </span>
                    )}

                    {editingId !== todo.id && todo.due_date && (
                      <DueDateBadge overdue={overdue} today={today && !todo.done}>
                        {formatDate(todo.due_date)}
                      </DueDateBadge>
                    )}

                    {editingId !== todo.id && (
                      <PrioritySelect
                        variant="inline"
                        value={todo.priority}
                        onValueChange={(priority) => handlePriorityChange(todo.id, priority)}
                        aria-label="Priorität ändern"
                      />
                    )}

                    {todo.category_name && (
                      <CategoryBadge color={todo.category_color}>{todo.category_name}</CategoryBadge>
                    )}

                    <CategorySelect
                      className="todo-select"
                      categories={categories}
                      value={todo.category_id}
                      onValueChange={(categoryId) => handleUpdateTodoCategory(todo.id, categoryId)}
                      placeholderLabel="—"
                      aria-label="Kategorie auswählen"
                    />

                    <div className="todo-actions">
                      <IconButton variant="action" onClick={() => startEdit(todo)} aria-label="Bearbeiten">
                        <PencilIcon />
                      </IconButton>
                      <IconButton
                        variant="action"
                        danger
                        onClick={() => handleDelete(todo.id)}
                        aria-label="Löschen"
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>

                    {burstId === todo.id && (
                      <span className="done-flash" aria-hidden="true">
                        <CheckIcon />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {!loading && todos.length > 0 && (
              <p className="footer">
                {hasActiveFilter
                  ? `${filteredTodos.length} von ${todos.length} Aufgabe(n) angezeigt`
                  : remaining === 0
                    ? "Alles erledigt!"
                    : `${remaining} von ${todos.length} Aufgabe(n) offen`}
              </p>
            )}
          </>
        )}

        {viewMode === "kanban" && (
          <div className="kanban-wrapper">
            {kanbanLanes.map((lane) => {
              const laneTodos = todos
                .filter((t) => t.status === lane.status)
                .sort((a, b) => {
                  const priorityOrder = { high: 0, medium: 1, low: 2 };
                  const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                  if (pDiff !== 0) return pDiff;
                  return b.created_at.localeCompare(a.created_at);
                });

              return (
                <div
                  key={lane.status}
                  className={`kanban-lane ${dragOverLane === lane.status ? "drag-over" : ""}`}
                  onDragOver={(e) => {
                    handleLaneDragOver(e);
                    setDragOverLane(lane.status);
                  }}
                  onDragLeave={handleLaneDragLeave}
                  onDrop={(e) => handleLaneDrop(e, lane.status)}
                >
                  <div className="kanban-lane-header" style={{ backgroundColor: lane.color }}>
                    <span className="kanban-lane-icon">{lane.icon}</span>
                    <h3>{lane.label}</h3>
                    <span className="kanban-count">{laneTodos.length}</span>
                  </div>

                  <div className="kanban-lane-body">
                    {laneTodos.map((todo) => {
                      const overdue = !todo.done && isOverdue(todo.due_date);
                      const today = isDueToday(todo.due_date);

                      return (
                        <div
                          key={todo.id}
                          className={`kanban-card priority-${todo.priority} ${todo.done ? "done" : ""} ${overdue ? "overdue" : ""} ${today && !todo.done ? "due-today" : ""} ${
                            draggedTodoId === todo.id ? "dragging" : ""
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, todo.id)}
                        >
                          <span className="kanban-card-title">{todo.title}</span>

                          <div className="kanban-card-meta">
                            {todo.due_date && (
                              <DueDateBadge variant="kanban" overdue={overdue} today={today && !todo.done}>
                                {formatDate(todo.due_date)}
                              </DueDateBadge>
                            )}
                            {todo.category_name && (
                              <CategoryBadge variant="kanban" color={todo.category_color}>
                                {todo.category_name}
                              </CategoryBadge>
                            )}
                          </div>

                          <div className="kanban-card-actions">
                            <IconButton
                              variant="kanban"
                              onDragStart={handleChildDragStart}
                              onClick={() => handleToggle(todo)}
                              aria-label={`${todo.title} Status ändern`}
                              title={todo.status === "done" ? 'Zurück zu "Zu tun"' : "Als erledigt markieren"}
                            >
                              {todo.status === "done" ? <ChevronLeftIcon /> : <CheckIcon />}
                            </IconButton>
                            <IconButton
                              variant="kanban"
                              danger
                              onDragStart={handleChildDragStart}
                              onClick={() => handleDelete(todo.id)}
                              aria-label="Löschen"
                            >
                              <TrashIcon />
                            </IconButton>
                          </div>
                        </div>
                      );
                    })}

                    {laneTodos.length === 0 && (
                      <div className="kanban-lane-empty">
                        Keine Aufgaben
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <footer className="app-footer">
          <button
            type="button"
            className="update-btn"
            onClick={triggerCheckUpdate}
            disabled={checkingUpdate}
            aria-label="Nach Updates suchen"
          >
            <UpdateIcon />
            {checkingUpdate ? "Prüfe..." : "Update"}
          </button>
          <span className="version">v{APP_VERSION}</span>
          <button
            type="button"
            className="debug-btn"
            onClick={() => setShowDebug(true)}
            aria-label="Debug Logs"
          >
            Debug
          </button>
          <button
            type="button"
            className="changelog-btn"
            onClick={() => setShowChangelog(true)}
          >
            Changelog
          </button>
        </footer>
      </main>

      {/* Changelog Modal */}
      {showChangelog && (
        <Modal variant="changelog" title="Changelog" onClose={closeChangelog} closeLabel="Schließen">
          <div className="changelog-body">
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="changelog-entry">
                <div className="changelog-version">
                  <span className="version-badge">{entry.version}</span>
                  <span className="version-date">{entry.date}</span>
                </div>
                <ul>
                  {entry.changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Update Modal */}
      {updateAvailable && (
        <Modal variant="changelog" title="Update verfügbar" onClose={() => setUpdateAvailable(null)} closeLabel="Schließen">
          <div className="update-modal-body">
            <p>Version <strong>{updateAvailable}</strong> ist verfügbar.</p>
            <button
              type="button"
              className="update-install-btn"
              onClick={handleInstallUpdate}
              disabled={installingUpdate}
            >
              {installingUpdate ? "Wird installiert..." : "Herunterladen & installieren"}
            </button>
          </div>
        </Modal>
      )}

      {/* Rueckmeldung der Update-Pruefung */}
      {updateStatus && (
        <Modal
          variant="changelog"
          title={updateStatus.kind === "error" ? "Update fehlgeschlagen" : "Update"}
          onClose={() => setUpdateStatus(null)}
          closeLabel="Schließen"
        >
          <div className="update-modal-body">
            <p className={updateStatus.kind === "error" ? "update-status-error" : undefined}>
              {updateStatus.text}
            </p>
          </div>
        </Modal>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <Modal variant="category" title="Kategorien" onClose={closeCategoryManager} closeLabel="Schließen">
          <form className="add-category-form" onSubmit={handleAddCategory}>
            <input
              type="text"
              placeholder="Neue Kategorie..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.currentTarget.value)}
            />
            <ColorPicker
              value={newCategoryColor}
              onSelect={setNewCategoryColor}
              swatchLabel={(color) => `Farbe ${color} auswählen`}
            />
            <button type="submit">Hinzufügen</button>
          </form>

          <ul className="category-list">
            {categories.map((cat) => (
              <li key={cat.id} className="category-item">
                {editingCategoryId === cat.id ? (
                  <>
                    <InlineEditInput
                      value={editingCategoryName}
                      onValueChange={setEditingCategoryName}
                      onCommit={() => commitEditCategory(cat.id)}
                      onCancel={() => closeCategoryManager()}
                    />
                    <ColorPicker
                      inline
                      value={editingCategoryColor}
                      onSelect={setEditingCategoryColor}
                      swatchLabel={(color) => `Farbe ${color} auswählen`}
                    />
                  </>
                ) : (
                  <>
                    <span
                      className="category-color-dot"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="category-name">{cat.name}</span>
                  </>
                )}

                <div className="category-actions">
                  {editingCategoryId === cat.id ? (
                    <IconButton
                      variant="icon"
                      onClick={() => commitEditCategory(cat.id)}
                      aria-label="Speichern"
                    >
                      <CheckIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      variant="icon"
                      onClick={() => startEditCategory(cat)}
                      aria-label="Bearbeiten"
                    >
                      <PencilIcon />
                    </IconButton>
                  )}
                  <IconButton
                    variant="icon"
                    danger
                    onClick={() => handleDeleteCategory(cat.id)}
                    aria-label="Löschen"
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {showDebug && <DebugLogPanel onClose={closeDebug} />}
    </div>
  );
}

export default App;
