import React, { useState, useCallback } from 'react';

interface DemoTodo {
  id: number;
  text: string;
  completed: boolean;
  category: string;
}

// Sample initial todos for demonstration
const INITIAL_TODOS: DemoTodo[] = [
  { id: 1, text: 'Review project requirements', completed: true, category: 'work' },
  { id: 2, text: 'Design landing page mockup', completed: false, category: 'work' },
  { id: 3, text: 'Buy groceries for dinner', completed: false, category: 'personal' },
  { id: 4, text: 'Schedule dentist appointment', completed: false, category: 'health' },
  { id: 5, text: 'Complete React tutorial', completed: true, category: 'learning' },
];

const DEMO_CATEGORY_COLORS: Record<string, string> = {
  work: 'var(--color-link)',
  personal: 'var(--color-link)',
  health: '#007f5f',
  learning: '#7928ca',
};

const DEMO_CATEGORIES = [
  { id: 'work', name: 'Work' },
  { id: 'personal', name: 'Personal' },
  { id: 'health', name: 'Health' },
  { id: 'learning', name: 'Learning' },
];

export default function DemoTodoList() {
  const [todos, setTodos] = useState<DemoTodo[]>(INITIAL_TODOS);
  const [newTodoText, setNewTodoText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const toggleTodo = useCallback((id: number) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  }, []);

  const addTodo = useCallback(() => {
    if (!newTodoText.trim()) return;

    const category = selectedCategory || 'work';
    const newTodo: DemoTodo = {
      id: Date.now(),
      text: newTodoText.trim(),
      completed: false,
      category,
    };

    setTodos(prev => [newTodo, ...prev]);
    setNewTodoText('');
  }, [newTodoText, selectedCategory]);

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTodos = selectedCategory
    ? todos.filter(t => t.category === selectedCategory)
    : todos;

  return (
    <div className="w-full max-w-md mx-auto bg-canvas rounded-xl border border-hairline shadow-lg overflow-hidden mx-4 sm:mx-auto">
      {/* Header */}
      <div className="p-4 sm:p-4 border-b border-hairline">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-body-sm font-semibold text-ink">Your Tasks</h3>
          <span className="text-caption text-mute">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="h-1.5 bg-canvas-soft rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-link rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add todo */}
      <div className="p-3 border-b border-hairline">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a task..."
            className="flex-1 h-9 px-3 bg-canvas-soft border border-hairline rounded-md text-body-sm text-ink placeholder:text-mute focus:outline-none focus:border-link transition-colors"
          />
          <select
            value={selectedCategory || ''}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCategory(val || null);
            }}
            className="h-9 px-2 bg-canvas-soft border border-hairline rounded-md text-caption text-ink focus:outline-none focus:border-link cursor-pointer pr-6"
            style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
          >
            <option value="">All</option>
            {DEMO_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category pills */}
      <div className="px-3 pt-3 pb-1 flex gap-1.5 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-2 py-1 rounded-full text-caption font-medium transition-all
            ${!selectedCategory
              ? 'bg-primary text-on-primary'
              : 'bg-canvas-soft text-mute hover:text-body'}`}
        >
          All
        </button>
        {DEMO_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            className={`px-2 py-1 rounded-full text-caption font-medium transition-all`}
            style={{
              backgroundColor: selectedCategory === cat.id ? DEMO_CATEGORY_COLORS[cat.id] : 'var(--color-canvas-soft)',
              color: selectedCategory === cat.id ? 'white' : 'var(--color-mute)'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Todo list */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="space-y-2">
          {filteredTodos.map((todo) => {
            const categoryColor = DEMO_CATEGORY_COLORS[todo.category] || 'var(--color-link)';

            return (
              <div
                key={todo.id}
                className="group flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-canvas-soft transition-colors"
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0
                    ${todo.completed
                      ? 'bg-[#0070f3] border-[#0070f3]'
                      : 'border-hairline hover:border-[#0070f3]'}`}
                >
                  {todo.completed && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <span className={`flex-1 text-body-sm transition-all
                  ${todo.completed ? 'text-mute line-through' : 'text-ink'}`}
                >
                  {todo.text}
                </span>

                {/* Category badge */}
                <span
                  className="px-1.5 py-0.5 rounded text-caption opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: `${categoryColor}15`,
                    color: categoryColor
                  }}
                >
                  {todo.category}
                </span>
              </div>
            );
          })}

          {filteredTodos.length === 0 && (
            <div className="text-center py-6 text-mute text-body-sm">
              No tasks in this category
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-canvas-soft border-t border-hairline">
        <p className="text-caption text-mute text-center">
          Try it! Add or complete tasks above
        </p>
      </div>
    </div>
  );
}