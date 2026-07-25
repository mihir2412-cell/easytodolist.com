# 005 — Introduce CSS easing tokens system

- **Status**: TODO
- **Severity**: HIGH
- **Category**: Easing & Token Consistency
- **Estimated scope**: 1 file (global.css), 15-20 lines

## Problem

The codebase uses bare `ease`, `ease-in-out`, `linear`, and `ease-out` throughout — all as built-in CSS keywords. These built-in easings are weak and inconsistent:

1. **`ease`** varies browser-to-browser and doesn't give predictable deceleration
2. **No cohesive motion language** — a dashboard should feel crisp, not bouncy
3. **Hard to maintain** — changing the "feel" requires regex-replacing across files
4. **Inconsistent durations** — some use 150ms, others 200ms, others 300ms

```css
/* Dispersed, inconsistent easings */
transition: all 150ms ease;           /* Too generic */
transition: all 400ms ease-in;         /* Wrong (starts slow) */
transition: opacity 200ms ease-out;    /* Decent but not shared */
```

## Target

Introduce a shared CSS easing token system that defines the **design's motion personality** — crisp, no-nonsense like Vercel's dashboard aesthetic. Add these tokens to `global.css` in the `@theme inline` block:

```css
/* Easing tokens — Crisp dashboard feel, not playful */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* Strong ease-out for UI (default) */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* On-screen movement */
--ease-in: cubic-bezier(0.55, 0, 1, 0.45);         /* Avoid except for rare deliberate entrances */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Only for playful moments */

/* Duration tokens */
--duration-fast: 100ms;      /* Micro-interactions (press, toggle) */
--duration-normal: 150ms;   /* Hover, color changes */
--duration-slow: 250ms;     /* Modals, drawers, panels */
--duration-page: 300ms;     /* Page transitions, reveals */
```

Then update all existing transitions to use these tokens:

```css
.transition-all {
  transition: all var(--duration-normal) var(--ease-out);
}

.transition-colors {
  transition: color var(--duration-normal) var(--ease-out),
              background-color var(--duration-normal) var(--ease-out),
              border-color var(--duration-normal) var(--ease-out);
}
```

## Repo conventions to follow

The codebase already uses `@theme inline` for Tailwind v4 CSS variables. Add easing tokens within this block or as a separate `:root` block for better organization.

## Steps

1. Open `src/styles/global.css`
2. Add easing and duration tokens. In the `@theme inline` block (around line 4-114), add after the existing tokens:

```css
/* ──────────────────────────────────────────────
   Motion Tokens (Easing & Duration)
   ────────────────────────────────────────────── */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* Default: fast start, gentle stop */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* Movement that enters and exits */
--ease-in: cubic-bezier(0.55, 0, 1, 0.45);         /* Avoid in UI unless intentional */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Playful moments only */

--duration-fast: 100ms;    /* Press feedback, toggles */
--duration-normal: 150ms; /* Hover states, color changes */
--duration-slow: 250ms;    /* Modals, panels, drawers */
--duration-page: 300ms;    /* Page-level transitions */
```

3. Update existing transition utility classes (around line 523-527) to use tokens:

```css
/* Updated transition classes with easing tokens */
.transition-all {
  transition-property: transform, opacity, color, background-color, border-color, box-shadow;
  transition-duration: var(--duration-normal);
  transition-timing-function: var(--ease-out);
}

.transition-colors {
  transition-property: color, background-color, border-color;
  transition-duration: var(--duration-normal);
  transition-timing-function: var(--ease-out);
}

.transition-opacity {
  transition-property: opacity;
  transition-duration: var(--duration-normal);
  transition-timing-function: var(--ease-out);
}

.transition-transform {
  transition-property: transform;
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--ease-out);
}
```

4. Update keyframe animations to use easing tokens:

```css
.animate-fade-in {
  animation: fade-in var(--duration-page) var(--ease-out) forwards;
}

.animate-slide-in {
  animation: slide-in var(--duration-page) var(--ease-out) forwards;
}
```

5. Update the `@media (prefers-reduced-motion: reduce)` block (from plan 002) to use the duration token:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: var(--duration-fast) !important;
  }
  /* ... rest of the block */
}
```

## Boundaries

- Do NOT add `bounce` easing to any UI elements by default — only for rare celebration moments
- Do NOT make durations longer than specified (dashboard = crisp, not sluggish)
- Do NOT add easing to `prefers-reduced-motion` block — instant transitions there
- Keep `ease-in` usage minimal (it's never the right choice for exiting UI)

## Verification

- **Mechanical**: `astro dev` builds without errors
- **Feel check**:
  1. Hover on any element — transition should feel fast and responsive (150ms)
  2. Press a button — snap response (100ms)
  3. Open/close a modal — smooth but not sluggish (250ms)
  4. All easings should feel consistent — no element should feel bouncy unless intentionally designed that way
- **Done when**: All transitions use shared tokens, and the overall feel is crisp and consistent

## Notes

The strong ease-out curve `cubic-bezier(0.23, 1, 0.32, 1)` starts fast (responsive) and decelerates gently (no hard stop). This is the industry standard for UI and matches what Raycast, Linear, and Vercel use. The "bounce" easing is reserved for celebration moments (task completion, achievement unlocks) and should be used sparingly.