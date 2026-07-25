# 002 — Add prefers-reduced-motion accessibility support

- **Status**: TODO
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 1-2 files, 30 lines
- **Apple Review**: ✅ CORRECTED — Consolidated duration rules, added dark-mode exclusion

## Problem

The entire codebase has zero handling for `prefers-reduced-motion`. Users who configured their OS to reduce motion experience all animations identically to other users — including keyframe animations, transitions, and movement-based effects. This violates WCAG 2.1 Success Criterion 2.3.3 (Animations from Interactions).

Evidence: `grep -r "prefers-reduced-motion"` returns no results.

Per Apple: *"Reduced motion doesn't mean no feedback — it means a gentler, non-vestibular equivalent. Respond to three independent signals: prefers-reduced-motion, prefers-reduced-transparency, prefers-contrast."*

## Target

Add a `@media (prefers-reduced-motion: reduce)` block that:
- Keeps opacity/color feedback transitions (they aid comprehension)
- Removes position changes, transforms, and keyframe animations
- Applies to all animated elements consistently
- Excludes dark mode transitions (whole-page color morph could trigger vestibular issues)

```css
/* target — appended to global.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 120ms ease-out !important;
  }
  
  /* Keep opacity feedback but remove transforms */
  .transition-all,
  .transition-colors,
  .transition-opacity,
  .transition-transform {
    transition-property: opacity, color, background-color, border-color !important;
    transition-duration: 120ms ease-out !important;
  }
  
  /* Disable all keyframes but keep final state */
  .animate-fade-in,
  .animate-slide-in,
  .animate-modal-in,
  .animate-hero-title,
  .animate-hero-subtitle,
  .animate-hero-cta,
  .animate-hero-demo {
    animation: none;
    opacity: 1;
    transform: none;
  }
  
  /* Disable looped/decorative animations */
  .animate-shine,
  .animate-pulse,
  .stagger-1, .stagger-2, .stagger-3, .stagger-4, .stagger-5 {
    animation: none;
    animation-delay: 0ms !important;
  }
}
```

## Repo conventions to follow

The codebase already has dark mode media queries in `global.css` using `@media (prefers-color-scheme: dark)` pattern. Follow the same structure.

## Steps

1. Open `src/styles/global.css`
2. Find the end of the file (after line 738 `}`) and append:

```css
/* ──────────────────────────────────────────────
   Reduced Motion Support (WCAG 2.3.3)
   ────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  /* Disable all animations/transitions by default */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 120ms ease-out !important;
  }
  
  /* Keep color/opacity feedback for comprehension — remove transform/position */
  .transition-all,
  .transition-colors,
  .transition-opacity,
  .transition-transform {
    transition-property: opacity, color, background-color, border-color !important;
    transition-duration: 120ms ease-out !important;
  }
  
  /* Keep focus visibility for accessibility */
  *:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 2px;
  }
  
  /* Disable all keyframe animations but preserve final state */
  .animate-fade-in,
  .animate-slide-in,
  .animate-modal-in,
  .animate-hero-title,
  .animate-hero-subtitle,
  .animate-hero-cta,
  .animate-hero-demo,
  .check-in,
  .task-completing,
  .task-strikethrough,
  .progress-bump,
  .progress-complete {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  
  /* Remove stagger delays entirely */
  .stagger-container > *,
  .stagger-container-fast > *,
  .stagger-1, .stagger-2, .stagger-3, .stagger-4, .stagger-5 {
    animation-delay: 0ms !important;
  }
  
  /* Disable decorative loops */
  .animate-shine,
  .animate-pulse {
    animation: none !important;
  }
  
  /* Disable dark mode transition — instant switch for reduced motion */
  .dark,
  .dark *,
  :root:not(.dark),
  :root:not(.dark) * {
    transition: none !important;
  }
}
```

3. Add JavaScript check for FAQ accordion in `src/pages/index.astro` to respect reduced motion:

```javascript
// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // FAQ toggles instantly without animation
  document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const content = trigger.nextElementSibling;
      const isHidden = content.classList.contains('hidden');
      content.classList.toggle('hidden', !isHidden);
    });
  });
}
```

## Boundaries

- Do NOT disable all transitions — keep feedback (opacity, color) for comprehension
- Do NOT change the visual appearance in non-reduced-motion mode
- Do NOT use `transition: none` universally — it breaks all state feedback
- Do NOT add JavaScript for motion detection if CSS can handle it

## Verification

- **Mechanical**: `astro dev` builds without errors
- **Feel check**: 
  1. Open DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`
  2. Navigate the app — no sliding, bouncing, or moving elements
  3. Hover buttons — color/opacity feedback still works (120ms)
  4. Checkmark completion shows instantly, no slides/bounces
  5. Toggle dark mode — instant switch, no fade
  6. Hero animation appears instantly, no hierarchy cascade
- **Done when**: OS-level reduced motion setting is respected by the app

## Notes

Per Apple: *"Opacity/color changes that aid comprehension should be kept."* We use 120ms for reduced-motion transitions — fast enough to feel instantaneous but slow enough to register as feedback.

The dark mode transition is explicitly disabled for reduced motion users — a whole-page color morph could trigger vestibular issues despite being a "pretty" effect.