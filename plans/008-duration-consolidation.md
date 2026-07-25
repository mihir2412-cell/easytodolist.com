# 008 — Duration token consolidation (check-in, progress-bump)

- **Status**: TODO
- **Commit**: Not in git repo
- **Severity**: MED
- **Category**: Cohesion
- **Estimated scope**: 1 file, small

## Problem

Several animations hardcode 200ms instead of using the `--duration-normal: 150ms` or a shared token. This creates inconsistency and makes future changes harder.

Locations:
- `global.css:1117` — `.check-in` hardcodes 200ms
- `global.css:1138` — `.progress-bump` hardcodes 200ms
- `global.css:1134` — `.task-strikethrough::after` hardcodes 200ms

```css
/* Current — hardcoded values */
.check-in {
  animation: check-in 200ms var(--ease-out) forwards;
}

.progress-bump {
  animation: progress-bump 200ms var(--ease-out);
}
```

**Note:** This plan applies AFTER plans 001 and 002 are completed (since they modify these classes).

## Target

After plan 001/002 rewrite check-in to use transition, align all to a consistent duration:

```css
/* Target — use --duration-normal: 150ms for snappy feedback */
.check-in {
  transition: transform 150ms var(--ease-out), opacity 150ms var(--ease-out);
}

.progress-bump {
  animation: progress-bump 150ms var(--ease-out);
}
```

Or add a dedicated token for completion feedback:

```css
/* If 150ms feels too fast, define: */
--duration-check: 200ms;

/* Then use: */
.check-in {
  transition: transform var(--duration-check) var(--ease-out), opacity var(--duration-check) var(--ease-out);
}
```

## Repo conventions to follow

- Existing tokens: `--duration-fast: 100ms`, `--duration-normal: 150ms`, `--duration-slow: 250ms`
- Hard values should either use tokens or be documented as intentional exceptions
- Duration 150ms = snappy feedback, 200ms = satisfying feedback

## Steps

1. **AFTER plans 001 and 002** are implemented (since they change `.check-in` and `.task-strikethrough`)
2. In `src/styles/global.css`, add a `--duration-check: 200ms` token if 150ms feels too fast:
   ```css
   /* Add to @theme inline section after --duration-page */
   --duration-check: 200ms;    /* Completion toggle, strikethrough */
   ```
3. Update `.progress-bump` to use `--duration-check`:
   ```css
   .progress-bump {
     animation: progress-bump var(--duration-check) var(--ease-out);
   }
   ```

4. If `.check-in` was rewritten to transition, ensure it uses `var(--duration-check)`

## Boundaries

- Do NOT change the visual appearance of animations
- Do NOT rush — 150ms may feel too fast for completion feedback; 200ms is acceptable
- Token name `--duration-check` is descriptive and won't conflict with existing tokens

## Verification

- **Mechanical**: Build succeeds, no hardcoded durations outside tokens
- **Feel check**: Completion toggle and progress bump have consistent timing
- **Done when**: All completion-related animations use the same duration token