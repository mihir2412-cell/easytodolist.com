# 003 — Todo list stagger too slow for HIGH-frequency items

- **Status**: TODO
- **Commit**: Not in git repo
- **Severity**: HIGH
- **Category**: Cohesion/Stagger
- **Estimated scope**: 2 files, medium

## Problem

Todo items use `animate-fade-in` which applies `--duration-page: 400ms` per item with `index * 50ms` stagger. For a 10-item list, item 10 doesn't finish animating until 900ms after load. For a 20-item list, 1550ms. This is wrong for HIGH-frequency items that users interact with dozens of times daily.

Locations:
- `TodoApp.tsx:586` — `style={{ animationDelay: `${index * 50}ms` }}`
- `TodoApp.tsx:976` — same stagger pattern
- `global.css:657-659` — `animate-fade-in` uses `var(--duration-page)`

```tsx
{/* Current — slow stagger for every item */}
<div
  style={{ animationDelay: `${index * 50}ms` }}
  className="... animate-fade-in ..."
>
```

## Target

Use `stagger-container-fast` (30ms increments) with a shorter base duration (150-200ms):

```css
/* New utility in global.css */
@keyframes fade-in-fast {
  from {
    opacity: 0;
    transform: translateY(8px); /* subtle, not full 10px */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-fast {
  animation: fade-in-fast 150ms var(--ease-out) forwards;
  opacity: 0; /* start invisible */
}
```

```tsx
{/* Target — use CSS-based stagger, shorter duration */}
<div className="... animate-fade-in-fast stagger-container-fast">
  {/* nth-child handles delay: 0ms, 30ms, 60ms, 90ms... */}
```

**Max wait time**: Item 10 = 30ms × 9 + 150ms = **420ms** (vs 900ms before)
**20-item list**: Item 20 = 30ms × 19 + 150ms = **720ms** (vs 1550ms before)

## Repo conventions to follow

- `.stagger-container-fast` already exists at lines 711-720 with 30ms increments
- Duration token `--duration-normal: 150ms` is perfect for this
- Keep `opacity: 0` to `opacity: 1` animation — no translate needed but subtle translate helps
- All interactive elements should remain functional during animation (already true)

## Steps

1. In `src/styles/global.css`, add a new `fade-in-fast` keyframe with 150ms duration (not reusable token since keyframes need explicit duration):
   ```css
   @keyframes fade-in-fast {
     from { opacity: 0; transform: translateY(8px); }
     to { opacity: 1; transform: translateY(0); }
   }
   
   .animate-fade-in-fast {
     animation: fade-in-fast 150ms var(--ease-out) forwards;
   }
   ```

2. In `TodoApp.tsx`, locate all todo item renders:
   - Line 583-586 (shared list view)
   - Line 971-976 (main todo item)
   
   Replace inline `style={{ animationDelay: ... }}` with CSS class:
   ```tsx
   <div className="... animate-fade-in-fast stagger-container-fast">
   ```
   
   Remove the inline `style` prop that sets stagger delay.

3. For the shared list view (`TodoApp.tsx` around line 583), apply the same class:
   ```tsx
   <div
     className="... animate-fade-in-fast stagger-container-fast"
     style={/* remove animationDelay from here */}
   >
   ```

## Boundaries

- Do NOT remove stagger entirely — the subtle cascade is good for visual hierarchy
- Do NOT reduce item spacing or change layout
- Keep stagger at 30ms max (`.stagger-container-fast`) — this is intentional design
- Duration must be 150ms — fast enough to feel responsive, slow enough to look intentional
- Do NOT apply to bulk selection toolbar or category modal — stagger only for main todo list

## Verification

- **Mechanical**: Build succeeds, all todo items visible immediately in DOM
- **Feel check**:
  - Add 10 todos rapidly — last item should appear within ~420ms total
  - Scroll through list — items feel responsive, not sluggish
  - Existing users with large lists won't feel "stuck" waiting for animations
  - At 10% playback: items cascade in smoothly, no jarring delays
- **Done when**: New todo entry appears within ~200ms, full list renders with subtle stagger under 500ms