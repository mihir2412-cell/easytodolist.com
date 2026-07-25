# 003 — Fix progress bar easing and duration

- **Status**: TODO
- **Severity**: HIGH
- **Category**: Physicality & Duration
- **Estimated scope**: 2 files, 10 lines

## Problem

The progress bar in both `TodoApp.tsx` and `DemoTodoList.tsx` uses `transition-all duration-500` with a gradient. This is problematic:

1. **`duration-500`** = 500ms is too slow for a UI element that updates frequently — users see a lagging progress indicator
2. **`transition-all`** triggers expensive layout recalculations (see plan 001)
3. **No initial scale transform** — a completed progress bar should have satisfying feedback
4. **Shine animation** runs infinitely with `ease-in-out` which feels mechanical

```tsx
// src/components/TodoApp.tsx:563
className="h-full bg-gradient-to-r from-[#0070f3] to-[#7928ca] rounded-full transition-all duration-500"
```

```tsx
// src/components/DemoTodoList.tsx:81
className="h-full bg-gradient-to-r from-primary to-link rounded-full transition-all duration-300"
```

## Target

Reduce to 300ms max, use `ease-out` for snappy response, and add micro-interaction on completion:

```tsx
// In JSX — use Tailwind classes
className="h-full bg-gradient-to-r from-primary to-link rounded-full transition-[width] duration-300 ease-out"

// On completion (100%), add a brief scale pulse
className={`h-full rounded-full transition-[width] duration-300 ease-out
  ${progress === 100 ? 'bg-success scale-x-[1.02] scale-y-[1.1]' : 'bg-gradient-to-r from-primary to-link'}`}
```

Alternatively in the style tag for the shine animation (use CSS, not infinite iteration):
```css
@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.progress-shine {
  animation: shine 2s ease-out forwards; /* Run once, don't loop */
}
```

## Repo conventions to follow

- Use `.rounded-full` for circular/fully-rounded elements
- Tailwind v4 classes like `duration-300` map to `transition-duration: 300ms`
- Colors use CSS variables (`from-primary to-link`)

## Steps

1. Open `src/components/TodoApp.tsx` — find the progress bar around line 563:
   
   Replace:
   ```tsx
   className="h-full bg-gradient-to-r from-[#0070f3] to-[#7928ca] rounded-full transition-all duration-500"
   ```
   With:
   ```tsx
   className="h-full bg-gradient-to-r from-primary to-link rounded-full transition-[width] duration-300 ease-out"
   ```

2. Open `src/components/DemoTodoList.tsx` — find the progress bar around line 81:
   
   Replace:
   ```tsx
   className="h-full bg-gradient-to-r from-primary to-link rounded-full transition-all duration-300"
   ```
   With:
   ```tsx
   className="h-full bg-gradient-to-r from-primary to-link rounded-full transition-[width] duration-300 ease-out"
   ```

3. If using the shine animation, update `global.css` to run only once:
   ```css
   @keyframes shine {
     0% { transform: translateX(-100%); }
     100% { transform: translateX(200%); }
   }
   
   .animate-shine {
     animation: shine 1.5s ease-out forwards; /* forwards, not infinite */
   }
   ```

4. Add completion pulse effect in `TodoApp.tsx` — modify the progress bar wrapper to track when progress hits 100%:
   ```tsx
   <div
     className={`h-full rounded-full transition-[width] duration-300 ease-out
       ${progress === 100 ? 'bg-success' : 'bg-gradient-to-r from-primary to-link'}
       ${progressJustHit100 ? 'scale-y-110' : ''}`}
     style={{ width: `${progress}%` }}
   />
   ```
   (Use a `useEffect` with 100ms timeout to add/remove `scale-y-110` class on completion)

## Boundaries

- Do NOT change the progress calculation logic
- Do NOT add new animations beyond what's specified
- Do NOT change the color scheme
- Keep the gradient for the "in-progress" state

## Verification

- **Mechanical**: `astro dev` builds without errors
- **Feel check**:
  1. Add a task — progress should update in ~300ms, not lag
  2. Complete all tasks — watch the progress bar: it should shoot to 100% and feel responsive, not sluggish
  3. Complete tasks rapidly — the bar keeps up without delay
  4. Toggle `prefers-reduced-motion` — the bar should update instantly
- **Done when**: Progress bar feels snappy (≤300ms) and keeps up with rapid task changes

## Notes

The `transition-[width]` Tailwind syntax (v4) explicitly targets only the width property for transition, avoiding the performance issues of `transition-all`. This is the modern Tailwind v4 way to specify transition properties.