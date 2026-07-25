# 004 — Add press feedback to all clickable elements

- **Status**: TODO
- **Severity**: HIGH
- **Category**: Physicality & Origin
- **Estimated scope**: 3 files, 25 lines

## Problem

Many interactive elements (buttons, links, clickable cards) lack press feedback. When a user clicks or taps:

1. **No visual feedback** — the element looks frozen mid-action
2. **Feels unresponsive** — users can't tell if their click registered
3. **Missing `active:` states** — Tailwind's `hover:` exists but `active:` is often absent

Affected elements include primary buttons, category pills, template cards, and action buttons in `TodoApp.tsx`.

```tsx
// Missing press feedback - feels dead on click
className="inline-flex items-center gap-2 h-10 px-5 text-button-md font-[500] text-on-primary bg-primary rounded-lg sm:rounded-md hover:opacity-90 transition-opacity"

// No active:scale or active:opacity state
```

## Target

Add `active:scale-95` or `active:scale-97` to all pressable elements. This mimics the physical "press in" sensation of a physical button. The scale should be subtle (0.95-0.98) to avoid looking distorted.

```css
/* CSS fallback for elements that need press feedback */
button:active,
a:active,
[role="button"]:active {
  transform: scale(0.97);
  transition: transform 100ms ease-out;
}
```

For Tailwind-style classes:
```tsx
className="... hover:scale-105 active:scale-95 transition-transform"
```

## Repo conventions to follow

- The codebase already uses `hover:scale-105` in `global.css:541`
- `transition-all` is being phased out (see plan 001)
- Use `transition-transform` for hover/active scale effects

## Steps

1. Open `src/components/TodoApp.tsx` — find all buttons and add `active:scale-95`:

   Around line 650:
   ```tsx
   // Add hover:scale-110 active:scale-95 to make buttons feel tactile
   className="w-10 h-10 ... hover:scale-110 active:scale-95"
   ```

   Around line 691:
   ```tsx
   // Primary action button
   className="px-3 py-1 bg-primary text-on-primary rounded text-caption font-[500] hover:opacity-90 active:scale-95 transition-opacity"
   ```

   Around line 1100-1102:
   ```tsx
   // Add button - ADD active:scale-95
   className="inline-flex items-center gap-2 h-10 px-5 text-button-md font-[500] text-on-primary bg-primary rounded-lg sm:rounded-md hover:opacity-90 active:scale-95 transition-opacity"
   ```

   Around line 1134:
   ```tsx
   // Circle buttons with press effect
   className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95"
   ```

2. Open `src/pages/templates.astro` — add press feedback to template cards:
   
   Around line 112:
   ```astro
   <article class="group bg-canvas rounded-lg border border-hairline hover:border-hairline-strong active:scale-[0.98] transition-all hover:shadow-lg overflow-hidden cursor-pointer"
   ```

3. Open `src/pages/index.astro` — add press feedback to CTA buttons:
   
   Around line 69:
   ```astro
   class="inline-flex items-center justify-center h-11 px-6 text-sm font-medium text-on-primary bg-primary rounded-full hover:opacity-90 active:scale-95 transition-opacity w-full sm:w-auto"
   ```
   
   Around line 75:
   ```astro
   class="inline-flex items-center justify-center h-11 px-6 text-sm font-medium text-ink bg-canvas border border-hairline rounded-full hover:border-hairline-strong hover:bg-canvas-soft active:scale-95 transition-all w-full sm:w-auto"
   ```

4. In `global.css`, add a global press feedback rule for semantic buttons (after the hover states section):

   ```css
   /* Global press feedback for buttons */
   @media (hover: hover) and (pointer: fine) {
     button:active:not(:disabled),
     a:active,
     [role="button"]:active {
       transform: scale(0.97);
     }
   }
   
   /* Touch devices - slight press effect on touch */
   @media (hover: none) and (pointer: coarse) {
     button:active:not(:disabled),
     a:active,
     [role="button"]:active {
       opacity: 0.9;
     }
   }
   ```

## Boundaries

- Do NOT add `scale(0)` anywhere — only 0.95-0.98 range
- Do NOT add press feedback to elements that shouldn't be pressable (static text, containers)
- Do NOT change `hover:` states — only add `active:` states
- Keep `opacity-90` on hover for primary buttons

## Verification

- **Mechanical**: `astro dev` builds without errors
- **Feel check**:
  1. Click any button rapidly — it compresses slightly on press, snaps back on release
  2. On mobile, tap buttons — feel the tactile response
  3. Spam-click the delete button — the press feedback works every time without lag
  4. Set DevTools to `prefers-reduced-motion` — press feedback uses opacity fallback
- **Done when**: Every interactive element has satisfying press feedback (scale 0.95-0.98)

## Notes

The `active:scale-95` Tailwind class is equivalent to adding `transform: scale(0.95)` on `:active`. Combined with `transition-transform`, this creates a snappy 100ms press animation. On touch devices without hover, the opacity fallback (0.9) provides similar feedback.