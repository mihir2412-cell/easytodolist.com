# 002 — Strikethrough to transition-based animation

- **Status**: TODO
- **Commit**: Not in git repo
- **Severity**: HIGH
- **Category**: Interruptibility
- **Estimated scope**: 1 file, small

## Problem

The strikethrough on completed todos uses a `scaleX(0)` keyframe animation with no easing and no gating. It re-triggers on every state check, not just on actual completion. Most critically, it's non-interruptible — if user uncompletes before the 200ms finishes, the animation completes and restarts, causing visual conflict.

Location: `src/styles/global.css:1121-1135`

```css
/* Current — non-interruptible, no gating, no easing */
.task-strikethrough {
  position: relative;
}

.task-strikethrough::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1.5px;
  background: var(--color-mute);
  transform-origin: left;
  animation: strikethrough-slide 200ms var(--ease-out) forwards;
}

@keyframes strikethrough-slide {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

## Target

Gated transitions that only animate when completion changes:

```css
/* Target — gated, interruptible, uses transition */
.task-strikethrough {
  position: relative;
}

/* The ::after line only appears when .completed class is present */
.task-strikethrough.completed::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1.5px;
  background: var(--color-mute);
  transform-origin: left;
  transform: scaleX(0);
  transition: transform 200ms var(--ease-out);
}

/* Revealed state */
.task-strikethrough.completed.reveal::after {
  transform: scaleX(1);
}

/* Remove animation from anywhere */
.task-strikethrough:not(.completed)::after {
  transform: scaleX(0);
  transition: transform 150ms var(--ease-out);
}
```

## Repo conventions to follow

- Scale from `transform: scaleX(0)` to `scaleX(1)` — no `left` or `width` animation
- Use `--ease-out` from design tokens
- Duration: 200ms enter, 150ms exit (asymmetric — plan 001 uses same)
- CSS transitions are interruptible (react to state changes mid-animation)

## Steps

1. In `src/styles/global.css`, replace the `task-strikethrough` block (lines 1121-1135) and remove the `strikethrough-slide` keyframe with the transition-based style shown in Target.

2. In `TodoApp.tsx`, update the todo item text element to use a CSS class pattern:
   ```tsx
   <span className={`text-body-sm task-strikethrough ${todo.completed ? 'completed reveal' : ''}`}>
     {todo.text}
   </span>
   ```
   The `.reveal` class triggers the animation once, then stays at `scaleX(1)`.

3. Add alternative approach: use CSS `:has()` selector if browser support is acceptable:
   ```css
   .todo-item:has(.checkbox:checked) .task-text::after {
     transform: scaleX(1);
   }
   ```

## Boundaries

- Do NOT touch the check-in animation (plan 001)
- Do NOT animate `width` — must be `transform: scaleX()`
- Do NOT use keyframes — use transition for interruptibility
- Keep duration 200ms enter, 150ms exit (asymmetric per design principles)
- The line should always be `scaleX(0)` when not completed (no animation jank on load)

## Verification

- **Mechanical**: Build succeeds, no visual regressions on completed todos
- **Feel check**:
  - Complete a todo → strikethrough slides in from left over 200ms
  - Uncomplete → strikethrough slides out over 150ms (faster = snappier feel)
  - Spam complete/uncomplete → transitions retarget cleanly, no animation queue
  - At 10% playback: strikethrough should cancel and restart on rapid toggles
- **Done when**: Strikethrough feels responsive and never conflicts with state changes