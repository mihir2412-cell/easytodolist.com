# 006 — Hero CTA/demo animations exceed 300ms limit

- **Status**: TODO
- **Commit**: Not in git repo
- **Severity**: MED
- **Category**: Duration
- **Estimated scope**: 1 file, small

## Problem

Hero CTA buttons use 350ms animation duration, exceeding the stated "UI animations stay under 300ms" budget. These are interactive controls, not decorative reveals.

Locations:
- `global.css:1088` — `.animate-hero-cta 350ms`
- `global.css:1093` — `.animate-hero-demo 350ms`

```css
/* Current */
.animate-hero-cta {
  animation: hero-cta 350ms var(--ease-out) 150ms forwards;
  opacity: 0;
}

.animate-hero-demo {
  animation: hero-cta 350ms var(--ease-out) 250ms forwards;
  opacity: 0;
}
```

## Target

Reduce to 250ms (within 300ms budget):

```css
/* Target */
.animate-hero-cta {
  animation: hero-cta 250ms var(--ease-out) 150ms forwards;
  opacity: 0;
}

.animate-hero-demo {
  animation: hero-cta 250ms var(--ease-out) 250ms forwards;
  opacity: 0;
}
```

## Repo conventions to follow

- `--duration-slow: 250ms` is the appropriate token for modals/panels
- UI animations should stay under 300ms
- These are call-to-action elements that users should reach quickly

## Steps

1. In `src/styles/global.css`, update both `.animate-hero-cta` and `.animate-hero-demo` durations from 350ms to 250ms.

## Boundaries

- Do NOT change delay timings (stagger between CTA and demo is intentional)
- Do NOT change easing (keep `--ease-out`)
- Do NOT change opacity values
- Do NOT apply to other animations

## Verification

- **Mechanical**: Build succeeds
- **Feel check**:
  - Hero section still has smooth staggered entrance
  - CTA buttons feel more responsive
  - At 10% playback: animation completes faster but still visible
- **Done when**: All hero animations under 300ms