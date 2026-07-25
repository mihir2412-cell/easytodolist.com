# 006 — Add modal/dialog spring animations with scale

- **Status**: TODO
- **Severity**: MEDIUM
- **Category**: Physicality & Origin
- **Estimated scope**: 2 files (TodoApp.tsx, global.css), 25 lines

## Problem

The Category Modal and Shortcuts Help Modal (in `TodoApp.tsx`, lines 1118 and 1163) use `animate-fade-in` with no initial transform. From a physics perspective, a modal appearing from "nothing" (opacity 0 → 1) is jarring. It should:
1. **Start scaled down** (0.95-0.97) to show "emerging"
2. **Scale up with spring** to feel natural
3. **Avoid pure fade** — pure fades have no spatial origin

```tsx
// Current — pure fade, no spatial hint
className="relative w-full max-w-md bg-canvas rounded-lg border border-hairline shadow-xl p-6 animate-fade-in"

// What it should feel like — scale + fade
className="relative w-full max-w-md bg-canvas rounded-lg border border-hairline shadow-xl p-6 animate-modal-in"
```

## Target

Create spring-based modal entry with scale from 0.95 → 1.0:

```css
/* CSS for modal entrance */
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-modal-in {
  animation: modal-in 250ms var(--ease-out) forwards;
}

/* Exit animation — faster, doesn't need spring */
@keyframes modal-out {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
}

.animate-modal-out {
  animation: modal-out 150ms var(--ease-in) forwards;
}
```

For React components, use CSS classes or add `data-state` to control entry/exit animations.

## Repo conventions to follow

- The codebase uses `.animate-fade-in` with `translateY(10px)` — extend this pattern
- Use `var(--ease-out)` for entries (from AUDIT.md)
- Modals should use `transform-origin: center` (exempt from transform-origin rule in AUDIT.md)

## Steps

1. Open `src/styles/global.css` — add modal keyframes after the existing animations (after `.stagger-5` around line 654):

```css
/* Modal entrance/exit animations */
@keyframes modal-in {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modal-out {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  100% {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
}

/* Modal overlay fade */
@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes overlay-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.animate-modal-in {
  animation: modal-in var(--duration-slow) var(--ease-out) forwards;
  transform-origin: center;
}

.animate-modal-out {
  animation: modal-out var(--duration-fast) var(--ease-in) forwards;
  transform-origin: center;
}

.animate-overlay-in {
  animation: overlay-in var(--duration-fast) var(--ease-out) forwards;
}

.animate-overlay-out {
  animation: overlay-out var(--duration-fast) var(--ease-in) forwards;
}
```

2. Open `src/components/TodoApp.tsx` — update Category Modal (around line 1118):

   Replace:
   ```tsx
   <div className="relative w-full max-w-md bg-canvas rounded-lg border border-hairline shadow-xl p-6 animate-fade-in">
   ```
   With:
   ```tsx
   <div className="relative w-full max-w-md bg-canvas rounded-lg border border-hairline shadow-xl p-6 animate-modal-in">
   ```

3. Update the overlay for Category Modal (around line 1117):
   
   Replace:
   ```tsx
   <div className="absolute inset-0 bg-black/50" onClick={() => setShowCategoryModal(false)} />
   ```
   With:
   ```tsx
   <div className="absolute inset-0 bg-black/50 animate-overlay-in" style={{ animationDuration: '150ms' }} onClick={() => setShowCategoryModal(false)} />
   ```

4. Update Shortcuts Modal similarly (around line 1163):
   
   Replace:
   ```tsx
   <div className="relative w-full max-w-md bg-canvas rounded-lg border border-hairline shadow-xl p-6 animate-fade-in">
   ```
   With:
   ```tsx
   <div className="relative w-full max-w-md bg-canvas rounded-lg border border-hairline shadow-xl p-6 animate-modal-in">
   ```

5. Add exit animations. For React, we need state-based animation. Add CSS for state-driven exits:

   In `global.css`, add:
   ```css
   /* For elements that need exit animations controlled by state */
   .modal-exiting {
     animation: modal-out var(--duration-fast) var(--ease-in) forwards;
   }
   
   .overlay-exiting {
     animation: overlay-out var(--duration-fast) var(--ease-in) forwards;
   }
   ```

## Boundaries

- Do NOT use `scale(0)` — always start at 0.95-0.97
- Do NOT use bounce easing on modals — keep it crisp
- Do NOT add `transform-origin` to the modal container that differs from `center` (modals are centered, so center is correct)
- Do NOT make the animation longer than 250ms

## Verification

- **Mechanical**: `astro dev` builds without errors
- **Feel check**:
  1. Open the Category modal — it should scale up + fade in from center (not pop from nothing)
  2. Open the Shortcuts modal — same entrance feel
  3. Close the modal (backdrop click or X button) — faster exit (150ms), feels like snapping away
  4. In DevTools Animations panel, set playback to 10% — confirm scale origin is center
  5. Toggle `prefers-reduced-motion` — modal appears instantly, no scale
- **Done when**: Both modals scale in with spring-like feel, exit faster than they enter

## Notes

The asymmetry (250ms entry / 150ms exit) creates "snap" feel — modals should appear to give the user time to see context, but closing should be quick and decisive. This matches Apple's and Raycast's modal behavior.