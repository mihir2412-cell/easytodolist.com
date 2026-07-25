# 007 — Shine animation duration too long (1500ms)

- **Status**: TODO
- **Commit**: Not in git repo
- **Severity**: MED
- **Category**: Duration
- **Estimated scope**: 1 file, small

## Problem

The progress bar shine animation runs for 1500ms, which is excessive for a decorative progress update. The shine should be quick and subtle, not a drawn-out effect.

Location: `global.css:676-678`

```css
/* Current — 1500ms is too long */
.animate-shine {
  animation: shine 1.5s var(--ease-out) forwards;
}
```

## Target

Reduce to 600-800ms for a quick, satisfying effect:

```css
/* Target */
.animate-shine {
  animation: shine 700ms var(--ease-out) forwards;
}
```

## Repo conventions to follow

- UI animations under 300ms, but 700ms is acceptable for decorative progress bar shine
- This is a one-time animation (runs once on page load), not interactive

## Steps

1. In `src/styles/global.css`, update `.animate-shine` duration from `1.5s` to `700ms`.

## Boundaries

- Do NOT change the easing (`var(--ease-out)`)
- Do NOT change `@keyframes shine`
- Do NOT add to this animation — it's decorative-only

## Verification

- **Mechanical**: Build succeeds
- **Feel check**: On page load, the progress bar shine effect appears quickly without feeling slow
- **Done when**: Shine completes in under 1 second