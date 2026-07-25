# 010 — Add task completion celebration micro-animation

- **Status**: TODO
- **Severity**: LOW (Delight)
- **Category**: Missed Opportunity
- **Estimated scope**: 1 file (TodoApp.tsx), 30-50 lines

## Problem

Completing a task in the todo app is functional but unsatisfying. The checkbox fills and the text just gets struck through — no celebration, no sense of achievement. This is a missed "delight moment" that high-quality apps like Todoist, Linear, and TickTick use to make task management feel rewarding.

Current flow:
1. User clicks checkbox
2. Checkbox fills with color
3. Text strikes through
4. Done (no emotional feedback)

## Target

Add a micro-animation when completing tasks that makes users feel good:

1. **Checkbox pulse** — brief scale animation on the checkmark
2. **Progress bump** — progress bar responds immediately with a micro-jump
3. **Strikethrough animation** — the line-through slides in (text shrinks slightly before striking)
4. **Optional confetti** — on finishing ALL tasks (100%), subtle celebration

```tsx
// Task item completion — visual sequence
<div className={`task-item transition-all
  ${todo.completed ? 'task-completed' : ''}`}>
  
  {/* Checkbox with pulse */}
  <div className={`checkbox ${todo.completed ? 'checkbox-complete' : ''}`}>
    {/* SVG checkmark scales from 0.5 → 1 */}
  </div>
  
  {/* Text with animated strikethrough */}
  <span className="task-text">
    {/* Strikethrough line slides from left to right */}
  </span>
</div>
```

```css
/* Completion animation keyframes */
@keyframes check-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes strikethrough-slide {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes task-complete-bounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.02); }
  60% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

/* Task completion states */
.task-item.task-completed {
  animation: task-complete-bounce 300ms var(--ease-out); /* Brief bounce */
}

.checkbox-complete {
  animation: check-pulse 200ms var(--ease-out);
}

.task-text.completed {
  position: relative;
}

.task-text.completed::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 2px;
  background: var(--color-link);
  animation: strikethrough-slide 200ms var(--ease-out) forwards;
  transform-origin: left;
}
```

## Repo conventions to follow

The codebase uses `.transition-all` and `.animate-*` classes. The task completion animation should feel satisfying but not cartoonish — keep it subtle and professional.

## Steps

1. Open `src/styles/global.css` — add completion animation keyframes after the hero animations:

```css
/* ──────────────────────────────────────────────
   Task Completion Animations
   ────────────────────────────────────────────── */
@keyframes check-in {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes strikethrough-slide {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes task-complete {
  0% { transform: scale(1); }
  30% { transform: scale(1.01); }
  60% { transform: scale(0.99); }
  100% { transform: scale(1); }
}

@keyframes progress-bump {
  0% { transform: scaleY(1); }
  50% { transform: scaleY(1.2); }
  100% { transform: scaleY(1); }
}

/* Completion pulse for checkbox */
.check-in {
  animation: check-in 250ms var(--ease-out) forwards;
}

/* Task item micro-bounce on complete */
.task-completing {
  animation: task-complete 300ms var(--ease-out) forwards;
}

/* Strikethrough line */
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

/* Progress bar bump on change */
.progress-bump {
  animation: progress-bump 200ms var(--ease-out);
}

/* 100% completion celebration */
@keyframes celebration {
  0% { transform: scale(1); filter: hue-rotate(0deg); }
  25% { transform: scale(1.05); filter: hue-rotate(15deg); }
  50% { transform: scale(1.1); filter: hue-rotate(-10deg); }
  75% { transform: scale(1.05); filter: hue-rotate(5deg); }
  100% { transform: scale(1); filter: hue-rotate(0deg); }
}

.progress-complete {
  animation: celebration 600ms var(--ease-out);
}
```

2. Open `src/components/TodoApp.tsx` — modify the todo item to have completion state. Find around line 992:

   The checkbox completion toggle (add `check-in` class when completing):
   ```tsx
   <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0
     ${todo.completed ? 'bg-success border-success check-in' : 'border-hairline'}`}
   >
     {todo.completed && (
       <svg className="w-3 h-3 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
       </svg>
     )}
   </div>
   ```

3. The text strikethrough (add `task-strikethrough` class when completed):
   ```tsx
   <span className={`flex-1 text-body-sm transition-all
     ${todo.completed ? 'line-through text-mute task-strikethrough' : 'text-ink'}`}
   >
     {todo.text}
   </span>
   ```

4. Add progress bar bump effect. Find the progress bar (around line 730) and update:

   ```tsx
   <div
     className={`h-full rounded-full transition-[width] duration-300 ease-out
       ${progress === 100 ? 'bg-success progress-complete' : 'bg-gradient-to-r from-primary to-link'}
       ${isProgressBumping ? 'progress-bump' : ''}`}
     style={{ width: `${progress}%` }}
   />
   ```

   Add bump state logic near the progress calculation:
   ```tsx
   const [isProgressBumping, setIsProgressBumping] = useState(false);
   
   // Add to toggleTodo function, after setTodos:
   const newCompletedCount = newTodos.filter(t => t.completed).length;
   const newProgress = Math.round((newCompletedCount / totalTodos) * 100);
   if (newProgress !== progress && newProgress !== 0) {
     setIsProgressBumping(true);
     setTimeout(() => setIsProgressBumping(false), 200);
   }
   ```

5. Optional: Add a subtle "celebration" state when all tasks complete. In the progress bar wrapper:
   ```tsx
   {progress === 100 && (
     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
       <span className="text-xs text-success animate-fade-in">✓ All done!</span>
     </div>
   )}
   ```

## Boundaries

- Do NOT use confetti, confetti cannons, or external libraries
- Do NOT make animations longer than 300ms — it's a micro-moment, not a spectacle
- Do NOT use bounce easing — keep it as subtle "settle" (scale 1.01 → 0.99 → 1)
- Do NOT add celebration for incomplete states — only for completing tasks

## Verification

- **Mechanical**: `astro dev` builds without errors
- **Feel check**:
  1. Complete a single task — checkbox pulses, text gets strikethrough smoothly
  2. Complete multiple tasks in quick succession — animations play without stacking
  3. The progress bar jumps slightly when progress changes
  4. Complete ALL tasks — progress bar gets a subtle "celebration" color pulse
  5. Toggle `prefers-reduced-motion` — checkmark appears instantly, no slides/bounces
- **Done when**: Task completion feels satisfying and rewarding without being cartoonish

## Notes

This is deliberately subtle — a "just right" amount of delight. The 300ms bounce is barely noticeable but creates a "click registered" feeling. The 100% completion celebration uses hue-rotate for a subtle rainbow shimmer rather than confetti, keeping it elegant.