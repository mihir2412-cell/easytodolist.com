# 001 — Replace `transition: all` anti-pattern

- **Status**: TODO
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 1 file, 20 lines

## Problem

`src/styles/global.css:523` defines `.transition-all` as `transition: all 150ms ease`. Using `transition: all` is a severe performance anti-pattern — it tells the browser to animate **every** property, including layout properties (width, height, margin, padding, top, left) which trigger expensive reflows and cannot be GPU-accelerated.

```css
/* src/styles/global.css:523 — current (WRONG) */
.transition-all { transition: all 150ms ease; }
```

This class is then used on buttons, inputs, cards, and other elements throughout the codebase — potentially causing janky animations on every hover and state change.

## Target

Replace `.transition-all` with explicit, performant properties. Only animate `transform` and `opacity` for GPU acceleration, plus explicit `color`, `background-color`, and `border-color` where needed.

```css
/* target — GPU-accelerated only */
.transition-all {
  transition-property: transform, opacity, color, background-color, border-color, box-shadow;
  transition-duration: 150ms;
  transition-timing-function: var(--ease-out, ease-out);
}
```

Also add a dedicated `.transition-transform` for transform-only animations (for elements that don't need color transitions):

```css
.transition-transform {
  transition-property: transform;
  transition-duration: 150ms;
  transition-timing-function: var(--ease-out, ease-out);
}
```

And update `transition-colors` to use the easing token:

```css
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-duration: 150ms;
  transition-timing-function: var(--ease-out, ease-out);
}
```

## Repo conventions to follow

- The codebase uses CSS custom properties for colors (e.g., `--color-primary`)
- Tailwind v4 with `@theme inline` is already set up
- No changes to `.transition-opacity` (already correct: only opacity)

## Steps

1. Open `src/styles/global.css`
2. Replace the existing `.transition-all` definition (around line 523):
   ```css
   /* OLD */
   .transition-all { transition: all 150ms ease; }
   
   /* NEW */
   .transition-all {
     transition-property: transform, opacity, color, background-color, border-color, box-shadow;
     transition-duration: 150ms;
     transition-timing-function: var(--ease-out, ease-out);
   }
   ```
3. Update `.transition-colors` to use easing token:
   ```css
   /* OLD */
   .transition-colors { transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease; }
   
   /* NEW */
   .transition-colors {
     transition-property: color, background-color, border-color;
     transition-duration: 150ms;
     transition-timing-function: var(--ease-out, ease-out);
   }
   ```
4. Add new `.transition-transform` class after `.transition-opacity`:
   ```css
   /* new class */
   .transition-transform {
     transition-property: transform;
     transition-duration: 150ms;
     transition-timing-function: var(--ease-out, ease-out);
   }
   ```
5. Update `transition-opacity` to use easing token:
   ```css
   /* OLD */
   .transition-opacity { transition: opacity 150ms ease; }
   
   /* NEW */
   .transition-opacity {
     transition-property: opacity;
     transition-duration: 150ms;
     transition-timing-function: var(--ease-out, ease-out);
   }
   ```

## Boundaries

- Do NOT touch any `.animate-*` keyframes
- Do NOT change any component files (JSX/TSX)
- Do NOT add any new CSS properties beyond what's specified
- Do NOT add new dependencies

## Verification

- **Mechanical**: Run `astro dev` and verify no build errors
- **Performance**: Enable DevTools Performance tab, record interaction (hover buttons), confirm no "Layout" or "Paint" events triggered by animated elements
- **Feel check**: Hover various buttons and inputs — they should feel snappy (<150ms response), not sluggish
- **Done when**: DevTools shows no layout recalculation triggered by `.transition-all` elements

## Notes

If you encounter components that broke visually, they were likely relying on unintended property transitions. Verify they have the intended transitions and add `transition: <specific-properties>` if needed.