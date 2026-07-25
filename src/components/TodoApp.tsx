import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { DragEvent } from 'react';
import type { Todo, Category, TodoList } from '../lib/todo-types';
import { generateId, getDueDateStatus, formatDueDate } from '../lib/todo-types';

interface TodoAppProps {
  initialListId?: string;
  sharedList?: TodoList | null;
  templateTodos?: Array<{ text: string; category: string }>;
  templateName?: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', color: '#0070f3' },
  { id: 'personal', name: 'Personal', color: '#7928ca' },
  { id: 'shopping', name: 'Shopping', color: '#f5a623' },
  { id: 'health', name: 'Health', color: '#007f5f' },
  { id: 'learning', name: 'Learning', color: '#ff0080' },
];

const PRESET_COLORS = [
  '#0070f3', '#7928ca', '#f5a623', '#007f5f', '#ff0080',
  '#ee0000', '#00dfd8', '#50e3c2', '#eb367f', '#171717'
];

export default function TodoApp({ initialListId, sharedList, templateTodos, templateName }: TodoAppProps) {
  // State
  const [listId] = useState<string>(initialListId || 'current-list');
  const [listName, setListName] = useState<string>(templateName || 'My Todo List');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newTodoText, setNewTodoText] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryColor, setNewCategoryColor] = useState<string>(PRESET_COLORS[0]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [undoToast, setUndoToast] = useState<{ todo: Todo; timeout: ReturnType<typeof setTimeout> } | null>(null);
  const [copyNotification, setCopyNotification] = useState<'text' | 'markdown' | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string>('');
  const [editingCategoryNameBack, setEditingCategoryNameBack] = useState<string>('');
  const [openCategoryMenuId, setOpenCategoryMenuId] = useState<string | null>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoryModalRef = useRef<HTMLDivElement>(null);
  const shortcutsModalRef = useRef<HTMLDivElement>(null);

  // ──────────────────────────────────────────────
  // Utility functions (needed before callbacks)
  // ──────────────────────────────────────────────
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ──────────────────────────────────────────────
  // Drag and Drop Handlers (works on all devices)
  // ──────────────────────────────────────────────
  const handleDragStart = useCallback((e: DragEvent, todoId: string) => {
    setDraggedId(todoId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', todoId);
    setTimeout(() => {
      const element = document.getElementById(`todo-${todoId}`);
      if (element) element.style.opacity = '0.5';
    }, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    // Add spring settle animation to all visible todos
    const todos = document.querySelectorAll('[id^="todo-"]');
    todos.forEach((todo, i) => {
      setTimeout(() => {
        todo.classList.add('animate-drop-spring');
        setTimeout(() => todo.classList.remove('animate-drop-spring'), 250);
      }, i * 20);
    });
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetId) {
      setTodos(prev => {
        const newTodos = [...prev];
        const sourceIndex = newTodos.findIndex(t => t.id === sourceId);
        const targetIndex = newTodos.findIndex(t => t.id === targetId);
        if (sourceIndex !== -1 && targetIndex !== -1) {
          const [removed] = newTodos.splice(sourceIndex, 1);
          newTodos.splice(targetIndex, 0, removed);
          return newTodos.map((t, i) => ({ ...t, order: i }));
        }
        return prev;
      });
      clearSelection();
    }
    setDraggedId(null);
  }, [clearSelection]);

  // ──────────────────────────────────────────────
  // Touch Drag Handlers (using touch events)
  // ──────────────────────────────────────────────
  const [draggingTouch, setDraggingTouch] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const touchStartY = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent, todoId: string) => {
    // Only track single touch
    if (e.touches.length !== 1) return;
    touchStartY.current = e.touches[0].clientY;
    setDraggingTouch(todoId);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!draggingTouch) return;
    e.preventDefault();

    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);

    // Find the todo element we're hovering over
    const todoElement = elements.find(el => el.id.startsWith('todo-') && el.id !== `todo-${draggingTouch}`);
    if (todoElement) {
      const targetId = todoElement.id.replace('todo-', '');
      setDropTarget(targetId);
    } else {
      setDropTarget(null);
    }
  }, [draggingTouch]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (draggingTouch) {
      // If we have a drop target, move the todo
      if (dropTarget && dropTarget !== draggingTouch) {
        setTodos(prev => {
          const newTodos = [...prev];
          const sourceIndex = newTodos.findIndex(t => t.id === draggingTouch);
          const targetIndex = newTodos.findIndex(t => t.id === dropTarget);
          if (sourceIndex !== -1 && targetIndex !== -1) {
            const [removed] = newTodos.splice(sourceIndex, 1);
            newTodos.splice(targetIndex, 0, removed);
            return newTodos.map((t, i) => ({ ...t, order: i }));
          }
          return prev;
        });
        clearSelection();
      }

      setDraggingTouch(null);
      setDropTarget(null);
    }
  }, [draggingTouch, dropTarget, clearSelection]);

  // ──────────────────────────────────────────────
  // Computed Values
  // ──────────────────────────────────────────────
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      if (selectedCategory && todo.category !== selectedCategory) return false;
      if (debouncedSearchQuery && !todo.text.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) return false;
      if (!showCompleted && todo.completed) return false;
      return true;
    });
  }, [todos, selectedCategory, debouncedSearchQuery, showCompleted]);

  const totalTodos = todos.length;
  const completedTodos = todos.filter(t => t.completed).length;
  const progress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  // Get category by id (useCallback to avoid re-creation)
  const getCategory = useCallback((id: string) => categories.find(c => c.id === id), [categories]);

  // ──────────────────────────────────────────────
  // Bulk Selection Handlers
  // ──────────────────────────────────────────────
  const toggleSelectTodo = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredTodos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTodos.map(t => t.id)));
    }
  }, [selectedIds.size, filteredTodos]);

  const bulkComplete = useCallback((completed: boolean) => {
    if (selectedIds.size === 0) return;
    setTodos(prev => prev.map(t =>
      selectedIds.has(t.id) ? { ...t, completed } : t
    ));
    clearSelection();
  }, [selectedIds, clearSelection]);

  const bulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    const firstSelectedId = Array.from(selectedIds)[0];
    const todoToDelete = todos.find(t => t.id === firstSelectedId);

    if (todoToDelete) {
      if (undoToast) {
        clearTimeout(undoToast.timeout);
      }
      const timeout = setTimeout(() => {
        setUndoToast(null);
      }, 5000);
      setUndoToast({ todo: todoToDelete, timeout });
    }

    setTodos(prev => prev.filter(t => !selectedIds.has(t.id)));
    clearSelection();
  }, [selectedIds, todos, undoToast, clearSelection]);

  const bulkMoveCategory = useCallback((categoryId: string) => {
    if (selectedIds.size === 0) return;
    setTodos(prev => prev.map(t =>
      selectedIds.has(t.id) ? { ...t, category: categoryId } : t
    ));
    clearSelection();
  }, [selectedIds, clearSelection]);

  // Undo delete - restore a recently deleted todo
  const handleUndoDelete = useCallback(() => {
    if (undoToast) {
      clearTimeout(undoToast.timeout);
      setTodos(prev => {
        // Insert at original position or at top
        const insertIndex = Math.min(undoToast.todo.order, prev.length);
        const newTodos = [...prev];
        newTodos.splice(insertIndex, 0, { ...undoToast.todo, completed: false });
        // Re-index orders
        return newTodos.map((t, i) => ({ ...t, order: i }));
      });
      setUndoToast(null);
    }
  }, [undoToast]);

  // Dismiss undo toast without restoring
  const dismissUndoToast = useCallback(() => {
    if (undoToast) {
      clearTimeout(undoToast.timeout);
      setUndoToast(null);
    }
  }, [undoToast]);

  // Debounced search (300ms delay for performance)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(value);
    }, 300);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Dark mode initialization
  useEffect(() => {
    // Check localStorage first
    const storedDarkMode = localStorage.getItem('dark-mode');
    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode === 'true');
      document.documentElement.classList.toggle('dark', storedDarkMode === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('dark-mode', String(newValue));
      document.documentElement.classList.toggle('dark', newValue);
      return newValue;
    });
  }, []);

  // Focus trap for category modal
  useEffect(() => {
    if (!showCategoryModal || !categoryModalRef.current) return;

    const modal = categoryModalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on open
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [showCategoryModal]);

  // Focus trap for shortcuts modal
  useEffect(() => {
    if (!showShortcuts || !shortcutsModalRef.current) return;

    const modal = shortcutsModalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [showShortcuts]);

  // Initialize on client side
  useEffect(() => {
    if (!initialListId && !localStorage.getItem('current-list-id')) {
      localStorage.setItem('current-list-id', generateId());
    }
    setIsInitialized(true);
  }, [initialListId]);

  // Load from localStorage or use shared list or template
  useEffect(() => {
    if (!isInitialized) return;
    if (sharedList) {
      setTodos(sharedList.todos);
      setCategories(sharedList.categories);
      setListName(sharedList.name);
      return;
    }

    // Check for template data in localStorage
    const templateData = localStorage.getItem('new-list-from-template');
    if (templateData) {
      localStorage.removeItem('new-list-from-template');
      try {
        const template = JSON.parse(templateData);
        setListName(template.name);
        if (template.todos) {
          const templateTodosList: Todo[] = template.todos.map((t: { text: string; category: string }, i: number) => ({
            id: generateId(),
            text: t.text,
            completed: false,
            category: t.category || 'work',
            tags: [],
            dueDate: null,
            reminder: null,
            createdAt: Date.now(),
            order: i,
          }));
          setTodos(templateTodosList);
        }
      } catch (e) {
        console.error('Failed to load template:', e);
      }
      return;
    }

    // Get the actual listId from localStorage (or use the default)
    const actualListId = initialListId || localStorage.getItem('current-list-id') || listId;
    const stored = localStorage.getItem(`todolist-${actualListId}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setTodos(data.todos || []);
        setCategories(data.categories || DEFAULT_CATEGORIES);
        setListName(data.listName || 'My Todo List');
      } catch (e) {
        console.error('Failed to load list:', e);
      }
    }
  }, [listId, sharedList, isInitialized]);

  // Save to localStorage on change
  useEffect(() => {
    if (!isInitialized) return;
    if (sharedList) return;

    const actualListId = initialListId || localStorage.getItem('current-list-id') || listId;
    const data = { todos, categories, listName };
    localStorage.setItem(`todolist-${actualListId}`, JSON.stringify(data));
  }, [todos, categories, listName, sharedList, isInitialized, initialListId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus new todo input on 'n' press
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey &&
          !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        document.getElementById('new-todo-input')?.focus();
      }
      // Focus search on '/' press
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      // Toggle shortcuts help on '?' press
      if ((e.key === '?' || e.key === '/') && ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        // Don't interfere when typing
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowShortcuts(prev => !prev);
      }
      // Escape to close shortcuts modal or blur
      if (e.key === 'Escape') {
        if (showShortcuts) {
          setShowShortcuts(false);
        } else if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts]);

  // Add todo
  const addTodo = useCallback(() => {
    if (!newTodoText.trim()) return;

    const todo: Todo = {
      id: generateId(),
      text: newTodoText.trim(),
      completed: false,
      category: selectedCategory || 'work',
      tags: [],
      dueDate: selectedDate || null,
      reminder: null,
      createdAt: Date.now(),
      order: todos.length,
    };

    setTodos(prev => [todo, ...prev]);
    setNewTodoText('');
    setSelectedDate('');
      }, [newTodoText, selectedCategory, selectedDate, todos.length]);

  // Toggle todo
  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  }, []);

  // Delete todo (with undo support)
  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => {
      const todoToDelete = prev.find(t => t.id === id);
      if (todoToDelete) {
        // Clear any existing undo toast
        if (undoToast) {
          clearTimeout(undoToast.timeout);
        }
        // Set new undo toast with 5 second timeout
        const timeout = setTimeout(() => {
          setUndoToast(null);
        }, 5000);
        setUndoToast({ todo: todoToDelete, timeout });
      }
      return prev.filter(t => t.id !== id);
    });
  }, [undoToast]);

  // Update todo
  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates } : t
    ));
  }, []);

  // Add category
  const addCategory = useCallback(() => {
    if (!newCategoryName.trim()) return;

    const category: Category = {
      id: generateId(),
      name: newCategoryName.trim(),
      color: newCategoryColor,
    };

    setCategories(prev => [...prev, category]);
    setNewCategoryName('');
    setNewCategoryColor(PRESET_COLORS[0]);
    setShowCategoryModal(false);
  }, [newCategoryName, newCategoryColor]);

  // Update category
  const updateCategory = useCallback((id: string, name: string, color: string) => {
    setCategories(prev => prev.map(c =>
      c.id === id ? { ...c, name, color } : c
    ));
    setEditingCategoryId(null);
  }, []);

  // Delete category
  const deleteCategory = useCallback((id: string) => {
    // Move todos from deleted category to 'work'
    setTodos(prev => prev.map(t =>
      t.category === id ? { ...t, category: 'work' } : t
    ));
    setCategories(prev => prev.filter(c => c.id !== id));
    if (selectedCategory === id) setSelectedCategory(null);
    setEditingCategoryId(null);
  }, [selectedCategory]);

  // Start editing category name
  const startEditingCategory = useCallback((e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setEditingCategoryNameBack(category.name);
    setTimeout(() => {
      categoryInputRef.current?.focus();
      categoryInputRef.current?.select();
    }, 0);
  }, []);

  // Save category name edit
  const saveCategoryName = useCallback(() => {
    if (editingCategoryId && editingCategoryName.trim() && editingCategoryName.trim() !== editingCategoryNameBack) {
      setCategories(prev => prev.map(c =>
        c.id === editingCategoryId ? { ...c, name: editingCategoryName.trim() } : c
      ));
    }
    setEditingCategoryId(null);
  }, [editingCategoryId, editingCategoryName, editingCategoryNameBack]);

  // Cancel category name edit
  const cancelEditingCategory = useCallback(() => {
    if (editingCategoryId && editingCategoryName.trim() !== editingCategoryNameBack) {
      // Restore original name on cancel
      setEditingCategoryName(editingCategoryNameBack);
    }
    setEditingCategoryId(null);
  }, [editingCategoryId, editingCategoryName, editingCategoryNameBack]);

  // Copy list as Markdown
  const copyAsMarkdown = useCallback(() => {
    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '';

    let markdown = `# ${listName}\n\n`;
    markdown += `**${completedTodos}/${totalTodos} completed** (${progress}%)\n\n`;

    // Group by category
    const cats = categories.filter(c => todos.some(t => t.category === c.id));

    cats.forEach(cat => {
      const catTodos = todos.filter(t => t.category === cat.id);
      if (catTodos.length === 0) return;

      markdown += `## ${cat.name}\n\n`;
      catTodos.forEach(t => {
        const checkbox = t.completed ? 'x' : ' ';
        const strikethrough = t.completed ? '~~' : '';
        markdown += `- [${checkbox}] ${strikethrough}${t.text}${strikethrough}`;
        if (t.dueDate) {
          markdown += ` _(due: ${formatDueDate(t.dueDate)})_`;
        }
        markdown += `\n`;
      });
      markdown += `\n`;
    });

    // Add uncategorized todos that aren't in any category
    const categorizedIds = new Set(cats.flatMap(c => todos.filter(t => t.category === c.id).map(t => t.id)));
    const uncategorized = todos.filter(t => !categorizedIds.has(t.id));
    if (uncategorized.length > 0) {
      markdown += `## Uncategorized\n\n`;
      uncategorized.forEach(t => {
        const checkbox = t.completed ? 'x' : ' ';
        const strikethrough = t.completed ? '~~' : '';
        markdown += `- [${checkbox}] ${strikethrough}${t.text}${strikethrough}\n`;
      });
    }

    navigator.clipboard.writeText(markdown);
    setCopyNotification('markdown');
    setTimeout(() => setCopyNotification(null), 2000);
  }, [listName, todos, categories, completedTodos, totalTodos, progress]);

  // Show loading skeleton while initializing
  if (!isInitialized) {
    return (
      <div className="relative max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-lg bg-canvas-soft" />
            <div className="flex-1 h-8 bg-canvas-soft rounded-md" />
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-full bg-canvas-soft" />
              <div className="w-10 h-10 rounded-full bg-canvas-soft" />
            </div>
          </div>

          {/* Progress skeleton */}
          <div className="mb-6 p-4 bg-canvas-soft rounded-xl border border-hairline">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-20 bg-canvas-soft-2 rounded" />
              <div className="h-4 w-10 bg-canvas-soft-2 rounded" />
            </div>
            <div className="h-2 bg-canvas-soft-2 rounded-full" />
          </div>

          {/* Add todo skeleton */}
          <div className="mb-6 flex gap-2">
            <div className="flex-1 h-9 bg-canvas-soft rounded-md" />
            <div className="w-9 h-9 bg-canvas-soft rounded-md" />
            <div className="w-9 h-9 bg-canvas-soft rounded-md" />
          </div>

          {/* Search skeleton */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 h-10 bg-canvas-soft rounded-md" />
            <div className="w-28 h-10 bg-canvas-soft rounded-md" />
          </div>

          {/* Category pills skeleton */}
          <div className="flex gap-2 mb-6">
            <div className="h-7 w-16 bg-canvas-soft rounded-full" />
            <div className="h-7 w-20 bg-canvas-soft rounded-full" />
            <div className="h-7 w-18 bg-canvas-soft rounded-full" />
          </div>

          {/* Todo items skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 bg-canvas rounded-lg border border-hairline">
                <div className="w-6 h-6 rounded-lg bg-canvas-soft" />
                <div className="flex-1 h-4 bg-canvas-soft rounded" />
                <div className="h-5 w-16 bg-canvas-soft rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If viewing shared list
  if (sharedList) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink mb-3">{sharedList.name}</h1>
          <p className="text-body text-mute">
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {sharedList.todos.length} tasks
            </span>
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 p-6 bg-canvas rounded-xl border border-hairline shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-body-sm font-medium text-mute">Progress</span>
            <span className="text-sm font-mono font-bold text-link">{progress}%</span>
          </div>
          <div className="h-2.5 bg-canvas-soft rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0070f3] to-[#7928ca] rounded-full progress-fill"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
          <p className="text-caption text-mute mt-2">
            {completedTodos} of {totalTodos} completed
          </p>
        </div>

        {/* Todo List */}
        <div className="space-y-2">
          {filteredTodos.map((todo, index) => {
            const category = getCategory(todo.category);

            return (
              <div
                key={todo.id}
                className="flex items-center gap-2 p-3 bg-canvas rounded-lg border border-hairline animate-fade-in-fast stagger-container-fast"
              >
                {/* Completion indicator */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0
                  ${todo.completed
                    ? 'bg-success border-success'
                    : 'border-hairline'}`}
                >
                  {todo.completed && (
                    <svg className="w-3 h-3 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`flex-1 text-body-sm ${todo.completed ? 'line-through text-mute' : 'text-ink'}`}>
                  {todo.text}
                </span>
                {category && (
                  <span
                    className="text-caption px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${category.color}15`, color: category.color }}
                  >
                    {category.name}
                  </span>
                )}
              </div>
            );
          })}

          {filteredTodos.length === 0 && (
            <div className="text-center py-12 text-mute">
              <p>No tasks to display</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-20">
      {/* Header - List name with actions */}
      <div className="flex items-center gap-4 mb-8">
        {/* Icon - opens shortcuts */}
        <button
          onClick={() => setShowShortcuts(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
          title="View shortcuts"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </button>

        {/* Editable title - full width */}
        <input
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          className="flex-1 text-xl sm:text-2xl md:text-3xl font-bold bg-transparent border-none outline-none text-ink placeholder:text-mute tracking-tight uppercase break-words min-w-0"
          placeholder="TASKS"
          aria-label="List name"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={copyAsMarkdown}
            disabled={todos.length === 0}
            className="w-10 h-10 inline-flex items-center justify-center rounded-full border border-hairline bg-canvas-soft hover:bg-canvas-soft-2 hover:border-link text-body transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110"
            title="Copy as Markdown"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (todos.length > 0 && confirm('Clear all tasks? This cannot be undone.')) {
                setTodos([]);
              }
            }}
            disabled={todos.length === 0}
            className="w-10 h-10 inline-flex items-center justify-center rounded-full border border-hairline bg-canvas-soft hover:bg-error-soft text-body hover:text-error transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Clear all tasks"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Copy notification */}
      {copyNotification && (
        <div role="status" aria-live="polite" className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-success text-on-primary text-body-sm rounded-pill shadow-lg animate-fade-in">
          Copied as Markdown!
        </div>
      )}

      {/* Undo delete toast */}
      {undoToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-ink text-canvas text-body-sm rounded-lg shadow-lg animate-fade-in"
        >
          <span>Task deleted</span>
          <button
            onClick={handleUndoDelete}
            className="px-3 py-1 bg-primary text-on-primary rounded text-caption font-[500] hover:opacity-90 transition-opacity"
          >
            Undo
          </button>
          <button
            onClick={dismissUndoToast}
            className="p-1 text-mute hover:text-canvas transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Progress */}
      <div className="mb-6 p-3 sm:p-4 bg-canvas-soft rounded-lg sm:rounded-xl border border-hairline relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center shrink-0
              ${progress === 100 ? 'bg-success text-on-primary' : 'bg-primary/15 text-primary'}`}>
              {progress === 100 ? (
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 check-in-celebrate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                </svg>
              )}
            </div>
            <span className="text-caption sm:text-body-sm text-mute">{completedTodos}/{totalTodos}</span>
          </div>
          <span className={`text-sm sm:text-base font-mono font-bold ${progress === 100 ? 'text-success' : 'text-primary'}`}>
            {progress}%
          </span>
        </div>
        <div className="h-1.5 sm:h-2 bg-canvas rounded-full overflow-hidden">
          <div className={`h-full rounded-full progress-fill ${progress === 100 ? 'bg-success progress-bump-celebrate' : 'bg-gradient-to-r from-primary to-link'}`} style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      </div>

      
      {/* Add Todo - compact inline style */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[200px] relative">
            <input
              id="new-todo-input"
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a task..."
              className="w-full h-9 pl-3 pr-10 bg-canvas-soft border border-hairline rounded-md text-sm text-ink placeholder:text-mute focus:outline-none focus:border-link transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-mute opacity-60 font-mono pointer-events-none hidden sm:block">Enter</span>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="h-9 px-2 bg-canvas-soft border border-hairline rounded-md text-caption text-ink focus:outline-none focus:border-link cursor-pointer"
            >
              <option value="">All</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="relative">
              <button
                type="button"
                id="add-task-date-btn"
                className={`h-9 w-9 flex items-center justify-center border rounded-md transition-colors
                  ${selectedDate ? 'bg-link-bg-soft border-link text-link' : 'bg-canvas-soft border-hairline text-mute hover:text-body'}`}
                title="Set due date (for this task)"
                onClick={() => {
                  const input = document.getElementById('add-task-date-input') as HTMLInputElement;
                  if (input) {
                    input.showPicker?.() || input.focus();
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input
                id="add-task-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                tabIndex={-1}
              />
              {selectedDate && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedDate(''); }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white rounded-full flex items-center justify-center text-[10px] leading-none hover:bg-error-deep"
                  title="Clear date"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
        {selectedDate && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-caption text-mute">Due:</span>
            <span className="text-caption px-2 py-0.5 bg-link-bg-soft text-link rounded-full">
              {formatDueDate(selectedDate)}
            </span>
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search... (/)"
            className="w-full h-10 pl-10 pr-4 bg-canvas-soft border border-hairline rounded-md text-body-sm text-ink placeholder:text-mute focus:outline-none focus:border-link transition-colors"
          />
        </div>
        <label htmlFor="show-completed" className="flex items-center gap-2 text-body-sm text-mute cursor-pointer shrink-0">
          <input
            id="show-completed"
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="w-4 h-4 rounded border-hairline accent-primary"
          />
          Show completed
        </label>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap overflow-x-auto pb-2 -mx-3 px-3 sm:pb-0 sm:mx-0 sm:px-0 sm:flex-wrap mb-6">
        <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-caption font-[500] transition-all shrink-0
              ${!selectedCategory
                ? 'bg-primary text-on-primary'
                : 'bg-canvas-soft text-body hover:bg-canvas-soft-2'}`}
          >
          All ({totalTodos})
        </button>
        {categories.map(cat => {
          const count = todos.filter(t => t.category === cat.id).length;
          const isEditing = editingCategoryId === cat.id;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              disabled={isEditing}
              onClick={() => !isEditing && setSelectedCategory(isSelected ? null : cat.id)}
              onDoubleClick={(e) => startEditingCategory(e, cat)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-caption font-[500] transition-all flex items-center gap-1 sm:gap-2 shrink-0 select-none
                ${isSelected ? '' : 'bg-canvas-soft text-body hover:bg-canvas-soft-2'}`}
              style={isSelected ? { backgroundColor: cat.color, color: 'var(--color-on-primary)' } : {}}
            >
              {isEditing ? (
                <input
                  ref={categoryInputRef}
                  type="text"
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  onBlur={saveCategoryName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveCategoryName();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelEditingCategory();
                    }
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-none outline-none min-w-[50px] max-w-[120px] w-20 text-caption font-[500] text-inherit"
                  style={{ color: 'inherit' }}
                />
              ) : (
                <span className="max-w-[80px] sm:max-w-[100px] truncate">{cat.name}</span>
              )}
              <span className="opacity-70 shrink-0">({count})</span>
            </button>
          );
        })}
        <button
          onClick={() => {
            setNewCategoryColor(PRESET_COLORS[0]);
            setShowCategoryModal(true);
          }}
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-caption font-[500] bg-canvas-soft text-mute hover:text-body transition-colors shrink-0"
        >
          + Add
        </button>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-canvas rounded-lg border border-link shadow-md">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredTodos.length && filteredTodos.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-hairline accent-primary cursor-pointer"
              />
              <span className="text-body-sm text-ink font-[500]">
                {selectedIds.size}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-1 flex-wrap">
              <button
                onClick={() => bulkComplete(true)}
                disabled={selectedIds.size === 0}
                className="px-2 sm:px-3 py-1.5 bg-success/10 text-success text-caption font-[500] rounded hover:bg-success/20 transition-colors disabled:opacity-50"
              >
                ✓
              </button>
              <button
                onClick={() => bulkComplete(false)}
                disabled={selectedIds.size === 0}
                className="px-2 sm:px-3 py-1.5 bg-canvas-soft text-body text-caption font-[500] rounded hover:bg-canvas-soft-2 transition-colors disabled:opacity-50"
              >
                ↩
              </button>
              <button
                onClick={bulkDelete}
                disabled={selectedIds.size === 0}
                className="px-2 sm:px-3 py-1.5 bg-error-soft text-error-deep text-caption font-[500] rounded hover:bg-error/20 transition-colors disabled:opacity-50"
              >
                🗑
              </button>
            </div>

            {/* Move to category dropdown */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  bulkMoveCategory(e.target.value);
                  e.target.value = '';
                }
              }}
              className="h-8 px-2 bg-canvas-soft border border-hairline rounded text-caption text-body focus:outline-none focus:border-link cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>→</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <button
              onClick={clearSelection}
              className="p-1.5 text-mute hover:text-ink transition-colors"
              aria-label="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-2 sm:space-y-3">
        {filteredTodos.map((todo, index) => {
          const category = getCategory(todo.category);
          const status = getDueDateStatus(todo.dueDate);
          const isBeingDragged = draggedId === todo.id || draggingTouch === todo.id;
          const isDropTarget = dropTarget === todo.id && draggingTouch !== todo.id;

          return (
            <div
              id={`todo-${todo.id}`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, todo.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, todo.id)}
              // Touch events for mobile drag
              onTouchStart={(e) => handleTouchStart(e, todo.id)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`group flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 sm:p-3 bg-canvas rounded-lg border transition-all animate-fade-in-fast stagger-container-fast
                ${isBeingDragged ? 'opacity-50 scale-[0.98]' : ''}
                ${isDropTarget ? 'border-link border-dashed bg-link/10' : ''}
                ${selectedIds.has(todo.id) ? 'border-link shadow-sm' : 'border-hairline hover:border-hairline-strong'}
                touch-manipulation ${draggingTouch === todo.id ? 'z-50 relative' : ''} ${openCategoryMenuId === todo.id ? 'relative z-[80]' : ''}`}
            >
              {/* Drag handle - always show on desktop */}
              <div
                draggable={false}
                className="w-5 h-5 flex items-center justify-center flex-shrink-0 opacity-0 sm:opacity-40 sm:group-hover:opacity-100 transition-opacity hidden sm:flex pointer-events-none"
              >
                <svg className="w-4 h-4 text-mute" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="7" r="1.5" />
                  <circle cx="15" cy="7" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="17" r="1.5" />
                  <circle cx="15" cy="17" r="1.5" />
                </svg>
              </div>

              {/* Completion toggle - single control */}
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0
                  ${todo.completed
                    ? 'bg-link border-link scale-105 shadow-sm'
                    : 'border-hairline hover:border-link dark:hover:bg-link/10'}`}
                aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {todo.completed ? (
                  <svg className="w-4 h-4 text-white check-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-link/20 dark:group-hover:bg-link/30 transition-colors" />
                )}
              </button>

              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <input
                  type="text"
                  value={todo.text}
                  onChange={(e) => updateTodo(todo.id, { text: e.target.value })}
                  className={`w-full bg-transparent border-none outline-none text-body-sm ${todo.completed ? 'text-mute' : 'text-ink'} ${todo.completed ? `task-strikethrough ${todo.completed ? 'completed reveal' : ''}` : ''}`}
                />
                {category && (
                  <div className="relative z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenCategoryMenuId(openCategoryMenuId === todo.id ? null : todo.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setOpenCategoryMenuId(null);
                      }}
                      aria-expanded={openCategoryMenuId === todo.id}
                      aria-haspopup="listbox"
                      aria-label={`Change category: ${category.name}`}
                      className="text-caption px-2 py-0.5 rounded-full flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer self-start flex items-center gap-1 border border-transparent hover:border-current"
                      style={{ backgroundColor: `${category.color}15`, color: category.color }}
                    >
                      <span>{category.name}</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {/* Category dropdown */}
                    {openCategoryMenuId === todo.id && (
                      <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setOpenCategoryMenuId(null)} />
                        <div className="absolute top-full left-0 mt-1 z-[70] bg-canvas border border-hairline rounded-lg shadow-lg py-1 min-w-[140px]" role="listbox">
                          {/* None option */}
                          <button
                            role="option"
                            aria-selected={todo.category === 'work' || !todo.category}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTodo(todo.id, { category: 'work' });
                              setOpenCategoryMenuId(null);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-caption hover:bg-canvas-soft transition-colors flex items-center gap-2 ${todo.category === 'work' ? 'bg-primary/10' : ''}`}
                          >
                            <span className="w-2 h-2 rounded-full border border-hairline shrink-0" />
                            <span className="text-mute">None</span>
                            {todo.category === 'work' && (
                              <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          {categories.map(cat => (
                            <button
                              role="option"
                              aria-selected={todo.category === cat.id}
                              key={cat.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTodo(todo.id, { category: cat.id });
                                setOpenCategoryMenuId(null);
                              }}
                              className={`w-full px-3 py-1.5 text-left text-caption hover:bg-canvas-soft transition-colors flex items-center gap-2 ${todo.category === cat.id ? 'bg-primary/10' : ''}`}
                            >
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                              {cat.name}
                              {todo.category === cat.id && (
                                <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {/* Add category button when no category is set */}
                {!category && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenCategoryMenuId(openCategoryMenuId === todo.id ? null : todo.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setOpenCategoryMenuId(null);
                    }}
                    aria-expanded={openCategoryMenuId === todo.id}
                    aria-haspopup="listbox"
                    aria-label="Add category"
                    className="text-caption px-2 py-0.5 rounded-full flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer self-start flex items-center gap-1 border border-dashed border-mute hover:border-link"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add</span>
                  </button>
                )}
              </div>

              {todo.dueDate ? (
                <div className="relative flex-shrink-0 z-10 flex items-center gap-1 flex-wrap sm:flex-nowrap">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => document.getElementById(`date-edit-${todo.id}`)?.showPicker()}
                      className={`text-caption px-2 py-0.5 rounded-full transition-opacity touch-manipulation
                        ${status === 'overdue' ? 'bg-error-soft text-error-deep' : ''}
                        ${status === 'today' ? 'bg-warning-soft text-warning-deep' : ''}
                        ${status === 'upcoming' ? 'bg-link-bg-soft text-link' : ''}
                        ${status === 'none' ? 'bg-canvas-soft text-mute' : ''}`}
                      style={{ minHeight: '28px' }}
                    >
                      {formatDueDate(todo.dueDate)}
                    </button>
                    <input
                      id={`date-edit-${todo.id}`}
                      type="date"
                      value={todo.dueDate || ''}
                      onChange={(e) => { updateTodo(todo.id, { dueDate: e.target.value || null }); }}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                      tabIndex={-1}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => updateTodo(todo.id, { dueDate: null })}
                    className="text-caption w-5 h-5 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-error-soft text-mute hover:text-error transition-all"
                    title="Remove date"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => document.getElementById(`date-edit-${todo.id}`)?.showPicker()}
                    className="hidden sm:block text-caption px-2 py-0.5 rounded-full bg-canvas-soft text-mute hover:bg-link-bg-soft hover:text-link transition-all"
                    style={{ minHeight: '28px' }}
                  >
                    + Date
                  </button>
                  <input
                    id={`date-edit-${todo.id}`}
                    type="date"
                    value=""
                    onChange={(e) => { updateTodo(todo.id, { dueDate: e.target.value || null }); }}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                    tabIndex={-1}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`date-edit-mobile-${todo.id}`)?.showPicker()}
                    className="sm:hidden text-caption px-2 py-0.5 rounded-full bg-canvas-soft text-mute hover:bg-link-bg-soft hover:text-link transition-all"
                    style={{ minHeight: '28px' }}
                  >
                    + Date
                  </button>
                  <input
                    id={`date-edit-mobile-${todo.id}`}
                    type="date"
                    value=""
                    onChange={(e) => { updateTodo(todo.id, { dueDate: e.target.value || null }); }}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10 sm:hidden"
                    tabIndex={-1}
                  />
                </div>
              )}
            </div>
          );
        })}

        {filteredTodos.length === 0 && (
          <div className="text-center py-10 sm:py-12 animate-fade-in stagger-container-empty">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" style={{ color: 'var(--color-hairline)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-body text-mute mb-4">No tasks yet</p>
            <button
              onClick={() => document.getElementById('new-todo-input')?.focus()}
              className="inline-flex items-center gap-2 h-10 px-5 text-button-md font-[500] text-on-primary bg-primary rounded-lg sm:rounded-md hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add first task
            </button>
            <p className="text-caption text-mute mt-4 hidden sm:block">Press <kbd className="px-1.5 py-0.5 bg-canvas border border-hairline rounded text-caption font-mono">N</kbd></p>
          </div>
        )}
      </div>

      {/* Floating Add Button - mobile only */}
      <button
        onClick={() => document.getElementById('new-todo-input')?.focus()}
        className="fixed bottom-6 right-4 w-12 h-12 rounded-full bg-primary text-on-primary shadow-[0_4px_14px_rgba(0,112,243,0.4)] hover:shadow-[0_8px_24px_rgba(0,112,243,0.5)] hover:scale-110 active:scale-95 transition-all duration-150 z-40 flex items-center justify-center md:hidden"
        title="Add task (N)"
        aria-label="Add new task"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 animate-overlay-in bg-black/50" onClick={() => setShowCategoryModal(false)} />
          <div
            ref={categoryModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            className="relative w-full max-w-md bg-canvas rounded-lg border border-hairline shadow-xl p-6 animate-modal-in"
          >
            <h3 id="category-modal-title" className="text-display-sm mb-4">Add Category</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder="Category name..."
              className="w-full h-12 px-4 mb-4 bg-canvas border border-hairline rounded-md text-body-sm text-ink placeholder:text-mute focus:outline-none focus:border-link"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 mb-6">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewCategoryColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                    ${newCategoryColor === color ? 'border-ink scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 h-10 text-button-md font-[500] text-ink bg-canvas-soft rounded-md hover:bg-canvas-soft-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addCategory}
                className="flex-1 h-10 text-button-md font-[500] text-on-primary bg-primary rounded-md hover:opacity-90 transition-opacity"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Help Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 animate-overlay-in" style={{ backgroundColor: 'var(--color-ink)', opacity: 0.5 }} onClick={() => setShowShortcuts(false)} />
          <div
            ref={shortcutsModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-modal-title"
            className="relative w-full max-w-md bg-canvas rounded-lg border border-hairline shadow-xl p-6 animate-modal-in"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="shortcuts-modal-title" className="text-display-sm text-ink">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1 text-mute hover:text-ink transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-body">Add new task</span>
                <kbd className="px-2 py-1 bg-canvas-soft border border-hairline rounded text-caption font-mono">N</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-body">Focus search</span>
                <kbd className="px-2 py-1 bg-canvas-soft border border-hairline rounded text-caption font-mono">/</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-body">Add task</span>
                <kbd className="px-2 py-1 bg-canvas-soft border border-hairline rounded text-caption font-mono">Enter</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-body">Close / Clear focus</span>
                <kbd className="px-2 py-1 bg-canvas-soft border border-hairline rounded text-caption font-mono">Esc</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-body">Toggle this help</span>
                <kbd className="px-2 py-1 bg-canvas-soft border border-hairline rounded text-caption font-mono">?</kbd>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-hairline">
              <p className="text-body-sm text-ink font-[500] mb-2">Mouse & Touch</p>
              <div className="flex items-center justify-between mb-1">
                <span className="text-caption text-body">Click circle</span>
                <span className="text-caption text-mute">Toggle complete</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-caption text-body">Drag by handles</span>
                <span className="text-caption text-mute">Reorder tasks</span>
              </div>
            </div>
            <p className="mt-4 text-caption text-mute">Press <kbd className="px-1 py-0.5 bg-canvas-soft border border-hairline rounded text-caption font-mono">Esc</kbd> or click outside to close</p>
          </div>
        </div>
      )}

    </div>
  );
}
