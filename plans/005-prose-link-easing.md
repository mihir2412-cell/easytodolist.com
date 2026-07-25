# 005 — Easing on prose link uses `ease` instead of `ease-out`

- **Status**: TODO
- **Commit**: Not in git repo
- **Severity**: MED
- **Category**: Easing
- **Estimated scope**: 1 file, small

## Problem

Prose links use `ease` (default CSS easing) instead of the design system's `--ease-out`. `ease` decelerates at the end, making hover feedback feel sluggish compared to the crisp feel elsewhere in the app.

Location: `src/styles/global.css:903`

```css
/* Current — weak easing */
.prose a,
.prose-lg a {
  color: var(--color-link);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 150ms ease; /* should use var(--ease-out) */
}
```

## Target

Use the design system's easing token:

```css
/* Target */
.prose a,
.prose-lg a {
  color: var(--color-link);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 150ms var(--ease-out), color 150ms var(--ease-out);
}
```

## Repo conventions to follow

- `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` at line 119 — strong start, gentle finish
- Duration 150ms = `--duration-normal` token
- Transition should target only the properties that change (border-color, color)

## Steps

1. In `src/styles/global.css`, update the prose link transition (around line 903):
   - Change `transition: border-color 150ms ease` to `transition: border-color 150ms var(--ease-out), color 150ms var(--ease-out)`
   - Note: `color` wasn't in original but should be added for complete hover feedback

## Boundaries

- Do NOT change the colors (only the easing)
- Do NOT add new selectors
- Keep 150ms duration — appropriate for hover feedback
- Do NOT apply to other elements outside prose links

## Verification

- **Mechanical**: Build succeeds, no CSS errors
- **Feel check**: Hover over a link in the prose content — border color should appear quickly and smoothly
- **Done when**: Links feel as responsive as buttons elsewhere in the app