# 001 — Completion keyframe to interruptible transition

- **Status**: TODO
- **Commit**: Not in git repo
- **Severity**: HIGH
- **Category**: Interruptibility
- **Estimated scope**: 1 file, small

## Problem

The completion checkmark uses a non-interruptible keyframe animation. Spamming the toggle (complete → uncomplete → complete) queues animation restarts, causing visible lag and conflict with re-renders.

Location: `src/styles/global.css:1101-1104, 1117-1119`

```css
/* Current — non-interruptible keyframe */
@keyframes check-in {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.check-in {
  animation: check-in 200ms var(--ease-out) forwards;
}
```

## Target

Convert to CSS `transition` which retargets cleanly mid-animation:

```css
/* Target */
.check-in {
  transform: scale(1);
  opacity: 1;
  transition: transform 200ms var(--ease-out), opacity 200ms var(--ease-out);
}

.check-out {
  transform: scale(0.8);
  opacity: 0;
  transition: transform 150ms var(--ease-out), opacity 150ms var(--ease-out);
}
```

## Repo conventions to follow

- Duration token `--duration-normal: 150ms` for hover states
- Easing token `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`
- Transition classes defined at lines 546-562: `transition-all`, `transition-colors`, `transition-opacity`, `transition-transform`

## Steps

1. In `src/styles/global.css`, replace the `check-in` keyframe and `.check-in` class (around lines 1101-1119) with the transition-based classes shown in Target above.

2. Update `TodoApp.tsx` where `.check-in` is applied — instead of adding/removing the class, drive the visual state via parent container's completion state:
   ```tsx
   {/* Instead of SVG with .check-in class, wrap with conditional */}
   <div className={todo.completed ? 'check-in' : 'check-out'}>
     <svg ...>...</svg>
   </div>
   ```
   Or use inline style transformation for cleaner React integration.

## Boundaries

- Do NOT touch strikethrough animation (handled in plan 002)
- Do NOT add new CSS files
- Do NOT change the actual checkmark appearance
- Keep duration at 200ms for the "in" state (satisfying feedback)
- Keep "out" at 150ms (faster dismissal feels snappy)

## Verification

- **Mechanical**: Build succeeds, no CSS validation errors
- **Feel check**: 
  - Rapidly tap checkbox 5 times in a row — animation must never lag or freeze
  - Checkmark should scale in smoothly on complete, scale out on uncomplete
  - At 10% playback speed (DevTools animations), transitions cancel and restart cleanly
- **Done when**: Spam-clicking toggle shows smooth, lag-free checkmark animation