# 011 — Add drag-and-drop spring physics

- **Status**: TODO
- **Severity**: MEDIUM
- **Category**: Physicality & Interruptibility
- **Estimated scope**: 1 file (TodoApp.tsx), 40 lines

## Problem

The current drag-and-drop implementation in `TodoApp.tsx` uses CSS `opacity: 0.5` to indicate "dragging" state, with `setTimeout` and direct DOM manipulation:

```tsx
// src/components/TodoApp.tsx:60-68
const handleDragStart = useCallback((e: React.DragEvent, todoId: string) => {
  setDraggedId(todoId);
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', todoId);
  setTimeout(() => {
    const element = document.getElementById(`todo-${todoId}`);
    if (element) element.style.opacity = '0.5';
  }, 0);
}, []);
```

Issues:
1. **No physics** — the item doesn't respond to drag velocity
2. **No drop animation** — items snap into place, not spring
3. **No placeholder** — the original position isn't indicated
4. **Poor touch support** — native drag events are janky on mobile

## Target

Add visual feedback for drag-and-drop that includes:
1. **Drag shadow** — a subtle shadow under the dragged item
2. **Drop spring** — items settle into place with spring physics
3. **Placeholder** — gap shows where item will land

```tsx
// During drag - add subtle scale and shadow
<div className={`dragging-source scale-[1.02] shadow-lg opacity-80`}>

// Drop zone - show placeholder gap
<div className={`drop-target placeholder-h-14 border-2 border-dashed border-link`}>

// Drop - spring settle
<div className={`dropping-in`}>
```

```css
/* Drag states */
.dragging-source {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 112, 243, 0.15);
  opacity: 0.9;
  transition: transform 100ms ease-out;
}

.dropping-in {
  animation: drop-spring 300ms var(--ease-out) forwards;
}

@keyframes drop-spring {
  0% { transform: scale(1.02) translateY(-8px); }
  60% { transform: scale(1.01) translateY(2px); }
  100% { transform: scale(1) translateY(0); }
}

.drop-placeholder {
  background: var(--color-link-bg-soft);
  border: 2px dashed var(--color-link);
  border-radius: 8px;
  transition: height 200ms var(--ease-out);
}
```

## Repo conventions to follow

The codebase uses Tailwind classes for most styling. CSS custom properties (`var(--color-*)`) for colors.

## Steps

1. Open `src/styles/global.css` — add drag-related keyframes after completion animations:

```css
/* ──────────────────────────────────────────────
   Drag and Drop Animations
   ────────────────────────────────────────────── */
@keyframes drop-spring {
  0% { transform: scale(1.02) translateY(-6px); }
  50% { transform: scale(1.01) translateY(2px); }
  100% { transform: scale(1) translateY(0); }
}

@keyframes lift-up {
  0% { transform: scale(1); box-shadow: var(--shadow-sm); }
  100% { transform: scale(1.02); box-shadow: 0 8px 24px rgba(0, 112, 243, 0.15); }
}

.animate-drop-spring {
  animation: drop-spring 250ms var(--ease-out) forwards;
}

.animate-lift {
  animation: lift-up 150ms var(--ease-out) forwards;
}
```

2. Open `src/components/TodoApp.tsx` — update the drag handlers. Find handleDragEnd (around line 70):

   Replace the direct DOM manipulation with CSS class-based approach:
   ```tsx
   const handleDragEnd = useCallback(() => {
     // Add spring animation to all visible todos
     const todos = document.querySelectorAll('[id^="todo-"]');
     todos.forEach(todo => {
       todo.classList.add('animate-drop-spring');
       setTimeout(() => todo.classList.remove('animate-drop-spring'), 250);
     });
     setDraggedId(null);
   }, []);
   ```

3. Update the todo item div to have drag-aware styling (around line 967):

   ```tsx
   <div
     id={`todo-${todo.id}`}
     className={`group flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 sm:p-3 bg-canvas rounded-lg border transition-all animate-fade-in
       ${draggedId === todo.id ? 'dragging-source' : ''}
       ${dragOverId === todo.id ? 'drop-target' : ''}`}
     draggable
     onDragStart={(e) => handleDragStart(e, todo.id)}
     onDragEnd={handleDragEnd}
     onDragOver={(e) => handleDragOver(e, todo.id)}
     onDrop={(e) => handleDrop(e, todo.id)}
   >
   ```

   Add the `dragOverId` state:
   ```tsx
   const [dragOverId, setDragOverId] = useState<string | null>(null);
   ```

4. Add placeholder styling in `global.css`:
   ```css
   .drop-target {
     background: var(--color-link-bg-soft);
     border: 2px dashed var(--color-link);
     border-radius: var(--radius-md);
     transform: scale(0.98);
   }
   ```

5. Add drag over handler:
   ```tsx
   const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
     e.preventDefault();
     e.dataTransfer.dropEffect = 'move';
     setDragOverId(targetId);
   }, []);
   ```

## Boundaries

- Do NOT use libraries (dnd-kit, etc.) — keep modifications to existing code
- Do NOT make drag animations longer than 250ms
- Do NOT add drag on mobile (leave touch drag as-is, it's functional)
- Do NOT change the actual drop logic — only visual feedback

## Verification

- **Mechanical**: `astro dev` builds without errors
- **Feel check**:
  1. Drag a todo item — it should lift slightly (scale 1.02) with shadow
  2. Drag over another item — the target should show placeholder state
  3. Drop — items should settle with spring (not snap)
  4. Touch-and-drag on mobile should not be affected
  5. With `prefers-reduced-motion` — lift effect uses opacity instead of scale
- **Done when**: Desktop drag has satisfying lift, drop, and settle feel

## Notes

For production-grade drag-and-drop with touch support, consider `@dnd-kit/core` (lightweight, accessible) or `@dnd-kit/sortable`. This plan focuses on improving the existing native HTML5 drag-drop with CSS-only enhancements.