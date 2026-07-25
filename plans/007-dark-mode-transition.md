# 007 — Add dark mode smooth transition

- **Status**: TODO
- **Severity**: MEDIUM
- **Category**: Duration & Cohesion
- **Estimated scope**: 1 file (global.css), 10 lines

## Problem

Dark mode toggles instantly with no transition. Every color (background, text, borders) switches simultaneously, which can cause:
1. **Flash/Jump** — jarring as all colors change at once
2. **Cognitive load** — no context of where the user was
3. **Lost spatial reference** — elements appear to "blink" rather than "transform"

```html
<!-- src/layouts/Layout.astro:117 -->
<!-- Instant toggle, no transition -->
onclick="document.documentElement.classList.toggle('dark'); ..."
```

## Target

Add a 200ms transition to all color properties when dark mode changes. The page should "morph" rather than "flip":

```css
/* In global.css */
:root {
  /* ... existing variables ... */
  
  /* Add transition to all color variables */
  transition: background-color 200ms var(--ease-out),
              color 200ms var(--ease-out),
              border-color 200ms var(--ease-out);
}

/* Exclude key elements that shouldn't transition */
.no-theme-transition {
  transition: none;
}
```

However, for Vercel-style sites, the "instant" toggle is sometimes preferred. To compromise, add a subtle 100ms fade:

```css
:root {
  transition: background-color 200ms var(--ease-out);
}

:root,
:root * {
  transition: background-color 200ms var(--ease-out),
              color 200ms var(--ease-out),
              border-color 200ms var(--ease-out),
              fill 200ms var(--ease-out),
              stroke 200ms var(--ease-out);
}
```

## Repo conventions to follow

The codebase uses `.dark` class on `<html>` element for dark mode. Layout.astro handles the toggle via inline onclick.

## Steps

1. Open `src/styles/global.css`
2. Find the dark mode section (`:root.dark` around line 228) and add a transition class. Add after the dark mode definitions:

```css
/* Dark mode transition — applies when .dark class is present */
.dark,
.dark * {
  transition: background-color var(--duration-normal) var(--ease-out),
              color var(--duration-normal) var(--ease-out),
              border-color var(--duration-normal) var(--ease-out),
              fill var(--duration-normal) var(--ease-out),
              stroke var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out) !important;
}

/* Exclude animations/moving elements from transition */
.dark svg,
.dark [data-animating] {
  transition: none !important;
}

/* Light mode also transitions */
:root:not(.dark),
:root:not(.dark) * {
  transition: background-color var(--duration-normal) var(--ease-out),
              color var(--duration-normal) var(--ease-out),
              border-color var(--duration-normal) var(--ease-out),
              fill var(--duration-normal) var(--ease-out),
              stroke var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out) !important;
}
```

3. In `src/layouts/Layout.astro`, update the toggle to trigger a smooth transition. The current toggle is instant:

   Replace the inline onclick (around line 117):
   ```astro
   onclick="document.documentElement.classList.toggle('dark'); ..."
   ```
   
   With a version that briefly adds a transition class:
   ```astro
   onclick="
     document.documentElement.classList.toggle('dark');
     document.documentElement.classList.add('theme-transition');
     setTimeout(() => document.documentElement.classList.remove('theme-transition'), 300);
     localStorage.setItem('dark-mode', document.documentElement.classList.contains('dark') ? 'true' : 'false');
   "
   ```

4. Add the `.theme-transition` class to `global.css` to ensure transition is active during switch:

```css
.theme-transition,
.theme-transition * {
  transition: background-color var(--duration-normal) var(--ease-out) !important,
              color var(--duration-normal) var(--ease-out) !important,
              border-color var(--duration-normal) var(--ease-out) !important,
              fill var(--duration-normal) var(--ease-out) !important,
              stroke var(--duration-normal) var(--ease-out) !important !important;
}
```

## Boundaries

- Do NOT make the transition longer than 200ms — dark mode shouldn't feel like a fade
- Do NOT animate `transform` or `opacity` for theme changes — only color properties
- Do NOT add `transition: all` — only specific color-related properties
- Exclude video and canvas elements (they don't need theme transitions)

## Verification

- **Mechanical**: `astro dev` builds without errors
- **Feel check**:
  1. Toggle dark mode — all colors should "morph" smoothly over 200ms
  2. Text colors, backgrounds, borders all transition simultaneously
  3. SVG icons (moon/sun) should have subtle color shift
  4. Toggle rapidly — transitions should interleave properly without weird states
  5. Check on landing page, app page, and templates — consistent transition everywhere
- **Done when**: Dark mode feels like a "transform" not a "flash"

## Notes

The `transition: none !important` on `[data-animating]` elements prevents glitches during simultaneous theme switch + animation. This is a common edge case where animations can conflict with theme transitions.