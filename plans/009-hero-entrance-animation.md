# 009 — Add landing page hero entrance animation

- **Status**: TODO
- **Severity**: LOW (Polish)
- **Category**: Missed Opportunity
- **Estimated scope**: 1 file (global.css), 20 lines + index.astro changes

## Problem

The landing page (`index.astro`) hero section has no entrance animation. The content appears instantly on page load, which feels static and traditional. Visitors don't get the polished "app-like" feeling that entrance animations provide.

Current state: Content visible immediately with no animation hierarchy.

## Target

Add a hierarchical entrance animation:
1. Hero text fades in first (most important)
2. Subheadline follows
3. CTA buttons appear
4. Demo section reveals last

```css
/* Hero entrance animations */
@keyframes hero-title {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-subtitle {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-cta {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-hero-title {
  animation: hero-title 600ms var(--ease-out) forwards;
}

.animate-hero-subtitle {
  animation: hero-subtitle 600ms var(--ease-out) 100ms forwards;
  opacity: 0;
}

.animate-hero-cta {
  animation: hero-cta 600ms var(--ease-out) 200ms forwards;
  opacity: 0;
}

/* Feature pills stagger */
@keyframes hero-features {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Repo conventions to follow

The codebase uses `@keyframes` defined in `global.css` and class-based animations. Hero animations should match the established `.animate-*` pattern.

## Steps

1. Open `src/styles/global.css` — add hero-specific animations after the existing keyframes:

```css
/* ──────────────────────────────────────────────
   Hero Section Entrance Animations
   ────────────────────────────────────────────── */
@keyframes hero-title {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-subtitle {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-cta {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-hero-title {
  animation: hero-title 600ms var(--ease-out) forwards;
}

.animate-hero-subtitle {
  animation: hero-subtitle 600ms var(--ease-out) 100ms forwards;
  opacity: 0;
}

.animate-hero-cta {
  animation: hero-cta 500ms var(--ease-out) 200ms forwards;
  opacity: 0;
}

.animate-hero-demo {
  animation: hero-cta 500ms var(--ease-out) 350ms forwards;
  opacity: 0;
}
```

2. Open `src/pages/index.astro` — apply classes to hero elements. Find and wrap:

   Hero wrapper:
   ```astro
   <section class="relative ...">
   ```
   
   Add class to contain and hide overflow:
   ```astro
   <section class="relative overflow-hidden ...">
   ```

   Title (around line 40-50):
   ```astro
   <!-- OLD -->
   <h1 class="text-4xl sm:text-6xl ...">
   
   <!-- NEW -->
   <h1 class="text-4xl sm:text-6xl animate-hero-title">
   ```

   Subheadline (find the paragraph after h1):
   ```astro
   <!-- OLD -->
   <p class="text-lg sm:text-xl text-body ...">
   
   <!-- NEW -->
   <p class="text-lg sm:text-xl text-body animate-hero-subtitle">
   ```

   CTA buttons wrapper (around line 60-80):
   ```astro
   <!-- OLD -->
   <div class="flex flex-col sm:flex-row gap-3 ...">
   
   <!-- NEW -->
   <div class="flex flex-col sm:flex-row gap-3 animate-hero-cta">
   ```

   Feature pills section (find the `<ul class="flex...">`):
   ```astro
   <!-- OLD -->
   <ul class="flex flex-wrap justify-center ...">
   
   <!-- NEW -->
   <ul class="flex flex-wrap justify-center animate-hero-cta" style="animation-delay: 100ms;">
   ```

   Demo section wrapper (around line 250):
   ```astro
   <!-- Find the demo container and add class -->
   <div class="mt-12 ...">
   
   <!-- NEW -->
   <div class="mt-12 animate-hero-demo">
   ```

3. For the demo section entrance, it's also triggered on scroll. Add Intersection Observer in the `<script>` section or use CSS scroll-driven animations:

   Add to the script section at the bottom of `index.astro`:
   ```javascript
   // Animate elements on scroll into view
   const observerOptions = {
     threshold: 0.1,
     rootMargin: '0px 0px -50px 0px'
   };
   
   const observer = new IntersectionObserver((entries) => {
     entries.forEach(entry => {
       if (entry.isIntersecting) {
         entry.target.classList.add('in-view');
       }
     });
   }, observerOptions);
   
   // Observe scroll-triggered elements
   document.querySelectorAll('[data-scroll]').forEach(el => observer.observe(el));
   ```

## Boundaries

- Do NOT make the animation longer than 600ms — hero should feel fast
- Do NOT use bounce or overshoot easing — keep it professional
- Do NOT animate layout-shifting properties (width, height) — only transform/opacity
- Do NOT add animations to elements below the fold without scroll trigger

## Verification

- **Mechanical**: `astro dev` builds without errors
- **Feel check**:
  1. Open landing page (`/`) — hero should animate in within 200-600ms
  2. The hierarchy (title → subtitle → CTA) should be visible
  3. Demo appears last (after ~350ms), not competing with text
  4. Refresh page — animation replays
  5. With `prefers-reduced-motion` — content appears immediately, no movement
- **Done when**: Hero elements animate in a clear hierarchy on page load

## Notes

The 600ms duration for the title creates a premium "reveal" moment. The delays (100ms, 200ms, 350ms) create a cascade feel without being slow. This matches how Linear, Vercel, and other modern SaaS sites handle hero entrances.