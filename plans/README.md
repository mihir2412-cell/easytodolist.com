# Animation & Design Implementation Plans

This directory contains implementation plans for improving the animation, motion, and polish of EasyTodoList.com.

## ⚠️ Plan Numbering Note

There are **two sets** of plans in this directory:

- **Old Plans (001-011)**: Created in a previous session, may be outdated
- **New Plans (001-010)**: Created in the 2024 audit, based on current codebase

If implementing, check both sets and de-duplicate by file contents, not plan number.

---

## New Plans (2024 Audit)

| # | Title | Severity | Category | Status | Dependencies |
|---|-------|----------|----------|--------|--------------|
| 001 | Completion keyframe to interruptible transition | HIGH | Interruptibility | TODO | — |
| 002 | Strikethrough to transition-based animation | HIGH | Interruptibility | TODO | — |
| 003 | Todo list stagger too slow for HIGH-frequency items | HIGH | Cohesion/Stagger | TODO | — |
| 004 | Width transition triggers layout recalc | MED | Performance | TODO | — |
| 005 | Easing on prose link uses `ease` instead of `ease-out` | MED | Easing | TODO | — |
| 006 | Hero CTA/demo animations exceed 300ms limit | MED | Duration | TODO | — |
| 007 | Shine animation duration too long (1500ms) | MED | Duration | TODO | — |
| 008 | Duration token consolidation | MED | Cohesion | TODO | After 001, 002 |
| 009 | 100% completion has no celebration animation | LOW | Missed Opportunity | TODO | After 001 |
| 010 | Empty state has no entrance animation | LOW | Missed Opportunity | TODO | — |

### New Plans Execution Order

**Phase 1: HIGH Priority**
1. 001 → 002 → 003 (interruptibility + perf)

**Phase 2: MED Priority**
4. 004 → 005 → 006 → 007

**Phase 3: Token + Missed Opportunities**
8. 008 (after 001, 002)
9. 009 (after 001)
10. 010

## Recommended Execution Order

### Phase 1: Critical Performance & Accessibility (Do First)
1. **001 - `transition: all` fix** — Foundation fix, prevents jank
2. **002 - reduced-motion support** — Accessibility requirement
3. **005 - easing tokens** — Sets up everything else

**Rationale:** These create the performance foundation and must be done before polishing.

### Phase 2: Core UI Feel
4. **004 - press feedback** — Makes everything feel responsive
5. **003 - progress bar** — One of the most visible UI elements
6. **006 - modal animations** — User-facing quality improvement

### Phase 3: Polish & Delight
7. **007 - dark mode transition** — Dark mode improvement
8. **008 - stagger consolidation** — CSS-only cleanup
9. **009 - hero entrance** — First impression
10. **010 - task completion** — Daily micro-celebration
11. **011 - drag spring physics** — Desktop polish

## Dependencies

```
001 (transition: all)
    └─▶ 004 (press feedback relies on correct transition)
    └─▶ 005 (easing tokens build on clean transitions)
    └─▶ 006 (modal animations build on easing tokens)

005 (easing tokens)
    └─▶ 002 (reduced motion uses duration token)
    └─▶ 003 (progress bar uses easing token)
    └─▶ 006 (modals use duration-slow)
    └─▶ 008 (stagger uses consistent delays)
    └─▶ 009 (hero uses easing + duration tokens)

002 (reduced motion)
    └─▶ Must be tested with ALL subsequent plans

004 (press feedback)
    └─▶ 011 (drag uses press feedback pattern)
```

## Execution Notes

- **Run `astro dev`** between plans to test changes
- **`prefers-reduced-motion`** should be verified after every plan
- **Test on mobile** for touch-specific interactions
- **Use DevTools Animations panel** to slow playback and check keyframes
- **Keep transitions under 300ms** — if something feels slow, reduce duration

## Verification Checklist

Before considering a plan DONE, verify:
- [ ] `astro dev` builds without errors
- [ ] No console warnings about animations
- [ ] `prefers-reduced-motion: reduce` works correctly
- [ ] Feel check in slow motion (DevTools → Animations → 10% speed)
- [ ] No layout recalculations during animation (DevTools → Performance)
- [ ] Consistent easing across all elements

## Status Legend

- **TODO**: Not started
- **IN PROGRESS**: Being implemented
- **DONE**: Completed and verified
- **BLOCKED**: Waiting on dependency