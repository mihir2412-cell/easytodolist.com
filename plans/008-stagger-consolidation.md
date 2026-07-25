# 008 — Consolidate staggered reveals to CSS-only

- **Status**: TODO
- **Severity**: MEDIUM
- **Category**: Cohesion & Token Consistency
- **Estimated scope**: 2 files, 15 lines

## Problem

Staggered animations in `TodoApp.tsx` use inline `style` attributes with JavaScript-computed delays:

```tsx
// src/components/TodoApp.tsx:581, 972
<div
  key={todo.id}
  style={{ animationDelay: `${index * 50}ms` }}
  className="... animate-fade-in"
>
```

This approach:
1. **Mixes concerns** — JavaScript calculating CSS timing
2. **Hard to adjust** — changing stagger requires JS changes
3. **Duplicated logic** — same pattern repeated in multiple components
4. **Inconsistent** — other places use predefined `.stagger-1` through `.stagger-5` classes

## Target

Consolidate to CSS-only stagger using the existing `.stagger-*` classes pattern plus a generic stagger system:

```css
/* Generic stagger — use nth-child for automatic calculation */
/* Supports up to 10 items automatically */
.stagger-container > *:nth-child(1) { animation-delay: 0ms; }
.stagger-container > *:nth-child(2) { animation-delay: 50ms; }
.stagger-container > *:nth-child(3) { animation-delay: 100ms; }
.stagger-container > *:nth-child(4) { animation-delay: 150ms; }
.stagger-container > *:nth-child(5) { animation-delay: 200ms; }
.stagger-container > *:nth-child(6) { animation-delay: 250ms; }
.stagger-container > *:nth-child(7) { animation-delay: 300ms; }
.stagger-container > *:nth-child(8) { animation-delay: 350ms; }
.stagger-container > *:nth-child(9) { animation-delay: 400ms; }
.stagger-container > *:nth-child(10) { animation-delay: 450ms; }

/* Faster stagger for dense lists */
.stagger-container-fast > *:nth-child(1) { animation-delay: 0ms; }
.stagger-container-fast > *:nth-child(2) { animation-delay: 30ms; }
.stagger-container-fast > *:nth-child(3) { animation-delay: 60ms; }
/* ... up to 10 items */
```

Then in JSX, the component would use:
```tsx
<div className="stagger-container">
  {todos.map((todo, index) => (
    <div key={todo.id} className="animate-fade-in">
      {/* No more inline style={{ animationDelay: ... }} */}
    </div>
  ))}
</div>
```

## Repo conventions to follow

The codebase already has `.stagger-1` through `.stagger-5` defined in `global.css:650-654`. Extend this pattern rather than replacing it.

## Steps

1. Open `src/styles/global.css` — find the stagger classes (around line 650) and add the generic system:

   Replace:
   ```css
   .stagger-1 { animation-delay: 0ms; }
   .stagger-2 { animation-delay: 100ms; }
   .stagger-3 { animation-delay: 200ms; }
   .stagger-4 { animation-delay: 300ms; }
   .stagger-5 { animation-delay: 400ms; }
   ```
   
   With:
   ```css
   /* Legacy stagger classes (maintained for compatibility) */
   .stagger-1 { animation-delay: 0ms; }
   .stagger-2 { animation-delay: 50ms; }
   .stagger-3 { animation-delay: 100ms; }
   .stagger-4 { animation-delay: 150ms; }
   .stagger-5 { animation-delay: 200ms; }
   
   /* Generic nth-child stagger — automatic per item */
   .stagger-container > *:nth-child(1) { animation-delay: 0ms; }
   .stagger-container > *:nth-child(2) { animation-delay: 50ms; }
   .stagger-container > *:nth-child(3) { animation-delay: 100ms; }
   .stagger-container > *:nth-child(4) { animation-delay: 150ms; }
   .stagger-container > *:nth-child(5) { animation-delay: 200ms; }
   .stagger-container > *:nth-child(6) { animation-delay: 250ms; }
   .stagger-container > *:nth-child(7) { animation-delay: 300ms; }
   .stagger-container > *:nth-child(8) { animation-delay: 350ms; }
   .stagger-container > *:nth-child(9) { animation-delay: 400ms; }
   .stagger-container > *:nth-child(10) { animation-delay: 450ms; }
   
   /* Fast stagger (30ms delay) for dense/short lists */
   .stagger-container-fast > *:nth-child(1) { animation-delay: 0ms; }
   .stagger-container-fast > *:nth-child(2) { animation-delay: 30ms; }
   .stagger-container-fast > *:nth-child(3) { animation-delay: 60ms; }
   .stagger-container-fast > *:nth-child(4) { animation-delay: 90ms; }
   .stagger-container-fast > *:nth-child(5) { animation-delay: 120ms; }
   .stagger-container-fast > *:nth-child(6) { animation-delay: 150ms; }
   .stagger-container-fast > *:nth-child(7) { animation-delay: 180ms; }
   .stagger-container-fast > *:nth-child(8) { animation-delay: 210ms; }
   .stagger-container-fast > *:nth-child(9) { animation-delay: 240ms; }
   .stagger-container-fast > *:nth-child(10) { animation-delay: 270ms; }
   
   /* Single-direction stagger (horizontal lists) */
   .stagger-row > *:nth-child(1) { animation-delay: 0ms; }
   .stagger-row > *:nth-child(2) { animation-delay: 30ms; }
   .stagger-row > *:nth-child(3) { animation-delay: 60ms; }
   /* ... */
   
   /* Ensure animation-fill-mode: forwards is inherited */
   .stagger-container,
   .stagger-container-fast,
   .stagger-row {
     overflow: hidden; /* Prevent content from showing before animation */
   }
   ```

2. Open `src/components/TodoApp.tsx` — update the todo list to use the stagger container:

   Find the todo list wrapper (around line 936-967):
   ```tsx
   <div className="space-y-2">
     {filteredTodos.map((todo, index) => (
       <div
         key={todo.id}
         style={{ animationDelay: `${index * 50}ms` }}  // REMOVE THIS
         className={`... animate-fade-in`}
       >
   ```
   
   Replace with:
   ```tsx
   <div className="space-y-2 stagger-container-fast">
     {filteredTodos.map((todo, index) => (
       <div
         key={todo.id}
         className={`... animate-fade-in`}  // No inline style
       >
   ```

3. Find the shared list display in `TodoApp.tsx` (around line 581) and do the same:
   
   Replace:
   ```tsx
   <div
     key={todo.id}
     className="flex items-center gap-2 p-3 bg-canvas rounded-lg border border-hairline"
     style={{ animationDelay: `${index * 50}ms` }}
   >
   ```
   
   With:
   ```tsx
   <div
     key={todo.id}
     className="flex items-center gap-2 p-3 bg-canvas rounded-lg border border-hairline animate-fade-in"
   >
   ```
   (And wrap the parent in `<div className="stagger-container">`)

4. Clean up any remaining `animationDelay` inline styles in other components.

## Boundaries

- Do NOT remove the existing `.stagger-N` classes — other code may use them
- Do NOT make stagger delay longer than 50ms per item (causes perceived slowness)
- Do NOT apply stagger to lists that load dynamically (new items would animate unexpectedly)
- Do NOT use stagger for rapid updates (typing, searching) — only for initial load

## Verification

- **Mechanical**: `astro dev` builds without errors
- **Feel check**:
  1. Load the app — todos should appear with subtle stagger (30-50ms between items)
  2. The stagger should be subtle enough that it doesn't delay interaction
  3. Filtering/searching should NOT trigger stagger (new results should appear immediately)
  4. In DevTools, inspect element and confirm no inline `style` with `animationDelay` on todo items
  5. With `prefers-reduced-motion`, stagger is disabled (handled by plan 002)
- **Done when**: All staggered lists use CSS nth-child patterns, no inline animationDelay styles

## Notes

The `.stagger-container-fast` variant uses 30ms delays for denser lists (like todo items), while default `stagger-container` uses 50ms for sparser layouts. Both are CSS-only — the JS no longer calculates timing.