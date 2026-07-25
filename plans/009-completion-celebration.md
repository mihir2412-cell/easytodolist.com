# 009 — 100% completion has no celebration animation

- **Status**: TODO
- **Commit**: Not in git repo
- **Severity**: LOW (missed opportunity)
- **Category**: Missed Opportunity
- **Estimated scope**: 1-2 files, small

## Problem

When progress reaches 100%, the icon teleports from a document icon to a checkmark with no animation. The checkmark should animate in to celebrate the accomplishment.

Location: `TodoApp.tsx:715-726`

```tsx
{/* Current — instant swap, no animation */}
{progress === 100 ? (
  <svg className="w-3.5 h-3.5 ...">...check...</svg>
) : (
  <svg className="w-3.5 h-3.5 ...">...document...</svg>
)}
```

## Target

Add `check-in` animation (from plan 001) when progress hits 100%:

```tsx
{/* Target — animate icon on 100% */}
{progress === 100 ? (
  <svg className="w-3.5 h-3.5 check-in">...check...</svg>
) : (
  <svg className="w-3.5 h-3.5 ...">...document...</svg>
)}
```

For the progress bar itself, add `progress-bump` when reaching 100%:

```tsx
<div className={`h-2 ... ${progress === 100 ? 'progress-bump' : ''}`} ... />
```

## Repo conventions to follow

- `.check-in` class already exists (will be transition after plan 001)
- `.progress-bump` keyframe already defined at lines 1111-1115
- Animation should feel satisfying but not excessive — this is a rare moment

## Steps

1. **AFTER plan 001** is implemented (ensures check-in uses transition)

2. In `TodoApp.tsx`, update the progress 100% icon (around line 717):
   ```tsx
   {progress === 100 ? (
     <svg className="w-3.5 h-3.5">...check...</svg>
   ) : (
     <svg className="w-3.5 h-3.5">...document...</svg>
   )}
   ```
   Add the `check-in` class on completion.

3. Add `progress-bump` class to the progress bar fill when complete:
   ```tsx
   <div className={`h-full rounded-full transition-transform progress-fill ${progress === 100 ? 'progress-bump bg-success' : 'bg-gradient-to-r from-primary to-link'}`} 
        style={{ transform: `scaleX(${progress / 100})` }} 
   />
   ```

## Boundaries

- Do NOT add confetti or heavy celebration — personality is "crisp productivity"
- Keep animation subtle: checkmark scales in + progress bar pulses
- Duration 200ms is appropriate (completion is "rare" moment, so slightly longer is okay)
- Do NOT animate continuously — this fires once per session

## Verification

- **Mechanical**: Build succeeds
- **Feel check**:
  - Complete all tasks → checkmark scales in smoothly, progress bar pulses once
  - Works even if user completes last task in rapid succession
- **Done when**: Completing all tasks feels like a small achievement