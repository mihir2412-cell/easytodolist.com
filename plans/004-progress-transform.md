# 004 — Width transition triggers layout recalc

- **Status**: TODO
- **Commit**: Not in git repo
- **Severity**: MED
- **Category**: Performance
- **Estimated scope**: 1 file, medium

## Problem

Progress bar uses inline `transition-[width]` which triggers layout on every frame. Should use GPU-accelerated `transform: scaleX()` instead.

Locations:
- `TodoApp.tsx:567` — shared list progress
- `TodoApp.tsx:734` — main progress bar

```tsx
{/* Current — triggers layout */}
<div
  className="h-full bg-gradient-to-r from-primary to-link rounded-full transition-[width] duration-300 ease-out"
  style={{ width: `${progress}%` }}
/>
```

## Target

Use `transform: scaleX()` for GPU compositing:

```css
/* New utility for percentage-based width animation */
.progress-fill {
  transform-origin: left center;
  transition: transform 300ms var(--ease-out);
}

/* For percentage p, use transform: scaleX(0.75) for 75% */
```

```tsx
{/* Target — GPU-accelerated */}
<div
  className="h-full bg-gradient-to-r from-primary to-link rounded-full progress-fill"
  style={{ transform: `scaleX(${progress / 100})` }}
/>
```

## Repo conventions to follow

- `transform` and `opacity` are GPU-composited (no layout/paint)
- `transition-transform` class exists at lines 564-568 with 100ms duration
- For progress bars, `transform-origin: left` ensures scale starts from left edge
- Duration 300ms is appropriate for progress bar (rarely-spammed UI)

## Steps

1. In `src/styles/global.css`, add the `progress-fill` utility:
   ```css
   .progress-fill {
     transform-origin: left center;
     transition: transform 300ms var(--ease-out);
   }
   ```

2. In `TodoApp.tsx`, find the progress bar implementations:
   
   Line 567 (shared list):
   ```tsx
   {/* Replace transition-[width] with transform + progress-fill */}
   <div
     className="h-full bg-gradient-to-r from-[#0070f3] to-[#7928ca] rounded-full progress-fill"
     style={{ transform: `scaleX(${progress / 100})` }}
   />
   ```
   
   Line 734 (main progress):
   ```tsx
   {/* Same replacement */}
   <div
     className={`h-full rounded-full transition-transform progress-fill ${progress === 100 ? 'bg-success' : 'bg-gradient-to-r from-primary to-link'}`}
     style={{ transform: `scaleX(${progress / 100})` }}
   />
   ```

## Boundaries

- Do NOT change the gradient colors or appearance
- Do NOT remove the rounded corners
- Keep 300ms duration — appropriate for progress feedback
- `transform-origin: left` is required so scale expands from left to right
- Do NOT apply to other elements — this fix is for progress bars only

## Verification

- **Mechanical**: Build succeeds, progress bar visually identical
- **Feel check**:
  - Progress bar still animates smoothly from 0-100%
  - Open DevTools > Layers — progress bar should show "composited" layer
  - No layout shift visible on adjacent elements during animation
- **Done when**: Chrome DevTools shows no "layout" entry in animation timeline